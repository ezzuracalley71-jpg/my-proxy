// Nexus — Scramjet config
(function () {
	self.__scramjet$config = {
		prefix: "/scramjet/service/",
		codec: self.__scramjet$codecs ? self.__scramjet$codecs.plain : undefined,
		config: "/scramjet.config.js",
		bundle: "/scramjet/scramjet.bundle.js",
		worker: "/scramjet/scramjet.worker.js",
		client: "/scramjet/scramjet.client.js",
		codecs: "/scramjet/scramjet.codecs.js",
	};
})();
