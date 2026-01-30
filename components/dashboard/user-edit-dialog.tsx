"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Check, X, Mail } from "lucide-react"
import { updateUserRoles, updateUserProfile, confirmUserEmail, getAllOrganizations, getOrganizationLocations } from "@/app/actions/auth"
import { useI18n } from "@/lib/i18n/context"

interface UserEditDialogProps {
  user: {
    id: string
    full_name: string
    email: string
    role: string
    roles: string[]
    is_active: boolean
    email_verified?: boolean
    organization_id: string | null
    location_id: string | null
    organization: { id: string; name: string } | null
    location: { id: string; name: string } | null
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

const ALL_ROLES = ["SUPER_ADMIN", "ADMIN", "PASTOR", "LEADER", "MEMBER"]

export function UserEditDialog({ user, open, onOpenChange, onSave }: UserEditDialogProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const [fullName, setFullName] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [organizationId, setOrganizationId] = useState<string>("")
  const [locationId, setLocationId] = useState<string>("")
  
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "")
      setSelectedRoles(user.roles || [user.role])
      setIsActive(user.is_active)
      setOrganizationId(user.organization_id || "")
      setLocationId(user.location_id || "")
    }
  }, [user])

  useEffect(() => {
    const loadOrgs = async () => {
      const orgs = await getAllOrganizations()
      setOrganizations(orgs)
    }
    loadOrgs()
  }, [])

  useEffect(() => {
    const loadLocations = async () => {
      if (organizationId) {
        const locs = await getOrganizationLocations(organizationId)
        setLocations(locs)
      } else {
        setLocations([])
      }
    }
    loadLocations()
  }, [organizationId])

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  const handleSave = async () => {
    if (!user) return
    setIsLoading(true)
    setMessage(null)

    try {
      // Update roles
      const rolesResult = await updateUserRoles(user.id, selectedRoles)
      if (!rolesResult.success) {
        setMessage({ type: "error", text: rolesResult.error || "Error al actualizar roles" })
        setIsLoading(false)
        return
      }

      // Update profile
      const profileResult = await updateUserProfile(user.id, {
        full_name: fullName,
        organization_id: organizationId || null,
        location_id: locationId || null,
        is_active: isActive,
      })

      if (!profileResult.success) {
        setMessage({ type: "error", text: profileResult.error || "Error al actualizar perfil" })
        setIsLoading(false)
        return
      }

      setMessage({ type: "success", text: "Usuario actualizado correctamente" })
      setTimeout(() => {
        onSave()
        onOpenChange(false)
      }, 1000)
    } catch {
      setMessage({ type: "error", text: "Error al guardar cambios" })
    }
    setIsLoading(false)
  }

  const handleConfirmEmail = async () => {
    if (!user) return
    setIsLoading(true)
    
    const result = await confirmUserEmail(user.id)
    if (result.success) {
      setMessage({ type: "success", text: "Email verificado manualmente" })
      onSave()
    } else {
      setMessage({ type: "error", text: result.error || "Error al verificar email" })
    }
    setIsLoading(false)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica los datos y roles del usuario {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {message && (
            <div className={`p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <div className="flex items-center gap-2">
              <Input value={user.email} disabled className="flex-1" />
              {user.email_verified ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Verificado
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConfirmEmail}
                  disabled={isLoading}
                  className="bg-transparent"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Verificar
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <Badge
                  key={role}
                  variant={selectedRoles.includes(role) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedRoles.includes(role) 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-transparent hover:bg-muted"
                  }`}
                  onClick={() => handleRoleToggle(role)}
                >
                  {selectedRoles.includes(role) && <Check className="h-3 w-3 mr-1" />}
                  {t.roles[role as keyof typeof t.roles] || role}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Haz clic en un rol para agregarlo o quitarlo
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Iglesia</Label>
              <Select value={organizationId} onValueChange={setOrganizationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sede</Label>
              <Select value={locationId} onValueChange={setLocationId} disabled={!organizationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Usuario activo
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading || selectedRoles.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
