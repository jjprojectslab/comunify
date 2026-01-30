"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n/context"
import { ArrowLeft, Globe, Bell, Shield, Loader2, Check, X } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { createClient } from "@/lib/supabase/client"

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n()
  const router = useRouter()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" })
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) {
        setMessage({ type: "error", text: error.message })
      } else {
        setMessage({ type: "success", text: "Contraseña actualizada correctamente" })
        setPasswordForm({ newPassword: "", confirmPassword: "" })
        setIsChangingPassword(false)
      }
    } catch {
      setMessage({ type: "error", text: "Error al actualizar la contraseña" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName="Usuario" userRole="MEMBER" />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
          <h1 className="text-2xl font-bold">{t.header.settings}</h1>
          <p className="text-muted-foreground">{t.header.preferences}</p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t.common.language}
              </CardTitle>
              <CardDescription>Selecciona tu idioma preferido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant={language === "es" ? "default" : "outline"}
                  onClick={() => setLanguage("es")}
                  className={language !== "es" ? "bg-transparent" : ""}
                >
                  Español
                </Button>
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  onClick={() => setLanguage("en")}
                  className={language !== "en" ? "bg-transparent" : ""}
                >
                  English
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>Configura tus preferencias de notificación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Notificaciones por email</Label>
                  <span className="text-sm text-muted-foreground">Próximamente</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Notificaciones push</Label>
                  <span className="text-sm text-muted-foreground">Próximamente</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>Opciones de seguridad de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {message && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                    message.type === "success" 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {message.type === "success" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    {message.text}
                  </div>
                )}
                
                {!isChangingPassword ? (
                  <div className="flex items-center justify-between">
                    <Label>Cambiar contraseña</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-transparent"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva contraseña</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Repite la contraseña"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-transparent"
                        onClick={() => {
                          setIsChangingPassword(false)
                          setPasswordForm({ newPassword: "", confirmPassword: "" })
                          setMessage(null)
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleChangePassword}
                        disabled={isLoading || !passwordForm.newPassword || !passwordForm.confirmPassword}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          "Guardar"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
