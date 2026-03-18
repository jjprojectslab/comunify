"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Plus, ArrowLeft, Users, Loader2, Pencil, Trash2, LayoutGrid, Search } from "lucide-react"
import { createArea, updateArea, deleteArea, searchUsers, type Area } from "@/app/actions/areas"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import Link from "next/link"

type Location = { id: string; name: string; city: string | null }

interface AreasPageClientProps {
  initialAreas: Area[]
  locations: Location[]
  profile: {
    id: string
    full_name: string
    role: string
    location_id: string | null
  }
}

export function AreasPageClient({ initialAreas, locations, profile }: AreasPageClientProps) {
  const router = useRouter()
  const [areas, setAreas] = useState<Area[]>(initialAreas || [])
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>("")
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({ name: "", description: "", location_id: "", leader_ids: [] as string[] })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; full_name: string; email: string }>>([])
  const [selectedLeaders, setSelectedLeaders] = useState<Map<string, string>>(new Map()) // id -> full_name
  const [searchTerm, setSearchTerm] = useState("")

  const isSuperAdmin = profile.role === "SUPER_ADMIN"

  // Filter areas based on selected location (only for SUPER_ADMIN)
  const filteredAreas = (isSuperAdmin && selectedLocationFilter && selectedLocationFilter !== "all"
    ? areas.filter(area => area.location_id === selectedLocationFilter)
    : areas) || []

  const openCreateDialog = () => {
    setFormData({ name: "", description: "", location_id: profile.location_id || "", leader_ids: [] })
    setSelectedLeaders(new Map())
    setIsCreateOpen(true)
    setError(null)
    setSearchTerm("")
  }

  const openEditDialog = (area: Area) => {
    setFormData({
      name: area.name,
      description: area.description || "",
      location_id: area.location_id,
      leader_ids: [] // Initialize empty for edit mode
    })
    setSelectedLeaders(new Map()) // Initialize empty map
    setEditingArea(area)
    setError(null)
    setSearchTerm("")
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError("El nombre es requerido")
      return
    }
    
    // SUPER_ADMIN must select a location
    if (isSuperAdmin && !formData.location_id) {
      setError("Debes seleccionar una sede")
      return
    }
    
    // Non-SUPER_ADMIN must have a location assigned
    if (!isSuperAdmin && !profile.location_id) {
      setError("No tienes una sede asignada. Contacta a un administrador.")
      return
    }
    
    setIsSaving(true)
    setError(null)
    
    // SUPER_ADMIN uses selected location, others use their assigned location
    const locationIdToUse = isSuperAdmin ? formData.location_id : profile.location_id
    
    const result = await createArea({
      name: formData.name,
      description: formData.description || undefined,
      location_id: locationIdToUse || "",
      leader_ids: formData.leader_ids.length > 0 ? formData.leader_ids : undefined,
    })
    
    if (result.success && result.area) {
      setAreas(prev => [result.area!, ...prev])
      setIsCreateOpen(false)
      setFormData({ name: "", description: "", location_id: "", leader_ids: [] })
      setSelectedLeaders(new Map())
      router.refresh() // Refresh to update profile roles in dashboard
    } else {
      setError(result.error || "Error al crear el area")
    }
    setIsSaving(false)
  }

  const handleUpdate = async () => {
    if (!editingArea || !formData.name.trim()) {
      setError("El nombre es requerido")
      return
    }
    
    setIsSaving(true)
    setError(null)
    
    const result = await updateArea(editingArea.id, {
      name: formData.name,
      description: formData.description || undefined,
      leader_ids: formData.leader_ids.length > 0 ? formData.leader_ids : undefined,
    })
    
    if (result.success) {
      setAreas(prev => prev.map(a => 
        a.id === editingArea.id 
          ? { ...a, name: formData.name, description: formData.description || null }
          : a
      ))
      setEditingArea(null)
      setFormData({ name: "", description: "", location_id: "", leader_ids: [] })
      setSelectedLeaders(new Map())
      router.refresh() // Refresh to update profile roles
    } else {
      setError(result.error || "Error al actualizar el area")
    }
    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!areaToDelete) return
    
    const result = await deleteArea(areaToDelete.id)
    
    if (result.success) {
      setAreas(prev => prev.filter(a => a.id !== areaToDelete.id))
    }
    setAreaToDelete(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile.full_name} userRole={profile.role} />
      
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <LayoutGrid className="h-6 w-6" />
                Gestion de Areas
              </h1>
              <p className="text-muted-foreground">Administra las areas de tu iglesia</p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Area
          </Button>
        </div>

        {/* Location Filter - Only for SUPER_ADMIN */}
        {isSuperAdmin && (
          <div className="mb-6 flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="location-filter" className="text-sm font-medium mb-2 block">
                Filtrar por Sede
              </Label>
              <Select value={selectedLocationFilter} onValueChange={setSelectedLocationFilter}>
                <SelectTrigger id="location-filter">
                  <SelectValue placeholder="Todas las sedes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sedes</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} {location.city ? `(${location.city})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Areas Grid */}
        {filteredAreas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <LayoutGrid className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No hay areas creadas</h3>
              <p className="text-muted-foreground mb-4">Crea tu primera area para empezar a organizar tu iglesia.</p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Area
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAreas.map((area) => (
              <Card key={area.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{area.name}</CardTitle>
                      {area.location && (
                        <p className="text-xs text-muted-foreground">
                          {area.location.name} {area.location.city ? `(${area.location.city})` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openEditDialog(area)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setAreaToDelete(area)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {area.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {area.description}
                    </p>
                  )}
                  <Link href={`/dashboard/areas/${area.id}`}>
                    <Button variant="outline" className="w-full gap-2 bg-transparent">
                      <Users className="h-4 w-4" />
                      Ver Miembros
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingArea} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false)
          setEditingArea(null)
          setError(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingArea ? "Editar Area" : "Nueva Area"}</DialogTitle>
            <DialogDescription>
              {editingArea ? "Modifica los datos del area" : "Completa los datos para crear una nueva area"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Ministerio de Adoracion"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripcion breve del area..."
                rows={3}
              />
            </div>
            
            {isSuperAdmin && !editingArea && (
              <div className="space-y-2">
                <Label htmlFor="location">Sede *</Label>
                <Select
                  value={formData.location_id}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, location_id: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} {loc.city ? `(${loc.city})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!isSuperAdmin && !editingArea && profile.location_id && (
              <p className="text-sm text-muted-foreground">
                El area se creara en tu sede actual.
              </p>
            )}

            {/* Leaders Multi-Select - Create and Edit */}
            {(editingArea || !isSuperAdmin) && (
              <div className="space-y-2">
                <Label>Seleccionar Lideres (opcional)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuario por nombre o email..."
                    value={searchTerm}
                    onChange={async (e) => {
                      setSearchTerm(e.target.value)
                      if (e.target.value.trim().length > 1) {
                        const results = await searchUsers(e.target.value, formData.location_id)
                        setAvailableUsers(results)
                      } else {
                        setAvailableUsers([])
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                
                {/* Search Results */}
                {searchTerm.trim().length > 1 && availableUsers.length > 0 && (
                  <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                    {availableUsers.map((user: any) => {
                      const isDisabled = !user.same_location
                      return (
                        <button
                          key={user.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (!formData.leader_ids.includes(user.id)) {
                              setFormData(prev => ({
                                ...prev,
                                leader_ids: [...prev.leader_ids, user.id]
                              }))
                              // Save leader data for display
                              setSelectedLeaders(prev => new Map(prev).set(user.id, user.full_name))
                            }
                            setSearchTerm("")
                            setAvailableUsers([])
                          }}
                          className={`w-full text-left p-2 rounded text-sm flex justify-between items-center transition-colors ${
                            isDisabled 
                              ? "opacity-50 cursor-not-allowed bg-muted/30" 
                              : "hover:bg-muted cursor-pointer"
                          }`}
                          title={isDisabled ? "Este usuario no pertenece a la misma sede" : ""}
                        >
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                              {isDisabled && " (Otra sede)"}
                            </div>
                          </div>
                          {formData.leader_ids.includes(user.id) && (
                            <span className="text-xs text-primary">✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Selected Leaders */}
                {formData.leader_ids.length > 0 && (
                  <div className="border rounded-md p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Lideres seleccionados:</p>
                    {formData.leader_ids.map((leaderId) => {
                      const leaderName = selectedLeaders.get(leaderId)
                      return (
                        <div key={leaderId} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                          <span>{leaderName || leaderId}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                leader_ids: prev.leader_ids.filter(id => id !== leaderId)
                              }))
                              setSelectedLeaders(prev => {
                                const newMap = new Map(prev)
                                newMap.delete(leaderId)
                                return newMap
                              })
                            }}
                            className="text-xs text-destructive hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false)
              setEditingArea(null)
              setError(null)
            }}>
              Cancelar
            </Button>
            <Button onClick={editingArea ? handleUpdate : handleCreate} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingArea ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!areaToDelete} onOpenChange={(open) => !open && setAreaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Area</AlertDialogTitle>
            <AlertDialogDescription>
              Esta seguro de eliminar el area &quot;{areaToDelete?.name}&quot;? 
              Esta accion no se puede deshacer y eliminara todos los miembros asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
