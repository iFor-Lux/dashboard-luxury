"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { database } from "@/lib/firebase"
import { ref, get, set, onValue } from "firebase/database"
import { toast } from "sonner"
import { Link, Save, RefreshCw, ExternalLink } from "lucide-react"

interface FileUrl {
  [key: string]: string
}

export function UrlManager() {
  const [fileUrls, setFileUrls] = useState<FileUrl>({})
  const [editingUrls, setEditingUrls] = useState<FileUrl>({})
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // URLs por defecto
  const defaultUrls: FileUrl = {
    "Aimbot": "https://github.com/iFor-Lux/luxury-files/releases/download/v2.0/Aimbot.txt",
    "Holograma": "https://github.com/iFor-Lux/luxury-files/releases/download/v2.0/Holograma.txt",
    "WallHack": "https://github.com/iFor-Lux/luxury-files/releases/download/v2.0/WallHack.txt",
    "Aimfov": "https://github.com/iFor-Lux/luxury-files/releases/download/v2.0/Aimfov.txt"
  }

  // Cargar URLs desde Firebase
  useEffect(() => {
    const urlsRef = ref(database, "urls")
    
    const unsubscribe = onValue(urlsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setFileUrls(data)
        setEditingUrls(data)
      } else {
        // Si no hay datos en Firebase, usar los valores por defecto
        setFileUrls(defaultUrls)
        setEditingUrls(defaultUrls)
      }
    }, (error) => {
      console.error("Error loading URLs:", error)
      toast.error("Error al cargar las URLs")
    })

    return () => unsubscribe()
  }, [])

  // Guardar URLs en Firebase
  const handleSaveUrls = async () => {
    setLoading(true)
    try {
      const urlsRef = ref(database, "urls")
      await set(urlsRef, editingUrls)
      setFileUrls(editingUrls)
      setIsEditing(false)
      toast.success("URLs guardadas exitosamente")
    } catch (error) {
      console.error("Error saving URLs:", error)
      toast.error("Error al guardar las URLs")
    } finally {
      setLoading(false)
    }
  }

  // Restaurar URLs por defecto
  const handleResetUrls = async () => {
    setLoading(true)
    try {
      const urlsRef = ref(database, "urls")
      await set(urlsRef, defaultUrls)
      setFileUrls(defaultUrls)
      setEditingUrls(defaultUrls)
      setIsEditing(false)
      toast.success("URLs restauradas a valores por defecto")
    } catch (error) {
      console.error("Error resetting URLs:", error)
      toast.error("Error al restaurar las URLs")
    } finally {
      setLoading(false)
    }
  }

  // Actualizar URL individual
  const handleUrlChange = (key: string, value: string) => {
    setEditingUrls(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Validar URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Abrir URL en nueva pestaña
  const openUrl = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <Card className="max-w-4xl mx-auto card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Gestor de URLs de Botones
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gestiona los enlaces de los botones de la aplicación móvil
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "destructive" : "default"}
              disabled={loading}
            >
              {isEditing ? "Cancelar Edición" : "Editar URLs"}
            </Button>
            
            {isEditing && (
              <>
                <Button
                  onClick={handleSaveUrls}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </Button>
                
                <Button
                  onClick={handleResetUrls}
                  variant="outline"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Restaurar por Defecto
                </Button>
              </>
            )}
          </div>

          {/* Lista de URLs */}
          <div className="grid gap-4">
            {Object.entries(isEditing ? editingUrls : fileUrls).map(([key, url]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm font-medium">
                  {key}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={key}
                    value={url}
                    onChange={(e) => isEditing && handleUrlChange(key, e.target.value)}
                    placeholder={`URL para ${key}`}
                    disabled={!isEditing || loading}
                    className={!isValidUrl(url) && isEditing ? "border-red-500" : ""}
                  />
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openUrl(url)}
                      disabled={!isValidUrl(url)}
                      title="Abrir URL"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {!isValidUrl(url) && isEditing && (
                  <p className="text-sm text-red-500">
                    URL inválida. Por favor ingresa una URL válida.
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Información:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Los cambios se guardan automáticamente en Firebase Realtime Database</li>
              <li>• Las URLs deben ser válidas para que funcionen en la aplicación móvil</li>
              <li>• Puedes restaurar los valores por defecto en cualquier momento</li>
              <li>• Los cambios se reflejan inmediatamente en la aplicación móvil</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
