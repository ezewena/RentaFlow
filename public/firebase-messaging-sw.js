// Service Worker para Firebase Cloud Messaging
// Este archivo DEBE estar en /public para que el navegador lo registre en la raíz
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// La config se inyecta desde el cliente al registrar el SW
// Mientras tanto usamos un canal de mensajes para recibirla
let messaging = null

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    const app = firebase.initializeApp(event.data.config)
    messaging = firebase.messaging(app)

    messaging.onBackgroundMessage((payload) => {
      const { title, body, icon } = payload.notification ?? {}
      self.registration.showNotification(title ?? 'RentaFlow', {
        body: body ?? '',
        icon: icon ?? '/icon-192.png',
        badge: '/icon-192.png',
        tag: payload.collapseKey ?? 'rentaflow',
        data: payload.data,
      })
    })
  }
})

// Manejar click en la notificación — abrir/enfocar la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow('/')
    }),
  )
})
