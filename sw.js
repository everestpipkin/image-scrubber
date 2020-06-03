const filesToCache = [
	'/image-scrubber/',
	'/image-scrubber/scripts/js.js',
	'/image-scrubber/scripts/exif.js',
	'/image-scrubber/scripts/stackblur.js',
	'/image-scrubber/scripts/css.css',
];

const cacheName = 'offline';
self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(cacheName).then(function (cache) {
			return cache.addAll(filesToCache);
		})
			.then(() => self.skipWaiting())
			.catch(function (e) {
				console.error(e);
			})
	);
});

self.addEventListener('activate', event => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
	var request = event.request;
	if (request.method === 'GET') {
		event.respondWith(
			caches.open(cacheName)
				.then(cache => cache.match(event.request))
				.then(response => response || fetch(event.request))
		);
	}
});
