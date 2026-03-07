"use strict";

/**
 * Visible URL bar and Panic — show when iframe is visible, navigate, home, panic.
 */
(function () {
	const urlBar = document.getElementById("url-bar");
	const urlBarHome = document.getElementById("url-bar-home");
	const urlBarForm = document.getElementById("url-bar-form");
	const urlBarInput = document.getElementById("url-bar-input");
	const frame = document.getElementById("uv-frame");
	const searchEngineInput = document.getElementById("uv-search-engine");

	if (!urlBar || !frame) return;

	function getDecodedUrl() {
		try {
			const src = frame.src || "";
			if (!src || !src.startsWith(location.origin)) return src;
			const path = new URL(src).pathname;

			// Try Scramjet prefix first
			if (typeof __scramjet$config !== "undefined" && __scramjet$config.prefix) {
				const sjPrefix = new URL(__scramjet$config.prefix, location.origin).pathname;
				if (path.startsWith(sjPrefix)) {
					const encoded = path.slice(sjPrefix.length);
					if (encoded) return decodeURIComponent(encoded);
				}
			}

			// Try UV prefix
			const uvPrefix = (typeof __uv$config !== "undefined" && __uv$config.prefix) ? __uv$config.prefix : "/uv/service/";
			const fullUvPrefix = new URL(uvPrefix, location.origin).pathname;
			if (path.startsWith(fullUvPrefix)) {
				const encoded = path.slice(fullUvPrefix.length);
				if (encoded && typeof __uv$config.decodeUrl === "function") {
					return __uv$config.decodeUrl(encoded);
				}
			}
		} catch (e) {}
		return frame.src || "";
	}

	function setUrlBarValue(url) {
		if (urlBarInput) urlBarInput.value = url || "";
	}

	function showUrlBar(url) {
		urlBar.hidden = false;
		setUrlBarValue(url !== undefined ? url : getDecodedUrl());
	}

	function hideUrlBar() {
		urlBar.hidden = true;
		setUrlBarValue("");
	}

	function goToUrl(rawInput) {
		const template = searchEngineInput ? searchEngineInput.value : "https://duckduckgo.com/?q=%s";
		const url = typeof search === "function" ? search(rawInput.trim(), template) : rawInput.trim();
		try {
			let proxyUrl;
			if (typeof __scramjet$config !== "undefined" && __scramjet$config.prefix) {
				proxyUrl = __scramjet$config.prefix + encodeURIComponent(url);
			} else {
				proxyUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
			}
			frame.src = proxyUrl;
			setUrlBarValue(url);
		} catch (e) {}
	}

	urlBarForm.addEventListener("submit", (e) => {
		e.preventDefault();
		if (urlBarInput) goToUrl(urlBarInput.value);
	});

	urlBarHome.addEventListener("click", () => {
		frame.style.display = "none";
		frame.src = "about:blank";
		hideUrlBar();
		if (window.nexusCloak && window.nexusCloak.reset) window.nexusCloak.reset();
	});

	frame.addEventListener("load", () => {
		if (frame.style.display !== "none") setUrlBarValue(getDecodedUrl());
	});

	// Panic: disguise as Google and optionally go to Google
	document.getElementById("url-bar-panic").addEventListener("click", () => {
		if (window.nexusCloak && window.nexusCloak.panic) window.nexusCloak.panic();
		try {
			const url = "https://www.google.com";
			let proxyUrl;
			if (typeof __scramjet$config !== "undefined" && __scramjet$config.prefix) {
				proxyUrl = __scramjet$config.prefix + encodeURIComponent(url);
			} else {
				proxyUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
			}
			frame.src = proxyUrl;
			setUrlBarValue(url);
		} catch (e) {}
	});

	// Keyboard: Ctrl+Shift+P or Cmd+Shift+P = panic
	document.addEventListener("keydown", (e) => {
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
			e.preventDefault();
			document.getElementById("url-bar-panic").click();
		}
	});

	window.nexusUrlBar = {
		show: showUrlBar,
		hide: hideUrlBar,
		setUrl: setUrlBarValue,
		go: goToUrl,
		getDecodedUrl,
	};
})();
