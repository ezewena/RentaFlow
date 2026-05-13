import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Forzar long-polling HTTP en lugar de WebSockets/gRPC-Web
// Soluciona bloqueos de red en entornos con firewall o ISP restrictivos
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
})

export const functions = getFunctions(app, 'us-central1')

export const getMessagingInstance = async () => {
  const supported = await isSupported()
  return supported ? getMessaging(app) : null
}
