"use client"

import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import { initializeAuth } from "@/lib/firebase"

export type UseFirebaseAuthReturn = {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const authenticate = async () => {
      try {
        setLoading(true)
        setError(null)
        const authenticatedUser = await initializeAuth()
        setUser(authenticatedUser as User)
        console.log("Firebase autenticado correctamente")
      } catch (error) {
        console.error("Error de autenticación:", error)
        setError(error instanceof Error ? error.message : "Error de autenticación")
      } finally {
        setLoading(false)
      }
    }

    authenticate()
  }, [])

  return { user, loading, error, isAuthenticated: !!user }
}
