"use strict";

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
const CUSTOM_BOOKMARKS_KEY = "nexus-custom-bookmarks";

function getSettings() {
	try {
		const raw = localStorage.getItem("nexus-cloak-settings");
		if (raw) return JSON.parse(raw);
	} catch (e) {}
	return {};
}

// Load global settings from server and merge with local settings
async function loadGlobalSettings() {
	try {
		const res = await fetch('/api/global-settings');
		const globalSettings = await res.json();
		// Merge global settings with local settings (local takes priority)
		const localSettings = getSettings();
		return { ...globalSettings, ...localSettings };
	} catch (e) {
		// If we can't fetch global settings, just use local
		return getSettings();
	}
}

function encodeProxyUrl(url) {
	// Always use UV encoding
	return __uv$config.prefix + __uv$config.encodeUrl(url);
}

function loadCustomBookmarks() {
	try {
		const raw = localStorage.getItem(CUSTOM_BOOKMARKS_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch (e) {
		return [];
	}
}

function saveCustomBookmarks(bookmarks) {
	try {
		localStorage.setItem(CUSTOM_BOOKMARKS_KEY, JSON.stringify(bookmarks));
	} catch (e) {}
}

function renderCustomBookmarks() {
	const container = document.getElementById("custom-bookmarks");
	if (!container) return;
	const bookmarks = loadCustomBookmarks();
	container.innerHTML = "";

	for (const b of bookmarks) {
		const tile = document.createElement("button");
		tile.type = "button";
		tile.className = "tile custom-tile";
		tile.dataset.url = b.url;
		tile.dataset.custom = "1";
		tile.title = b.name || b.url;

		const remove = document.createElement("span");
		remove.className = "tile-remove";
		remove.setAttribute("data-remove-url", b.url);
		remove.setAttribute("aria-label", "Remove bookmark");
		remove.setAttribute("role", "button");
		remove.setAttribute("tabindex", "0");
		remove.textContent = "x";

		const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		icon.setAttribute("class", "tile-icon");
		icon.setAttribute("viewBox", "0 0 24 24");
		icon.setAttribute("fill", "#00d4ff");
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z");
		icon.appendChild(path);

		const label = document.createElement("span");
		label.textContent = b.name || "Bookmark";

		tile.appendChild(remove);
		tile.appendChild(icon);
		tile.appendChild(label);
		container.appendChild(tile);
	}
}

function normalizeUrl(url) {
	const v = (url || "").trim();
	if (!v) return "";
	if (/^https?:\/\//i.test(v)) return v;
	return "https://" + v;
}

async function navigate(rawInput) {
	error.textContent = "";
	if (errorCode) errorCode.textContent = "";

	// Load global settings from server merged with local settings
	const settings = await loadGlobalSettings();
	const proxyType = settings.proxy || "uv";

	try {
		await registerSW(proxyType);
	} catch (err) {
		error.textContent = "Failed to register service worker: " + err.message;
		return;
	}

	const url = search(rawInput.trim(), searchEngine.value);
	const proxyUrl = encodeProxyUrl(url);

	let wispUrl =
		(location.protocol === "https:" ? "wss" : "ws") +
		"://" +
		location.host +
		"/wisp/";
	if ((await connection.getTransport()) !== "/epoxy/index.mjs") {
		await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
	}

	if (settings.abPopup) {
		const popup = window.open("about:blank", "_blank");
		if (popup) {
			popup.location.href = proxyUrl;
		} else {
			error.textContent = "Popup was blocked. Allow popups or disable about:blank mode.";
		}
		return;
	}

	// IFRAME MODE
	let frame = document.getElementById("uv-frame");
	frame.style.display = "block";
	frame.src = proxyUrl;
	
	// Inject ad blocking CSS if enabled
	if (settings.adBlock !== false) {
		frame.addEventListener('load', function() {
			try {
				const doc = frame.contentDocument || frame.contentWindow.document;
				if (doc) {
					const style = doc.createElement('style');
					style.textContent = `
						/* Ad blocker CSS */
						.ads, .advertisement, .ad-container, .ad-wrapper, .ad-unit, .ad-slot, .ad-banner, .adbox, .ad-banner,
						[class*="ads-"], [class*="ad-"], [id*="ads-"], [id*="ad-"],
						[data-ad], [class*="sponsored"], [class*="promoted"],
						iframe[src*="doubleclick"], iframe[src*="googlesyndication"], iframe[src*="adservice"],
						ins.adsbygoogle, .google-ad, .dfp-ad,
						.advertising, .ad-module, .ad-section, .ad-area,
						.video-ads, .preroll-ad, .midroll-ad,
						display: none !important;
						visibility: hidden !important;
						height: 0 !important;
						width: 0 !important;
						position: absolute !important;
						pointer-events: none !important;
					`;
					doc.head.appendChild(style);
				}
			} catch(e) {}
		}, {once: true});
	}
	
	// Show URL bar based on settings
	const urlBar = document.getElementById("url-bar");
	if (urlBar) {
		if (settings.urlBar !== false) {
			urlBar.hidden = false;
			const urlBarInput = document.getElementById("url-bar-input");
			if (urlBarInput) urlBarInput.value = url;
		} else {
			urlBar.hidden = true;
		}
	}
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	await navigate(address.value);
});

// Tile click handling (works for both static and custom bookmarks)
document.addEventListener("click", async (event) => {
	const removeBtn = event.target.closest(".tile-remove");
	if (removeBtn) {
		event.preventDefault();
		event.stopPropagation();
		const removeUrl = removeBtn.getAttribute("data-remove-url");
		const next = loadCustomBookmarks().filter((b) => b.url !== removeUrl);
		saveCustomBookmarks(next);
		renderCustomBookmarks();
		return;
	}

	const tile = event.target.closest(".tile[data-url]");
	if (!tile) return;
	event.preventDefault();
	await navigate(tile.dataset.url);
});

document.addEventListener("keydown", (event) => {
	const removeBtn = event.target.closest(".tile-remove");
	if (!removeBtn) return;
	if (event.key !== "Enter" && event.key !== " ") return;
	event.preventDefault();
	removeBtn.click();
});

const customBookmarkForm = document.getElementById("custom-bookmark-form");
if (customBookmarkForm) {
	customBookmarkForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const nameInput = document.getElementById("custom-bookmark-name");
		const urlInput = document.getElementById("custom-bookmark-url");
		const name = (nameInput?.value || "").trim();
		const url = normalizeUrl(urlInput?.value || "");

		if (!url) {
			error.textContent = "Enter a bookmark URL first.";
			return;
		}

		const bookmarks = loadCustomBookmarks();
		if (bookmarks.find((b) => b.url === url)) {
			error.textContent = "That bookmark already exists.";
			return;
		}

		if (bookmarks.length >= 18) {
			error.textContent = "Bookmark limit reached (18). Remove one to add another.";
			return;
		}

		bookmarks.push({ name: name || new URL(url).hostname, url });
		saveCustomBookmarks(bookmarks);
		renderCustomBookmarks();
		error.textContent = "";
		nameInput.value = "";
		urlInput.value = "";
	});
}

renderCustomBookmarks();

// Initialize URL bar based on settings
loadGlobalSettings().then(settings => {
	const urlBar = document.getElementById("url-bar");
	if (urlBar && settings.urlBar === false) {
		urlBar.hidden = true;
	}
});
