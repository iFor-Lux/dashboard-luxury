"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { database } from "@/lib/firebase"
import { ref, push } from "firebase/database"
import { toast } from "sonner"
import { Send, Bell, MessageSquare, ImageIcon, AlertCircle, RefreshCw, Eye, Info, Type } from "lucide-react"

export function NotificationSender() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState("")
  const [type, setType] = useState<"notification" | "in-app">("notification")
  const [frequency, setFrequency] = useState<"once" | "always">("once")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const validateForm = () => {
    if (!title.trim()) {
      setError("El título es obligatorio")
      return false
    }
    if (!description.trim()) {
      setError("La descripción es obligatoria")
      return false
    }
    if (title.trim().length < 3) {
      setError("El título debe tener al menos 3 caracteres")
      return false
    }
    if (description.trim().length < 10) {
      setError("La descripción debe tener al menos 10 caracteres")
      return false
    }
    if (image.trim() && !isValidUrl(image.trim())) {
      setError("La URL de la imagen no es válida")
      return false
    }
    setError("")
    return true
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const sendNotification = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Enviando notificación:", {
        title: title.trim(),
        description: description.trim(),
        type,
        frequency: type === "in-app" ? frequency : undefined,
      })

      const notificationsRef = ref(database, "notifications")
      const notificationData = {
        title: title.trim(),
        description: description.trim(),
        image: image.trim() || null,
        type,
        frequency: type === "in-app" ? frequency : "once", // Solo aplicar frequency a in-app
        timestamp: new Date().toISOString(),
        sent: true,
        active: true,
        id: Date.now().toString(),
      }

      await push(notificationsRef, notificationData)

      console.log("Notificación enviada exitosamente")

      const frequencyText =
        type === "in-app"
          ? frequency === "once"
            ? " (se mostrará una sola vez)"
            : " (se mostrará siempre al iniciar la app)"
          : ""

      toast.success(
        `${type === "notification" ? "Notificación push" : "Mensaje in-app"} enviado exitosamente${frequencyText}`,
      )

      // Limpiar formulario
      setTitle("")
      setDescription("")
      setImage("")
      setError("")
    } catch (error) {
      console.error("Error sending notification:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(`Error al enviar notificación: ${errorMessage}`)
      toast.error("Error al enviar notificación. Revisa la consola para más detalles.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto card-hover">
      <CardContent className="p-6">
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive" className="alert-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="notification-type" className="flex items-center gap-2">
              {type === "notification" ? <Bell className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              Tipo de Notificación
            </Label>
            <Select
              value={type}
              onValueChange={(value: "notification" | "in-app") => setType(value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notification">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notificación Push
                  </div>
                </SelectItem>
                <SelectItem value="in-app">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    In-App Messaging
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mostrar opción de frecuencia solo para In-App Messaging */}
          {type === "in-app" && (
            <div className="space-y-2">
              <Label htmlFor="notification-frequency" className="flex items-center gap-2">
                {frequency === "once" ? <Eye className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                Frecuencia de Visualización
              </Label>
              <Select
                value={frequency}
                onValueChange={(value: "once" | "always") => setFrequency(value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <div>
                        <div>Mostrar una vez</div>
                        <div className="text-xs text-muted-foreground">Se muestra solo la primera vez</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="always">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      <div>
                        <div>Mostrar siempre</div>
                        <div className="text-xs text-muted-foreground">Se muestra cada vez que inicia la app</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Badge informativo */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>
                  {frequency === "once" ? "El mensaje se mostrará solo una vez por usuario" : "El mensaje se mostrará cada vez que el usuario abra la aplicación"}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notification-title" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Título *
            </Label>
            <Input
              id="notification-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (error) setError("")
              }}
              placeholder="Título de la notificación"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-description" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Descripción *
            </Label>
            <Textarea
              id="notification-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (error) setError("")
              }}
              placeholder="Descripción de la notificación"
              rows={3}
              disabled={loading}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">{description.length}/500 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Imagen (URL - Opcional)
            </Label>
            <Input
              id="notification-image"
              value={image}
              onChange={(e) => {
                setImage(e.target.value)
                if (error) setError("")
              }}
              placeholder="https://ejemplo.com/imagen.jpg"
              disabled={loading}
            />
          </div>

          <Button
            onClick={sendNotification}
            disabled={loading || !title.trim() || !description.trim()}
            className="w-full btn-primary"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? "Enviando..." : "Enviar Notificación"}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Los campos marcados con * son obligatorios</p>
            <p>• Las notificaciones push aparecen en la bandeja del sistema</p>
            <p>• Los mensajes in-app aparecen dentro de la aplicación</p>
            <p>• Se enviará a todos los usuarios conectados</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
