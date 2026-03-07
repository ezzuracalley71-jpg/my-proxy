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

function encodeProxyUrl(url) {
	// Always use UV encoding
	return __uv$config.prefix + __uv$config.encodeUrl(url);
}

async function navigate(rawInput) {
	error.textContent = "";
	if (errorCode) errorCode.textContent = "";

	const settings = getSettings();
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
	
	// Show URL bar
	const urlBar = document.getElementById("url-bar");
	if (urlBar) {
		urlBar.hidden = false;
		const urlBarInput = document.getElementById("url-bar-input");
		if (urlBarInput) urlBarInput.value = url;
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
