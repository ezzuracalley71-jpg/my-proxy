import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { hostname } from "node:os";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import express from "express";
import wisp from "wisp-server-node";

import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";


const __dirname = dirname(fileURLToPath(import.meta.url));

// Ad blocking list - common ad domains
const AD_DOMAINS = [
	"doubleclick.net",
	"googlesyndication.com",
	"googleadservices.com",
	"google-analytics.com",
	"adsense.google.com",
	"pagead2.googlesyndication.com",
	"adservice.google.com",
	"ads.facebook.com",
	"advertising.com",
	"adnxs.com",
	"adsrvr.org",
	"adform.net",
	"criteo.com",
	"criteo.net",
	"taboola.com",
	"outbrain.com",
	"mgid.com",
	"revcontent.com",
	"zergnet.com",
	"teads.tv",
	"amazon-adsystem.com",
	"media.net",
	"adblade.com",
	"bidswitch.net",
	"casalemedia.com",
	"contextweb.com",
	"pubmatic.com",
	"rubiconproject.com",
	"openx.net",
	"smartadserver.com",
	"sharethrough.com",
	"spotxchange.com",
	"yieldmo.com",
	"adsymptotic.com",
	"adcolony.com",
	"admob.com",
	"adbutler.com",
	"advertise.com",
	"adroll.com",
	"applift.com",
	"appsflyer.com",
	"branch.io",
	"chartboost.com",
	"comscore.com",
	"demdex.net",
	"hotjar.com",
	"moatads.com",
	"mookie1.com",
	"mxptint.net",
	"nativo.com",
	"nexac.com",
	"openx.net",
	"quantserve.com",
	"rfihub.com",
	"richrelevance.com",
	"rlcdn.com",
	"rubiconproject.com",
	"scorecardresearch.com",
	"serving-sys.com",
	"sharethis.com",
	"simpli.fi",
	"spotx.tv",
	"tapad.com",
	"tidaltv.com",
	"traffichaus.com",
	"tvsquared.com",
	"undertone.com",
	"vungle.com",
];

// Check if a domain is an ad domain
function isAdDomain(hostname) {
	const lower = hostname.toLowerCase();
	return AD_DOMAINS.some(ad => lower === ad || lower.endsWith('.' + ad));
}

const app = express();
app.use(express.json());

// Global settings file path
const GLOBAL_SETTINGS_FILE = join(__dirname, "../public/settings.json");

// Load global settings
function loadGlobalSettings() {
	try {
		if (existsSync(GLOBAL_SETTINGS_FILE)) {
			return JSON.parse(readFileSync(GLOBAL_SETTINGS_FILE, 'utf-8'));
		}
	} catch(e) {}
	return {};
}

// Save global settings
function saveGlobalSettings(settings) {
	try {
		writeFileSync(GLOBAL_SETTINGS_FILE, JSON.stringify(settings, null, 2));
		return true;
	} catch(e) {
		return false;
	}
}

// API: get global settings (for client to load)
app.get('/api/global-settings', (req, res) => {
	res.json(loadGlobalSettings());
});

// API: get ad block list
app.get('/api/ad-block-list', (req, res) => {
	res.json(AD_DOMAINS);
});

// Load our publicPath first and prioritize it over UV.
app.use(express.static(join(__dirname, "../public")));

// Load vendor files last.
app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));


// Error for everything else
app.use((req, res) => {
	res.status(404);
	res.sendFile(join(__dirname, "../public/404.html"));
});

const server = createServer();

server.on("request", (req, res) => {
	res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
	res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
	res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Surrogate-Control", "no-store");
	app(req, res);
});
server.on("upgrade", (req, socket, head) => {
	if (req.url.endsWith("/wisp/")) {
		wisp.routeRequest(req, socket, head);
		return;
	} 
	socket.end();
});

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

server.on("listening", () => {
	const address = server.address();

	console.log("Listening on:");
	console.log(`\thttp://localhost:${address.port}`);
	console.log(`\thttp://${hostname()}:${address.port}`);
	console.log(
		`\thttp://${
			address.family === "IPv6" ? `[${address.address}]` : address.address
		}:${address.port}`
	);
});

// https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
	console.log("SIGTERM signal received: closing HTTP server");
	server.close();
	process.exit(0);
}

server.listen({
	port,
});
