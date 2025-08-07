"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { database } from "@/lib/firebase"
import { ref, push, set } from "firebase/database"
import { toast } from "sonner"
import { UserPlus, Calendar, Key, User } from "lucide-react"

export function UserManagement() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [expirationDays, setExpirationDays] = useState("")
  const [loading, setLoading] = useState(false)

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(result)
  }

  const handleCreateUser = async () => {
    if (!username.trim() || !password.trim() || !expirationDays) {
      toast.error("Por favor completa todos los campos")
      return
    }

    if (username.trim().length < 3) {
      toast.error("El usuario debe tener al menos 3 caracteres")
      return
    }

    if (password.trim().length < 4) {
      toast.error("La contraseña debe tener al menos 4 caracteres")
      return
    }

    setLoading(true)
    try {
      const usersRef = ref(database, "users")
      const newUserRef = push(usersRef)

      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + Number.parseInt(expirationDays))

      const userData = {
        username: username.trim(),
        password: password.trim(),
        expirationDate: expirationDate.toISOString(),
        createdAt: new Date().toISOString(),
        device: "",
      }

      await set(newUserRef, userData)

      toast.success(`Usuario "${username.trim()}" creado exitosamente`)
      setUsername("")
      setPassword("")
      setExpirationDays("")
    } catch (error) {
      console.error("Error creating user:", error)
      toast.error("Error al crear usuario. Verifica tu conexión a Firebase.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto card-hover">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Usuario
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa el nombre de usuario"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Contraseña
            </Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña"
                disabled={loading}
              />
              <Button type="button" variant="outline" onClick={generateRandomPassword} disabled={loading} className="interactive-element">
                Generar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Días de vencimiento
            </Label>
            <Select value={expirationDays} onValueChange={setExpirationDays} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="60">60 días</SelectItem>
                <SelectItem value="90">90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreateUser}
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full btn-primary"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {loading ? "Creando..." : "Crear Usuario"}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• El usuario se creará en Firebase Realtime Database</p>
            <p>• Las credenciales se pueden copiar después de la creación</p>
            <p>• La fecha de vencimiento se calcula automáticamente</p>
            <p>• El usuario podrá acceder inmediatamente a la aplicación</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
