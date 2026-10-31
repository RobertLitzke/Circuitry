// This site has moved. Replaces the old app's service worker so an installed
// copy stops serving the old pages: it drops its own caches, unregisters, and
// reloads any open window, which then gets the forwarding page.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const scope = self.registration.scope;
    for (const name of await caches.keys()) if (name.includes(scope)) await caches.delete(name);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
  })());
});
