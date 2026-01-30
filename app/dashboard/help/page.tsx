"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/context"
import { ArrowLeft, HelpCircle, MessageCircle, BookOpen, Mail } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default function HelpPage() {
  const { t } = useI18n()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName="Usuario" userRole="MEMBER" />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
          <h1 className="text-2xl font-bold">{t.header.help}</h1>
          <p className="text-muted-foreground">Centro de ayuda y soporte</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Documentación
              </CardTitle>
              <CardDescription>Guías y tutoriales para usar Comunify</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aprende a usar todas las funciones de la plataforma con nuestras guías detalladas.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Preguntas Frecuentes
              </CardTitle>
              <CardDescription>Respuestas a las preguntas más comunes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Encuentra respuestas rápidas a las preguntas más frecuentes de nuestros usuarios.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Soporte
              </CardTitle>
              <CardDescription>Contacta con nuestro equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ¿Necesitas ayuda personalizada? Nuestro equipo está listo para asistirte.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contacto
            </CardTitle>
            <CardDescription>¿Tienes alguna pregunta o sugerencia?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Puedes escribirnos a nuestro correo de soporte y te responderemos lo antes posible.
            </p>
            <Button variant="outline" className="bg-transparent">
              <Mail className="mr-2 h-4 w-4" />
              soporte@comunify.app
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
