"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { createUserAsAdmin, getAllOrganizations, getOrganizationLocations, getAllUsers, deleteUser, getAllLocations } from "@/app/actions/auth"
import { User, MapPin, Building2, Plus, Users, Loader2, Church, Globe, LogOut, Pencil, BadgeCheck, BadgeX, Trash2, AlertTriangle, LayoutGrid } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useI18n } from "@/lib/i18n/context"
import { ChurchesManagement } from "./churches-management"
import { DashboardHeader } from "./dashboard-header"
import { UserEditDialog } from "./user-edit-dialog"

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

interface DashboardContentProps {
  profile: Profile | null
  user: {
    id: string
    email: string
    email_confirmed_at: string | null
  }
}

export function DashboardContent({ profile, user }: DashboardContentProps) {
  const { language, setLanguage, t } = useI18n()
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    organizationId: "",
    locationId: "",
    role: "MEMBER" as "MEMBER" | "LEADER" | "PASTOR" | "ADMIN"
  })
  
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [locations, setLocations] = useState<Array<{ id: string; name: string; is_main_campus: boolean }>>([])
  const [allUsers, setAllUsers] = useState<Array<{
    id: string
    full_name: string
    email: string
    role: string
    roles: string[]
    is_active: boolean
    email_verified?: boolean
    organization_id: string | null
    location_id: string | null
    organization: { id: string; name: string; slug: string } | null
    location: { id: string; name: string; city: string | null } | null
  }>>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [editingUser, setEditingUser] = useState<typeof allUsers[0] | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<typeof allUsers[0] | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [allLocations, setAllLocations] = useState<Array<{ id: string; name: string; city: string | null }>>([]) // Declare allLocations

  const isSuperAdmin = profile?.role === "SUPER_ADMIN"
  const canManageUsers = profile?.role && profile.role !== "MEMBER"
  const canManageAreas = profile?.role && ["SUPER_ADMIN", "PASTOR", "LEADER"].includes(profile.role)

  // Load locations for areas management
  useEffect(() => {
    if (canManageAreas) {
      getAllLocations().then(setAllLocations)
    }
  }, [canManageAreas])
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      const result = await deleteUser(userToDelete.id)
      if (result.success) {
        loadUsers()
      } else {
        alert(result.error || "Error al eliminar usuario")
      }
    } catch (e) {
      console.error("Error deleting user:", e)
    }
    setIsDeleting(false)
    setUserToDelete(null)
  }
  
  const loadUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const users = await getAllUsers()
      setAllUsers(users)
    } catch (e) {
      console.error("Error loading users:", e)
    }
    setIsLoadingUsers(false)
  }

  const loadOrganizations = async () => {
    const orgs = await getAllOrganizations()
    setOrganizations(orgs)
  }

  const loadLocations = async (orgId: string) => {
    const locs = await getOrganizationLocations(orgId)
    setLocations(locs)
  }

  const loadAllLocations = async () => {
    const locs = await getAllUsers() // Use getAllUsers instead of getAllLocations
    setAllLocations(locs)
  }

  const handleCreateUser = async () => {
    setIsLoading(true)
    setMessage(null)
    
    const result = await createUserAsAdmin({
      firstName: userForm.firstName,
      lastName: userForm.lastName,
      email: userForm.email,
      password: userForm.password,
      organizationId: userForm.organizationId,
      locationId: userForm.locationId,
      role: userForm.role,
    })

    setIsLoading(false)
    
    if (result.success) {
      setMessage({ type: "success", text: result.message || t.admin.userCreated })
      setUserForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        organizationId: "",
        locationId: "",
        role: "MEMBER"
      })
      // Refresh users list
      loadUsers()
      setTimeout(() => {
        setIsCreateUserOpen(false)
        setMessage(null)
      }, 1500)
    } else {
      setMessage({ type: "error", text: result.error || t.common.error })
    }
  }

  const getRoleLabel = (role: string) => {
    return t.roles[role as keyof typeof t.roles] || role
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        userName={profile?.full_name || user.email}
        userRole={profile?.role || "MEMBER"}
      />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            {t.common.welcome}, {profile?.full_name || user.email}
          </h1>
          <p className="text-muted-foreground">
            {t.dashboard.overview}
          </p>
        </div>

        {/* Admin Panel - visible for users who can manage (not MEMBER) */}
        {canManageUsers && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">{t.dashboard.title}</TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="churches" className="gap-2">
                  <Church className="h-4 w-4" />
                  {t.admin.manageChurches}
                </TabsTrigger>
              )}
              <TabsTrigger value="users" className="gap-2" onClick={() => { if (allUsers.length === 0) loadUsers() }}>
                <Users className="h-4 w-4" />
                {t.admin.manageUsers}
              </TabsTrigger>
              
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Profile Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Profile Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t.dashboard.profile}</CardTitle>
                      <CardDescription>{t.dashboard.accountDetails}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {getRoleLabel(profile?.role || "MEMBER")}
                    </div>
                  </CardContent>
                </Card>

                {/* Organization Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t.dashboard.church}</CardTitle>
                      <CardDescription>{t.dashboard.yourOrganization}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile?.organization ? (
                      <div>
                        <p className="text-sm font-medium text-foreground">{profile.organization.name}</p>
                        <p className="text-xs text-muted-foreground">/{profile.organization.slug}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t.dashboard.noOrganization}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Location Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t.dashboard.branch}</CardTitle>
                      <CardDescription>{t.dashboard.homeLocation}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile?.location ? (
                      <div>
                        <p className="text-sm font-medium text-foreground">{profile.location.name}</p>
                        {profile.location.is_main_campus && (
                          <span className="text-xs text-primary">{t.dashboard.mainBranch}</span>
                        )}
                        {profile.location.city && (
                          <p className="text-xs text-muted-foreground">{profile.location.city}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t.dashboard.noLocation}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions for Area Managers */}
              {canManageAreas && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5" />
                      Gestion de Areas
                    </CardTitle>
                    <CardDescription>
                      Administra las areas y sus miembros
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/dashboard/areas">
                      <Button>
                        Ir a Areas
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Account Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t.dashboard.accountStatus}</CardTitle>
                  <CardDescription>{t.dashboard.authStatus}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.dashboard.emailVerified}:</span>
                    <span className={user.email_confirmed_at ? "text-green-600" : "text-amber-600"}>
                      {user.email_confirmed_at ? t.dashboard.yes : t.dashboard.pendingVerification}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.dashboard.userId}:</span>
                    <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.dashboard.accountActive}:</span>
                    <span className={profile?.is_active ? "text-green-600" : "text-red-600"}>
                      {profile?.is_active ? t.dashboard.yes : t.dashboard.no}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="churches">
              <ChurchesManagement />
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{t.admin.manageUsers}</h2>
                <Dialog open={isCreateUserOpen} onOpenChange={(open) => {
                  setIsCreateUserOpen(open)
                  if (open) loadOrganizations()
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t.admin.createUser}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{t.admin.createUser}</DialogTitle>
                      <DialogDescription>{t.admin.manageUsers}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">{t.admin.firstName}</Label>
                          <Input
                            id="firstName"
                            value={userForm.firstName}
                            onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">{t.admin.lastName}</Label>
                          <Input
                            id="lastName"
                            value={userForm.lastName}
                            onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="userEmail">{t.admin.email}</Label>
                        <Input
                          id="userEmail"
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="userPassword">{t.admin.password}</Label>
                        <Input
                          id="userPassword"
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.admin.selectChurch}</Label>
                        <Select
                          value={userForm.organizationId}
                          onValueChange={(value) => {
                            setUserForm({ ...userForm, organizationId: value, locationId: "" })
                            loadLocations(value)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t.admin.selectChurch} />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.admin.selectBranch}</Label>
                        <Select
                          value={userForm.locationId}
                          onValueChange={(value) => setUserForm({ ...userForm, locationId: value })}
                          disabled={!userForm.organizationId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t.admin.selectBranch} />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((loc) => (
                              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.admin.userRole}</Label>
                        <Select
                          value={userForm.role}
                          onValueChange={(value) => setUserForm({ ...userForm, role: value as "MEMBER" | "LEADER" | "PASTOR" | "ADMIN" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">{t.roles.MEMBER}</SelectItem>
                            <SelectItem value="LEADER">{t.roles.LEADER}</SelectItem>
                            <SelectItem value="PASTOR">{t.roles.PASTOR}</SelectItem>
                            <SelectItem value="ADMIN">{t.roles.ADMIN}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {message && (
                        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                          {message.text}
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateUserOpen(false)} className="bg-transparent">
                        {t.common.cancel}
                      </Button>
                      <Button 
                        onClick={handleCreateUser} 
                        disabled={!userForm.firstName || !userForm.email || !userForm.password || isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.create}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {allUsers.length === 0 && !isLoadingUsers ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">{t.common.noResults}</p>
                    <Button onClick={loadUsers} variant="outline" className="bg-transparent">
                      Cargar usuarios
                    </Button>
                  </CardContent>
                </Card>
              ) : isLoadingUsers ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Nombre</th>
                            <th className="text-left p-3 font-medium">Email</th>
                            <th className="text-left p-3 font-medium">Roles</th>
                            <th className="text-left p-3 font-medium">Iglesia</th>
                            <th className="text-left p-3 font-medium">Estado</th>
                            <th className="text-left p-3 font-medium">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.map((u) => (
                            <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                              <td className="p-3 font-medium">{u.full_name}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{u.email}</span>
                                  {u.email_verified ? (
                                    <BadgeCheck className="h-4 w-4 text-green-600" title="Email verificado" />
                                  ) : (
                                    <BadgeX className="h-4 w-4 text-amber-500" title="Email no verificado" />
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {(u.roles || [u.role]).map((role) => (
                                    <span key={role} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                      {getRoleLabel(role)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3 text-muted-foreground">{u.organization?.name || "-"}</td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {u.is_active ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setEditingUser(u)
                                      setIsEditDialogOpen(true)
                                    }}
                                    className="h-8 w-8 p-0"
                                    title="Editar usuario"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setUserToDelete(u)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    title="Eliminar usuario"
                                    disabled={u.id === profile?.id}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            
          </Tabs>
        )}

        {/* User Edit Dialog */}
        <UserEditDialog
          user={editingUser}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={loadUsers}
        />

        {/* Delete User Confirmation Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Eliminar Usuario
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion eliminara permanentemente el perfil de <strong>{userToDelete?.full_name}</strong> ({userToDelete?.email}).
                Esta accion no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Non-admin view */}

        {!canManageUsers && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Profile Card */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t.dashboard.profile}</CardTitle>
                    <CardDescription>{t.dashboard.accountDetails}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {getRoleLabel(profile?.role || "MEMBER")}
                  </div>
                </CardContent>
              </Card>

              {/* Organization Card */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t.dashboard.church}</CardTitle>
                    <CardDescription>{t.dashboard.yourOrganization}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile?.organization ? (
                    <div>
                      <p className="text-sm font-medium text-foreground">{profile.organization.name}</p>
                      <p className="text-xs text-muted-foreground">/{profile.organization.slug}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.dashboard.noOrganization}</p>
                  )}
                </CardContent>
              </Card>

              {/* Location Card */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t.dashboard.branch}</CardTitle>
                    <CardDescription>{t.dashboard.homeLocation}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile?.location ? (
                    <div>
                      <p className="text-sm font-medium text-foreground">{profile.location.name}</p>
                      {profile.location.is_main_campus && (
                        <span className="text-xs text-primary">{t.dashboard.mainBranch}</span>
                      )}
                      {profile.location.city && (
                        <p className="text-xs text-muted-foreground">{profile.location.city}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.dashboard.noLocation}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Account Status Card */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-base">{t.dashboard.accountStatus}</CardTitle>
                <CardDescription>{t.dashboard.authStatus}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.dashboard.emailVerified}:</span>
                  <span className={user.email_confirmed_at ? "text-green-600" : "text-amber-600"}>
                    {user.email_confirmed_at ? t.dashboard.yes : t.dashboard.pendingVerification}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.dashboard.userId}:</span>
                  <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.dashboard.accountActive}:</span>
                  <span className={profile?.is_active ? "text-green-600" : "text-red-600"}>
                    {profile?.is_active ? t.dashboard.yes : t.dashboard.no}
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
