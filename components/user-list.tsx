"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { User } from "@/types/user"
import { database } from "@/lib/firebase"
import { ref, update, remove } from "firebase/database"
import { toast } from "sonner"
import { Copy, Edit, Trash2, Calendar as CalendarIcon, Smartphone, CheckCircle, XCircle, Clock, User as UserIcon, Search, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface UserListProps {
  users: User[]
  loading: boolean
}

export function UserList({ users, loading }: UserListProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editUsername, setEditUsername] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editExpirationDays, setEditExpirationDays] = useState("")
  const [editCustomDate, setEditCustomDate] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filtrar usuarios basado en el término de búsqueda
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase()
    return user.username.toLowerCase().includes(searchLower)
  })

  const copyCredentials = async (user: User) => {
    const credentials = `Usuario: ${user.username}\nContraseña: ${user.password}\nVence: ${formatDate(user.expirationDate)}`

    try {
      await navigator.clipboard.writeText(credentials)
      toast.success(`Credenciales de "${user.username}" copiadas al portapapeles`)
    } catch (error) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = credentials
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      toast.success(`Credenciales de "${user.username}" copiadas al portapapeles`)
    }
  }

  const deleteUser = async (userId: string, username: string) => {
    setDeleteLoading(userId)
    try {
      const userRef = ref(database, `users/${userId}`)
      await remove(userRef)
      toast.success(`Usuario "${username}" eliminado exitosamente`)
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error(`Error al eliminar usuario "${username}". Verifica tu conexión.`)
    } finally {
      setDeleteLoading(null)
    }
  }

  const editUser = (user: User) => {
    setEditingUser(user)
    setEditUsername(user.username)
    setEditPassword(user.password)

    // Calcular días restantes
    const expiration = new Date(user.expirationDate)
    const now = new Date()
    const diffTime = expiration.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    setEditExpirationDays(Math.max(1, diffDays).toString())
    
    // Establecer fecha personalizada (manejar zona horaria correctamente)
    const expirationDate = new Date(user.expirationDate)
    const year = expirationDate.getFullYear()
    const month = String(expirationDate.getMonth() + 1).padStart(2, '0')
    const day = String(expirationDate.getDate()).padStart(2, '0')
    setEditCustomDate(`${year}-${month}-${day}`)
  }

  const saveEdit = async () => {
    if (!editingUser || !editUsername.trim() || !editPassword.trim()) {
      toast.error("Por favor completa todos los campos")
      return
    }

    setEditLoading(true)
    try {
      const userRef = ref(database, `users/${editingUser.id}`)

      let expirationDate: Date
      if (editCustomDate) {
        // Si hay fecha personalizada, usarla
        expirationDate = new Date(editCustomDate)
      } else {
        // Si no, usar días predefinidos
        expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + Number.parseInt(editExpirationDays))
      }

      await update(userRef, {
        username: editUsername.trim(),
        password: editPassword.trim(),
        expirationDate: expirationDate.toISOString(),
      })

      toast.success(`Usuario "${editUsername.trim()}" actualizado exitosamente`)
      setEditingUser(null)
      setEditCustomDate("")
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Error al actualizar usuario")
    } finally {
      setEditLoading(false)
    }
  }

  const getExpirationStatus = (expirationDate: string) => {
    const expiration = new Date(expirationDate)
    const now = new Date()
    const diffTime = expiration.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      return { status: "expired", days: diffDays, color: "destructive" as const, className: "status-expired" }
    } else if (diffDays <= 7) {
      return { status: "warning", days: diffDays, color: "secondary" as const, className: "status-warning" }
    } else {
      return { status: "active", days: diffDays, color: "default" as const, className: "status-active" }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  }

  useEffect(() => {
    if (isDialogOpen) {
      document.body.classList.add('dialog-blur-bg')
    } else {
      document.body.classList.remove('dialog-blur-bg')
    }
    return () => {
      document.body.classList.remove('dialog-blur-bg')
    }
  }, [isDialogOpen])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="loading-spinner animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario, ID o dispositivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        {searchTerm && (
          <p className="text-xs text-muted-foreground mt-1">
            {filteredUsers.length} de {users.length} usuarios encontrados
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="loading-spinner animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"></div>
            <p className="text-muted-foreground mt-2">Cargando usuarios...</p>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-muted-foreground">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium">
            {searchTerm ? "No se encontraron usuarios" : "No hay usuarios"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm 
              ? "Intenta con otros términos de búsqueda" 
              : "Comienza creando tu primer usuario en la pestaña \"Crear Usuario\""
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers
            .slice()
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            })
            .map((user) => {
              const status = getExpirationStatus(user.expirationDate)
              return (
                <Card key={user.id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium truncate">{user.username}</h3>
                            <p className="text-xs text-muted-foreground truncate mb-1">ID: {user.id}</p>
                            <div className="flex flex-col items-start justify-center my-2 gap-1">
                              <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-primary" />
                                <span className={`text-xs font-semibold ${user.device ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {user.device ? user.device : 'No asignado'}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CalendarIcon className="h-3 w-3" />
                                <span>Vence: {formatDate(user.expirationDate)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Creado: {user.createdAt ? formatDate(user.createdAt) : 'Desconocido'}</span>
                              </div>
                            </div>
                            {/* ACCIONES SOLO EN MÓVIL */}
                            <div className="flex gap-2 mt-2 sm:hidden">
                              <Badge variant={status.color} className={status.className + ' min-w-[48px] justify-center'}>
                                {status.days <= 0 ? "Expirado" : `${status.days} días`}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => editUser(user)}
                                className="interactive-element"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyCredentials(user)}
                                className="interactive-element hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20 dark:hover:border-green-700"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="interactive-element hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:border-red-700"
                                    disabled={deleteLoading === user.id}
                                  >
                                    {deleteLoading === user.id ? (
                                      <div className="loading-spinner animate-spin rounded-full h-4 w-4 border-b-2"></div>
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="glass-effect">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción eliminará permanentemente al usuario <strong>"{user.username}"</strong> de
                                      Firebase. Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUser(user.id, user.username)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Eliminar Usuario
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* ACCIONES SOLO EN ESCRITORIO */}
                      <div className="hidden sm:flex items-center gap-2">
                        <Badge variant={status.color} className={status.className + ' min-w-[48px] justify-center'}>
                          {status.days <= 0 ? "Expirado" : `${status.days} días`}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editUser(user)}
                          className="interactive-element"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCredentials(user)}
                          className="interactive-element hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20 dark:hover:border-green-700"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="interactive-element hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:border-red-700"
                              disabled={deleteLoading === user.id}
                            >
                              {deleteLoading === user.id ? (
                                <div className="loading-spinner animate-spin rounded-full h-4 w-4 border-b-2"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-effect">
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará permanentemente al usuario <strong>"{user.username}"</strong> de
                                Firebase. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUser(user.id, user.username)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Eliminar Usuario
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}

      {/* Modal de edición */}
      <Dialog open={!!editingUser} onOpenChange={(open) => { setEditingUser(open ? editingUser : null); setIsDialogOpen(open); }}>
        <DialogContent className="glass-effect">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario "{editingUser?.username}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Usuario</Label>
              <Input
                id="edit-username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                disabled={editLoading}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Contraseña</Label>
              <Input
                id="edit-password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                disabled={editLoading}
              />
            </div>
            <div>
              <Label htmlFor="edit-expiration">Días de vencimiento</Label>
              <div className="flex gap-2">
                <Select
                  value={editExpirationDays}
                  onValueChange={(value) => {
                    setEditExpirationDays(value)
                    setEditCustomDate("") // Limpiar fecha personalizada
                  }}
                  disabled={editLoading}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar días" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="60">60 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                  </SelectContent>
                </Select>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="interactive-element"
                      disabled={editLoading}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={editCustomDate ? new Date(editCustomDate + 'T00:00:00') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear()
                          const month = String(date.getMonth() + 1).padStart(2, '0')
                          const day = String(date.getDate()).padStart(2, '0')
                          setEditCustomDate(`${year}-${month}-${day}`)
                          setEditExpirationDays("") // Limpiar días predefinidos
                        }
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {editCustomDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Fecha seleccionada: {format(new Date(editCustomDate + 'T00:00:00'), "PPP", { locale: es })}
                </p>
              )}
            </div>

            <Button onClick={saveEdit} disabled={editLoading} className="w-full btn-primary">
              {editLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Agregar el estilo global para el desenfoque
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.innerHTML = `.dialog-blur-bg::before { content: ''; position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,0.4); backdrop-filter: blur(20px); pointer-events: none; }`
  document.head.appendChild(style)
}
