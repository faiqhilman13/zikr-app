self.addEventListener('push', (event) => {
  let payload = { title: 'A quiet moment for dhikr', body: 'Return when you are ready.', url: '/' };
  try { payload = { ...payload, ...event.data.json() }; } catch (_) { /* keep respectful defaults */ }
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'zikr-reminder',
    data: { url: payload.url }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => 'focus' in client);
    if (!existing) return self.clients.openWindow(target);
    return existing.focus().then((focused) => {
      if (target !== '/' && focused && 'navigate' in focused) return focused.navigate(target);
      return focused;
    });
  }));
});
