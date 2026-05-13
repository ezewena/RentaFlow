import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/shared/lib/firebase'
import { UserStatus } from '@/shared/lib/types'

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID as string | undefined

interface AuthContextType {
  user: User | null
  userStatus: UserStatus | null
  isAdmin: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nombre: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]             = useState<User | null>(null)
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        // El admin siempre tiene acceso sin necesidad de documento en Firestore
        if (ADMIN_UID && u.uid === ADMIN_UID) {
          setUserStatus('active')
          setLoading(false)
          return
        }
        try {
          const snap = await getDoc(doc(db, 'usuarios', u.uid))
          setUserStatus(snap.exists() ? (snap.data().status as UserStatus) : 'pending')
        } catch {
          setUserStatus('pending')
        }
      } else {
        setUserStatus(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (email: string, password: string, nombre: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'usuarios', cred.user.uid), {
      uid: cred.user.uid,
      email,
      nombre,
      status: 'pending',
      creadoEn: serverTimestamp(),
    })
  }

  const logout = async () => {
    await signOut(auth)
  }

  const isAdmin = !!ADMIN_UID && user?.uid === ADMIN_UID

  return (
    <AuthContext.Provider value={{ user, userStatus, isAdmin, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
