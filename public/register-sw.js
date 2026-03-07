"use strict";

const swAllowedHostnames = ["localhost", "127.0.0.1"];

async function registerSW(proxyType) {
	if (!navigator.serviceWorker) {
		if (
			location.protocol !== "https:" &&
			!swAllowedHostnames.includes(location.hostname)
		)
			throw new Error("Service workers cannot be registered without https.");

		throw new Error("Your browser doesn't support service workers.");
	}

	const proxy = proxyType || "uv";
	
	if (proxy === "bare") {
		// Bare doesn't need a service worker
		console.log("Using bare server - no service worker needed");
	} else {
		// Default: UV service worker
		await navigator.serviceWorker.register("/uv/sw.js");
	}
}
