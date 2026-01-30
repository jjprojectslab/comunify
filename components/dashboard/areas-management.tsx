"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Users, Loader2, MapPin } from "lucide-react"
import { getAreas, createArea, updateArea, deleteArea, type Area } from "@/app/actions/areas"
import { AreaMembersDialog } from "./area-members-dialog"

type Location = { id: string; name: string; city: string | null }

interface AreasManagementProps {
  locations: Location[]
  userRole: string
  userLocationId: string | null
}

export function AreasManagement({ locations, userRole, userLocationId }: AreasManagementProps) {
  const [areas, setAreas] = useState<Area[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null)
  const [membersArea, setMembersArea] = useState<Area | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    location_id: userLocationId || ""
  })

  const isSuperAdmin = userRole === "SUPER_ADMIN"

  const loadAreas = async () => {
    setIsLoading(true)
    const data = await getAreas()
    setAreas(data)
    setIsLoading(false)
  }

  useEffect(() => {
    loadAreas()
  }, [])

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      location_id: userLocationId || ""
    })
    setEditingArea(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (area: Area) => {
    setEditingArea(area)
    setForm({
      name: area.name,
      description: area.description || "",
      location_id: area.location_id
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    
    setIsSubmitting(true)
    
    if (editingArea) {
      const result = await updateArea(editingArea.id, form)
      if (!result.success) {
        alert(result.error)
      }
    } else {
      const result = await createArea(form)
      if (!result.success) {
        alert(result.error)
      }
    }
    
    setIsSubmitting(false)
    setIsDialogOpen(false)
    resetForm()
    loadAreas()
  }

  const handleDelete = async () => {
    if (!areaToDelete) return
    
    const result = await deleteArea(areaToDelete.id)
    if (!result.success) {
      alert(result.error)
    }
    
    setAreaToDelete(null)
    loadAreas()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Areas</h2>
          <p className="text-sm text-muted-foreground">Gestiona las areas de tu sede</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Area
        </Button>
      </div>

      {/* Areas Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : areas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No hay areas creadas</p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={openCreateDialog}>
              Crear primera area
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <Card key={area.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    {area.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {area.location.name}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setMembersArea(area)}
                      title="Gestionar miembros"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditDialog(area)}
                      title="Editar area"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => setAreaToDelete(area)}
                      title="Eliminar area"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {area.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {area.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {area.member_count || 0} miembro{area.member_count !== 1 ? "s" : ""}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMembersArea(area)}
                  >
                    Ver miembros
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingArea ? "Editar Area" : "Nueva Area"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Alabanza, Jovenes, Niños..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripcion del area..."
                rows={3}
              />
            </div>
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="location">Sede *</Label>
                <Select
                  value={form.location_id}
                  onValueChange={(value) => setForm({ ...form, location_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} {loc.city && `- ${loc.city}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingArea ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!areaToDelete} onOpenChange={(open) => !open && setAreaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Area</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara permanentemente el area <strong>{areaToDelete?.name}</strong> y todos sus miembros asociados.
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

      {/* Members Dialog */}
      {membersArea && (
        <AreaMembersDialog
          area={membersArea}
          open={!!membersArea}
          onOpenChange={(open) => !open && setMembersArea(null)}
          onUpdate={loadAreas}
        />
      )}
    </div>
  )
}
