"use strict";

const STORAGE_KEY = "nexus-cloak-settings";

function applyTheme(theme) {
	document.documentElement.setAttribute("data-theme", theme || "system");
}

function applyAccentColor(color) {
	if (color && color !== "default") {
		document.documentElement.style.setProperty("--accent", color);
		document.documentElement.style.setProperty("--accent-dim", color + "80");
		document.documentElement.style.setProperty("--accent-glow", color + "33");
	} else {
		document.documentElement.style.removeProperty("--accent");
		document.documentElement.style.removeProperty("--accent-dim");
		document.documentElement.style.removeProperty("--accent-glow");
	}
}

const FAVICONS = {
	google: "https://www.google.com/favicon.ico",
	drive: "https://ssl.gstatic.com/docs/doclist/images/infinite_arrow_favicon_5.ico",
	docs: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico",
	classroom: "https://www.gstatic.com/classroom/favicon.png",
	gmail: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
	youtube: "https://www.youtube.com/favicon.ico",
};

const DEFAULT_TITLE = "Nexus — Web Proxy";
let faviconEl = null;

function getFaviconEl() {
	if (!faviconEl) {
		faviconEl = document.querySelector('link[rel="shortcut icon"]') || document.querySelector('link[rel="icon"]');
		if (!faviconEl) {
			faviconEl = document.createElement("link");
			faviconEl.rel = "shortcut icon";
			document.head.appendChild(faviconEl);
		}
	}
	return faviconEl;
}

function loadSettings() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			return JSON.parse(raw);
		}
	} catch (e) {}
	return {
		theme: "system",
		proxy: "uv",
		cloakTitle: false,
		cloakTitleValue: "Google",
		cloakFavicon: false,
		cloakFaviconPreset: "google",
		cloakFaviconUrl: "",
		cloakSync: false,
		abPopup: false,
		adBlock: true,
	};
}

// Load global settings from server and merge with local settings
async function loadGlobalSettings() {
	try {
		const res = await fetch('/api/global-settings');
		const globalSettings = await res.json();
		const localSettings = loadSettings();
		return { ...globalSettings, ...localSettings };
	} catch (e) {
		return loadSettings();
	}
}

function saveSettings(s) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
	} catch (e) {}
}

function applyCloak(settings, frame) {
	if (!settings.cloakTitle && !settings.cloakFavicon && !settings.cloakSync) {
		document.title = DEFAULT_TITLE;
		getFaviconEl().href = "/favicon.ico";
		return;
	}

	let title = DEFAULT_TITLE;
	let favicon = "/favicon.ico";

	if (settings.cloakSync && frame) {
		try {
			const doc = frame.contentDocument || frame.contentWindow?.document;
			if (doc) {
				const pageTitle = doc.title;
				if (pageTitle) title = pageTitle;
				const icon = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
				if (icon && icon.href) favicon = icon.href;
			}
		} catch (e) {
			/* cross-origin or not ready */
		}
	}

	if (settings.cloakTitle && !settings.cloakSync) {
		title = settings.cloakTitleValue || "Google";
	}
	if (settings.cloakFavicon && !settings.cloakSync) {
		if (settings.cloakFaviconPreset === "custom" && settings.cloakFaviconUrl) {
			favicon = settings.cloakFaviconUrl;
		} else if (FAVICONS[settings.cloakFaviconPreset]) {
			favicon = FAVICONS[settings.cloakFaviconPreset];
		}
	}

	document.title = title;
	getFaviconEl().href = favicon;
}

function resetCloak() {
	document.title = DEFAULT_TITLE;
	getFaviconEl().href = "/favicon.ico";
}

