"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { database } from "@/lib/firebase"
import { ref, get, set, onValue } from "firebase/database"
import { toast } from "sonner"
import { Link, Save, ExternalLink, Edit, X, Power } from "lucide-react"

interface FileUrl {
  [key: string]: string
}

export function UrlManager() {
  const [fileUrls, setFileUrls] = useState<FileUrl>({})
  const [editingUrls, setEditingUrls] = useState<FileUrl>({})
  const [lastUrls, setLastUrls] = useState<FileUrl>({}) // Para recordar las últimas URLs
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Cargar URLs desde Firebase
  useEffect(() => {
    const urlsRef = ref(database, "urls")
    
    const unsubscribe = onValue(urlsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setFileUrls(data)
        setEditingUrls(data)
        // Guardar las URLs actuales como las últimas conocidas
        setLastUrls(data)
      } else {
        // Si no hay datos en Firebase, usar objetos vacíos
        setFileUrls({})
        setEditingUrls({})
        setLastUrls({})
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
      
      // Actualizar lastUrls solo con las URLs que tienen contenido
      const updatedLastUrls = { ...lastUrls }
      Object.entries(editingUrls).forEach(([key, url]) => {
        if (url && url.trim() !== "") {
          updatedLastUrls[key] = url
        }
      })
      setLastUrls(updatedLastUrls)
      
      setIsEditing(false)
      toast.success("URLs guardadas exitosamente")
    } catch (error) {
      console.error("Error saving URLs:", error)
      toast.error("Error al guardar las URLs")
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
    // También actualizar las últimas URLs conocidas solo si tiene contenido
    if (value && value.trim() !== "") {
      setLastUrls(prev => ({
        ...prev,
        [key]: value
      }))
    }
  }

  // Toggle activar/desactivar URL
  const handleToggleUrl = (key: string) => {
    setEditingUrls(prev => {
      const currentUrl = prev[key] || ""
      const isCurrentlyActive = currentUrl.trim() !== ""
      
      if (isCurrentlyActive) {
        // Si está activa, desactivarla (vaciar)
        return {
          ...prev,
          [key]: ""
        }
      } else {
        // Si está inactiva, activarla con la última URL conocida
        const lastKnownUrl = lastUrls[key] || ""
        return {
          ...prev,
          [key]: lastKnownUrl
        }
      }
    })
  }

  // Verificar si una URL está activa
  const isUrlActive = (url: string) => {
    return Boolean(url && url.trim() !== "")
  }

  // Validar URL
  const isValidUrl = (url: string) => {
    if (!url || url.trim() === "") return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Abrir URL en nueva pestaña
  const openUrl = (url: string) => {
    if (isUrlActive(url)) {
      window.open(url, '_blank')
    }
  }

  return (
    <Card className="max-w-2xl mx-auto card-hover">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "destructive" : "default"}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              {isEditing ? "Cancelar" : "Editar URLs"}
            </Button>
            
            {isEditing && (
              <>
                <Button
                  onClick={handleSaveUrls}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Guardar
                </Button>
              </>
            )}
          </div>

          {/* Lista de URLs */}
          <div className="space-y-4">
            {Object.entries(isEditing ? editingUrls : fileUrls).map(([key, url]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={key} className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    {key}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isUrlActive(url)}
                      onCheckedChange={() => isEditing && handleToggleUrl(key)}
                      disabled={!isEditing || loading}
                      className="data-[state=checked]:bg-green-600"
                    />
                    <span className="text-xs text-muted-foreground">
                      {isUrlActive(url) ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    id={key}
                    value={url}
                    onChange={(e) => isEditing && handleUrlChange(key, e.target.value)}
                    placeholder={isUrlActive(url) ? `URL para ${key}` : `${key} desactivado`}
                    disabled={!isEditing || loading || !isUrlActive(url)}
                    className={`flex-1 ${!isValidUrl(url) && isEditing && isUrlActive(url) ? "border-red-500" : ""} ${!isUrlActive(url) ? "opacity-50" : ""}`}
                  />
                  {!isEditing && isUrlActive(url) && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openUrl(url)}
                      disabled={!isValidUrl(url)}
                      title="Abrir URL"
                      className="shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {!isValidUrl(url) && isEditing && isUrlActive(url) && (
                  <p className="text-sm text-red-500">
                    URL inválida. Por favor ingresa una URL válida.
                  </p>
                )}
                {!isUrlActive(url) && (
                  <p className="text-sm text-muted-foreground">
                    Esta URL está desactivada. Activa el switch para habilitarla.
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Los cambios se guardan automáticamente en Firebase</p>
            <p>• Las URLs deben ser válidas para funcionar en la app móvil</p>
            <p>• Los cambios se reflejan inmediatamente en la aplicación</p>
            <p>• Usa los switches para activar/desactivar URLs</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
