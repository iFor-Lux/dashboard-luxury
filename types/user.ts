export interface User {
  id: string
  username: string
  password: string
  expirationDate: string
  createdAt: string
  device: string
}

export interface NotificationData {
  title: string
  description: string
  image?: string
  type: "notification" | "in-app"
  frequency?: "once" | "always" // Nueva propiedad
}

export interface UpdateData {
  title: string
  description: string
  version: string
  downloadLink: string
}

export interface Notification {
  id: string
  title: string
  description: string
  image?: string
  type: "notification" | "in-app"
  frequency: "once" | "always" // Nueva propiedad
  timestamp: string
  sent: boolean
  active: boolean // Para controlar si está activa
}
