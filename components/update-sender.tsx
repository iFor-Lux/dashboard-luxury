"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { database } from "@/lib/firebase"
import { ref, set } from "firebase/database"
import { toast } from "sonner"
import { Upload, Smartphone, Link, FileText, AlertCircle, Type } from "lucide-react"

export function UpdateSender() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [version, setVersion] = useState("")
  const [downloadLink, setDownloadLink] = useState("")
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
    if (!version.trim()) {
      setError("La versión es obligatoria")
      return false
    }
    if (!downloadLink.trim()) {
      setError("El link de descarga es obligatorio")
      return false
    }
    if (!isValidUrl(downloadLink.trim())) {
      setError("El link de descarga no es válido")
      return false
    }
    if (!isValidVersion(version.trim())) {
      setError("El formato de versión no es válido (ejemplo: 1.2.0)")
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

  const isValidVersion = (version: string) => {
    // Validar formato de versión (ej: 1.0.0, 2.1, 1.2.3-beta)
    const versionRegex = /^\d+(\.\d+)*(-\w+)?$/
    return versionRegex.test(version)
  }

  const sendUpdate = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Enviando update:", {
        title: title.trim(),
        description: description.trim(),
        version: version.trim(),
        downloadLink: downloadLink.trim(),
      })

      const updateRef = ref(database, "app_update")
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        version: version.trim(),
        downloadLink: downloadLink.trim(),
        timestamp: new Date().toISOString(),
        active: true,
      }

      await set(updateRef, updateData)

      console.log("Update enviado exitosamente")
      toast.success("Update enviado exitosamente a todos los dispositivos")

      // Limpiar formulario
      setTitle("")
      setDescription("")
      setVersion("")
      setDownloadLink("")
      setError("")
    } catch (error) {
      console.error("Error sending update:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(`Error al enviar update: ${errorMessage}`)
      toast.error("Error al enviar update. Revisa la consola para más detalles.")
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
            <Label htmlFor="update-title" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Título del Update *
            </Label>
            <Input
              id="update-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (error) setError("")
              }}
              placeholder="Nueva versión disponible"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="update-description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descripción *
            </Label>
            <Textarea
              id="update-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (error) setError("")
              }}
              placeholder="Descripción de las mejoras y cambios en esta versión"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="update-version" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Versión *
            </Label>
            <Input
              id="update-version"
              value={version}
              onChange={(e) => {
                setVersion(e.target.value)
                if (error) setError("")
              }}
              placeholder="1.2.0"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Formato: 1.2.0 o 2.1 o 1.0.0-beta</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="update-link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link de Descarga *
            </Label>
            <Input
              id="update-link"
              value={downloadLink}
              onChange={(e) => {
                setDownloadLink(e.target.value)
                if (error) setError("")
              }}
              placeholder="https://ejemplo.com/app-v1.2.0.apk"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">URL completa del archivo APK</p>
          </div>

          <Button
            onClick={sendUpdate}
            disabled={loading || !title.trim() || !description.trim() || !version.trim() || !downloadLink.trim()}
            className="w-full btn-primary"
          >
            <Upload className="h-4 w-4 mr-2" />
            {loading ? "Enviando..." : "Enviar Update"}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Todos los campos son obligatorios</p>
            <p>• El update se enviará a todos los usuarios conectados</p>
            <p>• Los usuarios verán un diálogo para descargar la nueva versión</p>
            <p>• Asegúrate de que el link de descarga sea accesible</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
