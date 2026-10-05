// vite-plugin-pwa が生成する Service Worker に importScripts で読み込ませる
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'レスト終了', {
      body: data.body || '',
      tag: 'rest-timer',
      renotify: true,
      vibrate: [300, 150, 300, 150, 300],
      icon: '/icons/icon-192.png',
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow('/')
    })
  )
})