(function () {
	const toggle = document.getElementById("settings-toggle");
	const panel = document.getElementById("settings-panel");
	const cloakTitle = document.getElementById("cloak-title");
	const cloakTitleValue = document.getElementById("cloak-title-value");
	const cloakFavicon = document.getElementById("cloak-favicon");
	const cloakFaviconPreset = document.getElementById("cloak-favicon-preset");
	const cloakFaviconUrl = document.getElementById("cloak-favicon-url");
	const themeSelect = document.getElementById("theme-select");
	const proxySelect = document.getElementById("proxy-select");
	const cloakSync = document.getElementById("cloak-sync");
	const abPopup = document.getElementById("ab-popup");
	const frame = document.getElementById("uv-frame");

	// Load global settings from server merged with local settings
	loadGlobalSettings().then(settings => {
	// Apply theme immediately
	applyTheme(settings.theme || "system");
	applyAccentColor(settings.accentColor || "#00d4ff");

	// Restore UI
	if (themeSelect) themeSelect.value = settings.theme || "system";
	if (proxySelect) proxySelect.value = settings.proxy || "uv";
	const adBlockToggle = document.getElementById("adblock-toggle");
	if (adBlockToggle) adBlockToggle.checked = settings.adBlock !== false;

	// Color picker buttons
	document.querySelectorAll(".color-btn").forEach(btn => {
		btn.addEventListener("click", () => {
			const color = btn.getAttribute("data-color");
			applyAccentColor(color);
			settings.accentColor = color;
			saveSettings(settings);
			// Update active state
			document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("active"));
			btn.classList.add("active");
		});
		// Set active state for saved color
		if (btn.getAttribute("data-color") === settings.accentColor) {
			btn.classList.add("active");
		}
	});

	cloakTitle.checked = settings.cloakTitle;
	cloakTitleValue.value = settings.cloakTitleValue || "";
	cloakFavicon.checked = settings.cloakFavicon;
	cloakFaviconPreset.value = settings.cloakFaviconPreset || "";
	cloakFaviconUrl.value = settings.cloakFaviconUrl || "";
	cloakSync.checked = settings.cloakSync;
	if (abPopup) abPopup.checked = !!settings.abPopup;
	if (settings.cloakFaviconPreset === "custom") {
		cloakFaviconUrl.style.display = "block";
	}

	// Tab switching
	const tabs = document.querySelectorAll('.settings-tab');
	const pages = document.querySelectorAll('.settings-page');
	
	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const tabId = tab.getAttribute('data-tab');
			
			// Update active tab
			tabs.forEach(t => t.classList.remove('active'));
			tab.classList.add('active');
			
			// Show corresponding page
			pages.forEach(page => {
				page.classList.remove('active');
				if (page.id === 'settings-' + tabId) {
					page.classList.add('active');
				}
			});
		});
	});

	// Toggle panel
	toggle.addEventListener("click", (e) => {
		e.stopPropagation();
		const open = panel.hidden;
		panel.hidden = !open;
		toggle.setAttribute("aria-expanded", open);
	});

	document.addEventListener("click", () => {
		panel.hidden = true;
		toggle.setAttribute("aria-expanded", "false");
	});

	panel.addEventListener("click", (e) => e.stopPropagation());

	// Preset dropdown: show custom URL field
	cloakFaviconPreset.addEventListener("change", () => {
		cloakFaviconUrl.style.display = cloakFaviconPreset.value === "custom" ? "block" : "none";
	});

	function persist() {
		settings = {
			proxy: proxySelect ? proxySelect.value : "uv",
			cloakTitle: cloakTitle.checked,
			cloakTitleValue: cloakTitleValue.value.trim(),
			cloakFavicon: cloakFavicon.checked,
			cloakFaviconPreset: cloakFaviconPreset.value || "",
			cloakFaviconUrl: cloakFaviconUrl.value.trim(),
			cloakSync: cloakSync.checked,
			abPopup: abPopup ? abPopup.checked : false,
			adBlock: document.getElementById('adblock-toggle') ? document.getElementById('adblock-toggle').checked : true,
			theme: themeSelect ? themeSelect.value : "system",
			};
			saveSettings(settings);
			applyTheme(settings.theme);
			applyCloak(settings, frame.style.display !== "none" ? frame : null);
		}
	
		cloakTitle.addEventListener("change", persist);
		cloakTitleValue.addEventListener("input", persist);
		cloakFavicon.addEventListener("change", persist);
		cloakFaviconPreset.addEventListener("change", persist);
		cloakFaviconUrl.addEventListener("input", persist);
		cloakSync.addEventListener("change", persist);
		if (abPopup) abPopup.addEventListener("change", persist);
		if (adBlockToggle) adBlockToggle.addEventListener("change", persist);
		if (themeSelect) themeSelect.addEventListener("change", persist);
		if (proxySelect) proxySelect.addEventListener("change", persist);

	// Apply when iframe loads
	if (frame) {
		const runCloak = () => {
			settings = loadSettings();
			applyCloak(settings, frame);
		};
		frame.addEventListener("load", () => {
			runCloak();
			setTimeout(runCloak, 600);
		});
	}

	// Initial apply
	applyCloak(loadSettings(), null);

	// Expose for index.js: reset when showing home (iframe hidden)
	window.nexusCloak = {
		apply: () => {
			settings = loadSettings();
			applyCloak(settings, frame.style.display !== "none" ? frame : null);
		},
		reset: resetCloak,
		panic: () => {
			cloakTitle.checked = true;
			cloakTitleValue.value = "Google";
			cloakFavicon.checked = true;
			cloakFaviconPreset.value = "google";
			cloakSync.checked = false;
			persist();
		},
	};

	// Reset PIN button
	const resetPinBtn = document.getElementById("reset-pin-btn");
	if (resetPinBtn) {
		resetPinBtn.addEventListener("click", () => {
			try {
				localStorage.removeItem("nx_pin_unlocked");
			} catch (e) {}
			location.reload();
		});
	}
	}); // end loadGlobalSettings.then
})();
