"use strict";

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

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

// Quick-launch tiles
document.querySelectorAll(".tile[data-url]").forEach((tile) => {
	tile.addEventListener("click", () => navigate(tile.dataset.url));
});

// Initialize URL bar based on settings
loadGlobalSettings().then(settings => {
	const urlBar = document.getElementById("url-bar");
	if (urlBar && settings.urlBar === false) {
		urlBar.hidden = true;
	}
});
