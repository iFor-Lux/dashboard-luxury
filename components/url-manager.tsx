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
import { Link, Save, ExternalLink, Edit, X, FolderOpen } from "lucide-react"

interface FileUrl {
  [key: string]: {
    url: string
    path: string
  }
}

export function UrlManager() {
  const [fileUrls, setFileUrls] = useState<FileUrl>({})
  const [editingUrls, setEditingUrls] = useState<FileUrl>({})
  const [lastUrls, setLastUrls] = useState<FileUrl>({}) // Para recordar las últimas URLs
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // URLs por defecto con estructura completa
  const defaultUrls: FileUrl = {
    "Aimbot": {
      url: "https://github.com/iFor-Lux/luxury-files/releases/download/v2.0/Aimbot.txt",
      path: "/storage/emulated/0/Android/data/com.dts.freefireth/files"
    },
    "Holograma": {
      url: "https://github.com/iFor-Lux/luxury-files/releases/download/v2.0/Holograma.txt",
      path: "/storage/emulated/0/Android/data/com.dts.freefireth/files"
    },
    "WallHack": {
      url: "https://github.com/iFor-Lux/luxury-files/releases/download/v2.0/WallHack.txt",
      path: "/storage/emulated/0/Android/data/com.dts.freefireth/files/textures"
    },
    "Aimfov": {
      url: "https://github.com/iFor-Lux/luxury-files/releases/download/v2.0/Aimfov.txt",
      path: "/storage/emulated/0/Android/data/com.dts.freefireth/files/config"
    }
  }

  // Cargar URLs desde Firebase
  useEffect(() => {
    const urlsRef = ref(database, "urls")
    
    const unsubscribe = onValue(urlsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        // Convertir estructura antigua a nueva si es necesario
        const convertedData = convertOldStructure(data)
        setFileUrls(convertedData)
        setEditingUrls(convertedData)
        setLastUrls(convertedData)
      } else {
        // Si no hay datos en Firebase, usar los valores por defecto
        setFileUrls(defaultUrls)
        setEditingUrls(defaultUrls)
        setLastUrls(defaultUrls)
      }
    }, (error) => {
      console.error("Error loading URLs:", error)
      toast.error("Error al cargar las URLs")
    })

    return () => unsubscribe()
  }, [])

  // Convertir estructura antigua (solo strings) a nueva (objetos con url y path)
  const convertOldStructure = (data: any): FileUrl => {
    const converted: FileUrl = {}
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Estructura antigua: solo URL
        converted[key] = {
          url: value,
          path: defaultUrls[key]?.path || "/storage/emulated/0/Android/data/com.dts.freefireth/files"
        }
      } else if (value && typeof value === 'object' && value !== null && 'url' in value) {
        // Estructura nueva: objeto con url y path
        const urlValue = value as { url?: string; path?: string }
        converted[key] = {
          url: urlValue.url || "",
          path: urlValue.path || defaultUrls[key]?.path || "/storage/emulated/0/Android/data/com.dts.freefireth/files"
        }
      }
    })
    
    return converted
  }

  // Guardar URLs en Firebase
  const handleSaveUrls = async () => {
    setLoading(true)
    try {
      const urlsRef = ref(database, "urls")
      await set(urlsRef, editingUrls)
      setFileUrls(editingUrls)
      
      // Actualizar lastUrls solo con las URLs que tienen contenido
      const updatedLastUrls = { ...lastUrls }
      Object.entries(editingUrls).forEach(([key, data]) => {
        if (data.url && data.url.trim() !== "") {
          updatedLastUrls[key] = data
        }
      })
      setLastUrls(updatedLastUrls)
      
      setIsEditing(false)
      toast.success("URLs y rutas guardadas exitosamente")
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
      [key]: {
        ...prev[key],
        url: value
      }
    }))
    // También actualizar las últimas URLs conocidas solo si tiene contenido
    if (value && value.trim() !== "") {
      setLastUrls(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          url: value
        }
      }))
    }
  }

  // Actualizar path individual
  const handlePathChange = (key: string, value: string) => {
    setEditingUrls(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        path: value
      }
    }))
  }

  // Toggle activar/desactivar URL
  const handleToggleUrl = (key: string) => {
    setEditingUrls(prev => {
      const currentData = prev[key] || { url: "", path: "" }
      const isCurrentlyActive = currentData.url && currentData.url.trim() !== ""
      
      if (isCurrentlyActive) {
        // Si está activa, desactivarla (vaciar URL pero mantener path)
        return {
          ...prev,
          [key]: {
            ...currentData,
            url: ""
          }
        }
      } else {
        // Si está inactiva, activarla con la última URL conocida
        const lastKnownData = lastUrls[key] || { url: "", path: currentData.path }
        return {
          ...prev,
          [key]: {
            url: lastKnownData.url,
            path: currentData.path || lastKnownData.path
          }
        }
      }
    })
  }

  // Verificar si una URL está activa
  const isUrlActive = (data: { url: string; path: string }) => {
    return Boolean(data.url && data.url.trim() !== "")
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
    if (isUrlActive({ url, path: "" })) {
      window.open(url, '_blank')
    }
  }

  return (
    <Card className="max-w-4xl mx-auto card-hover">
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
          <div className="space-y-6">
            {Object.entries(isEditing ? editingUrls : fileUrls).map(([key, data]) => (
              <div key={key} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label htmlFor={key} className="flex items-center gap-2 text-lg font-medium">
                    <Link className="h-5 w-5" />
                    {key}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isUrlActive(data)}
                      onCheckedChange={() => isEditing && handleToggleUrl(key)}
                      disabled={!isEditing || loading}
                      className="data-[state=checked]:bg-green-600"
                    />
                    <span className="text-xs text-muted-foreground">
                      {isUrlActive(data) ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Campo URL */}
                  <div className="space-y-2">
                    <Label htmlFor={`${key}-url`} className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      URL de descarga
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`${key}-url`}
                        value={data.url}
                        onChange={(e) => isEditing && handleUrlChange(key, e.target.value)}
                        placeholder={isUrlActive(data) ? `URL para ${key}` : `${key} desactivado`}
                        disabled={!isEditing || loading || !isUrlActive(data)}
                        className={`flex-1 ${!isValidUrl(data.url) && isEditing && isUrlActive(data) ? "border-red-500" : ""} ${!isUrlActive(data) ? "opacity-50" : ""}`}
                      />
                      {!isEditing && isUrlActive(data) && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openUrl(data.url)}
                          disabled={!isValidUrl(data.url)}
                          title="Abrir URL"
                          className="shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Campo Path */}
                  <div className="space-y-2">
                    <Label htmlFor={`${key}-path`} className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Ruta en dispositivo
                    </Label>
                    <Input
                      id={`${key}-path`}
                      value={data.path}
                      onChange={(e) => isEditing && handlePathChange(key, e.target.value)}
                                             placeholder="/storage/emulated/0/Android/data/com.dts.freefireth/files"
                      disabled={!isEditing || loading}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Mensajes de error/información */}
                {!isValidUrl(data.url) && isEditing && isUrlActive(data) && (
                  <p className="text-sm text-red-500">
                    URL inválida. Por favor ingresa una URL válida.
                  </p>
                )}
                {!isUrlActive(data) && (
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
            <p>• Las rutas indican dónde se guardará el archivo en el dispositivo</p>
            <p>• Los cambios se reflejan inmediatamente en la aplicación</p>
            <p>• Usa los switches para activar/desactivar URLs</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
