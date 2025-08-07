import { initializeApp } from "firebase/app"
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth"
import { getDatabase } from "firebase/database"
import { getMessaging, isSupported } from "firebase/messaging"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const database = getDatabase(app)

// Función para autenticar automáticamente
export const initializeAuth = async () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Usuario autenticado:", user.uid)
        resolve(user)
      } else {
        try {
          console.log("Autenticando anónimamente...")
          const userCredential = await signInAnonymously(auth)
          console.log("Autenticación anónima exitosa:", userCredential.user.uid)
          resolve(userCredential.user)
        } catch (error) {
          console.error("Error en autenticación anónima:", error)
          reject(error)
        }
      }
      unsubscribe()
    })
  })
}

// Messaging solo en el cliente
export const getMessagingInstance = async () => {
  try {
    if (typeof window !== "undefined" && (await isSupported())) {
      return getMessaging(app)
    }
  } catch (error) {
    console.warn("Firebase Messaging no soportado:", error)
  }
  return null
}

export default app
