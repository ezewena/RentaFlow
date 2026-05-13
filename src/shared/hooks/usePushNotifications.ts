import { useEffect, useState } from 'react'
import { getToken } from 'firebase/messaging'
import { doc, setDoc } from 'firebase/firestore'
import { db, getMessagingInstance } from '@/shared/lib/firebase'
import { useAuth } from '@/features/auth/AuthContext'
import toast from 'react-hot-toast'

// VAPID key pública — generada en Firebase Console → Project Settings → Cloud Messaging
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? ''

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Espera a que el SW esté activo (puede estar en installing/waiting)
function waitForActiveSW(reg: ServiceWorkerRegistration): Promise<ServiceWorker> {
  return new Promise((resolve) => {
    const sw = reg.active ?? reg.waiting ?? reg.installing
    if (reg.active) { resolve(reg.active); return }
    const target = sw!
    target.addEventListener('statechange', function handler() {
      if (target.state === 'activated') {
        target.removeEventListener('statechange', handler)
        resolve(target)
      }
    })
  })
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    // Reusar registro existente si ya está activo
    const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
    const reg = existing ?? await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    const activeSW = await waitForActiveSW(reg)
    activeSW.postMessage({ type: 'FIREBASE_CONFIG', config: FIREBASE_CONFIG })

    return reg
  } catch (err) {
    console.warn('SW registration failed:', err)
    return null
  }
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [permiso, setPermiso] = useState<NotificationPermission>('default')
  const [tokenGuardado, setTokenGuardado] = useState(false)

  // Sincronizar estado inicial del permiso
  useEffect(() => {
    if ('Notification' in window) {
      setPermiso(Notification.permission)
    }
  }, [])

  const solicitarPermiso = async () => {
    if (!user) return
    if (!('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones')
      return
    }

    try {
      const resultado = await Notification.requestPermission()
      setPermiso(resultado)

      if (resultado !== 'granted') {
        toast.error('Permiso de notificaciones denegado')
        return
      }

      const messaging = await getMessagingInstance()
      if (!messaging) {
        toast.error('Firebase Messaging no está disponible en este navegador')
        return
      }

      const swReg = await registerServiceWorker()

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg ?? undefined,
      })

      if (token) {
        // Guardar token en Firestore para que las Cloud Functions puedan usarlo
        await setDoc(
          doc(db, 'usuarios', user.uid),
          { fcmToken: token, fcmUpdatedAt: new Date().toISOString() },
          { merge: true },
        )
        setTokenGuardado(true)
        toast.success('Notificaciones activadas')
      }
    } catch (err) {
      console.error('Error activando notificaciones:', err)
      toast.error('No se pudieron activar las notificaciones')
    }
  }

  return { permiso, tokenGuardado, solicitarPermiso }
}
