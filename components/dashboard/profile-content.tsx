"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/context"
import { ArrowLeft, User, Mail, Building2, MapPin, Shield } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  organization: {
    id: string
    name: string
    slug: string
  } | null
  location: {
    id: string
    name: string
    is_main_campus: boolean
    city: string | null
  } | null
}

interface ProfileContentProps {
  profile: Profile | null
  user: {
    id: string
    email: string
    email_confirmed_at: string | null
  }
}

export function ProfileContent({ profile, user }: ProfileContentProps) {
  const { t } = useI18n()
  const router = useRouter()

  const getRoleLabel = (role: string) => {
    return t.roles[role as keyof typeof t.roles] || role
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        userName={profile?.full_name || user.email} 
        userRole={profile?.role || "MEMBER"} 
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
          <h1 className="text-2xl font-bold">{t.header.profile}</h1>
          <p className="text-muted-foreground">{t.dashboard.accountDetails}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t.dashboard.profile}
              </CardTitle>
              <CardDescription>{t.dashboard.accountDetails}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nombre completo</label>
                <p className="font-medium">{profile?.full_name || "-"}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="font-medium">{profile?.email || user.email}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Rol
                </label>
                <div className="inline-flex items-center px-3 py-1 mt-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {getRoleLabel(profile?.role || "MEMBER")}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t.dashboard.church}
              </CardTitle>
              <CardDescription>{t.dashboard.yourOrganization}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">{t.dashboard.church}</label>
                <p className="font-medium">{profile?.organization?.name || t.dashboard.noOrganization}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t.dashboard.branch}
                </label>
                <p className="font-medium">
                  {profile?.location?.name || t.dashboard.noLocation}
                  {profile?.location?.is_main_campus && (
                    <span className="ml-2 text-xs text-primary">({t.dashboard.mainBranch})</span>
                  )}
                </p>
                {profile?.location?.city && (
                  <p className="text-sm text-muted-foreground">{profile.location.city}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t.dashboard.accountStatus}</CardTitle>
              <CardDescription>{t.dashboard.authStatus}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">{t.dashboard.emailVerified}</span>
                <span className={user.email_confirmed_at ? "text-green-600" : "text-amber-600"}>
                  {user.email_confirmed_at ? t.dashboard.yes : t.dashboard.pendingVerification}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">{t.dashboard.userId}</span>
                <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">{t.dashboard.accountActive}</span>
                <span className={profile?.is_active ? "text-green-600" : "text-red-600"}>
                  {profile?.is_active ? t.dashboard.yes : t.dashboard.no}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
