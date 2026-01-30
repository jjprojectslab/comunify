"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  createOrganization, 
  updateOrganization, 
  deleteOrganization, 
  createLocation,
  updateLocation,
  deleteLocation,
  getOrganizationsWithLocations,
  getPastors
} from "@/app/actions/auth"
import { Church, MapPin, Plus, Pencil, Trash2, Loader2, Phone, Mail, Globe, ExternalLink, User } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface Pastor {
  id: string
  full_name: string
  email: string
}

interface Location {
  id: string
  name: string
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  pastor_id: string | null
  pastor: Pastor | null
  is_main_campus: boolean
}

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  location_url: string | null
  locations: Location[]
}

export function ChurchesManagement() {
  const { t } = useI18n()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [pastors, setPastors] = useState<Pastor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Dialog states
  const [isCreateChurchOpen, setIsCreateChurchOpen] = useState(false)
  const [isEditChurchOpen, setIsEditChurchOpen] = useState(false)
  const [isDeleteChurchDialogOpen, setIsDeleteChurchDialogOpen] = useState(false)
  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false)
  const [isEditBranchOpen, setIsEditBranchOpen] = useState(false)
  const [isDeleteBranchDialogOpen, setIsDeleteBranchDialogOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<Location | null>(null)
  
  // Form states
  const [churchForm, setChurchForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    locationUrl: "",
  })
  
  const [branchForm, setBranchForm] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    pastorId: "",
    isMainBranch: false,
  })

  const loadData = async () => {
    setIsLoading(true)
    const [orgsData, pastorsData] = await Promise.all([
      getOrganizationsWithLocations(),
      getPastors()
    ])
    setOrganizations(orgsData)
    setPastors(pastorsData)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetChurchForm = () => {
    setChurchForm({
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      locationUrl: "",
    })
  }

  const resetBranchForm = () => {
    setBranchForm({
      name: "",
      address: "",
      city: "",
      country: "",
      phone: "",
      pastorId: "",
      isMainBranch: false,
    })
  }

  const handleCreateChurch = async () => {
    setIsSubmitting(true)
    setMessage(null)
    
    const result = await createOrganization({
      name: churchForm.name,
      description: churchForm.description || undefined,
      address: churchForm.address || undefined,
      phone: churchForm.phone || undefined,
      email: churchForm.email || undefined,
      website: churchForm.website || undefined,
      locationUrl: churchForm.locationUrl || undefined,
    })

    setIsSubmitting(false)
    
    if (result.success) {
      setMessage({ type: "success", text: t.admin.churchCreated })
      resetChurchForm()
      loadData()
      setTimeout(() => {
        setIsCreateChurchOpen(false)
        setMessage(null)
      }, 1500)
    } else {
      setMessage({ type: "error", text: result.error || t.common.error })
    }
  }

  const handleEditChurch = async () => {
    if (!selectedOrg) return
    
    setIsSubmitting(true)
    setMessage(null)
    
    const result = await updateOrganization(selectedOrg.id, {
      name: churchForm.name,
      description: churchForm.description || undefined,
      address: churchForm.address || undefined,
      phone: churchForm.phone || undefined,
      email: churchForm.email || undefined,
      website: churchForm.website || undefined,
      locationUrl: churchForm.locationUrl || undefined,
    })

    setIsSubmitting(false)
    
    if (result.success) {
      setMessage({ type: "success", text: t.admin.churchUpdated })
      loadData()
      setTimeout(() => {
        setIsEditChurchOpen(false)
        setSelectedOrg(null)
        setMessage(null)
      }, 1500)
    } else {
      setMessage({ type: "error", text: result.error || t.common.error })
    }
  }

  const handleDeleteChurch = async () => {
    if (!selectedOrg) return
    
    setIsSubmitting(true)
    const result = await deleteOrganization(selectedOrg.id)
    setIsSubmitting(false)
    
    if (result.success) {
      loadData()
      setIsDeleteChurchDialogOpen(false)
      setSelectedOrg(null)
    }
  }

  const handleCreateBranch = async () => {
    if (!selectedOrg) return
    
    setIsSubmitting(true)
    setMessage(null)
    
    const result = await createLocation({
      organizationId: selectedOrg.id,
      name: branchForm.name,
      address: branchForm.address || undefined,
      city: branchForm.city || undefined,
      country: branchForm.country || undefined,
      isMainCampus: branchForm.isMainBranch,
    })

    setIsSubmitting(false)
    
    if (result.success) {
      setMessage({ type: "success", text: t.admin.branchCreated })
      resetBranchForm()
      loadData()
      setTimeout(() => {
        setIsCreateBranchOpen(false)
        setSelectedOrg(null)
        setMessage(null)
      }, 1500)
    } else {
      setMessage({ type: "error", text: result.error || t.common.error })
    }
  }

  const handleEditBranch = async () => {
    if (!selectedBranch) return
    
    setIsSubmitting(true)
    setMessage(null)
    
    const result = await updateLocation(selectedBranch.id, {
      name: branchForm.name,
      address: branchForm.address || undefined,
      city: branchForm.city || undefined,
      country: branchForm.country || undefined,
      phone: branchForm.phone || undefined,
      pastorId: branchForm.pastorId || null,
      isMainCampus: branchForm.isMainBranch,
    })

    setIsSubmitting(false)
    
    if (result.success) {
      setMessage({ type: "success", text: t.admin.branchUpdated })
      loadData()
      setTimeout(() => {
        setIsEditBranchOpen(false)
        setSelectedBranch(null)
        setMessage(null)
      }, 1500)
    } else {
      setMessage({ type: "error", text: result.error || t.common.error })
    }
  }

  const handleDeleteBranch = async () => {
    if (!selectedBranch) return
    
    setIsSubmitting(true)
    const result = await deleteLocation(selectedBranch.id)
    setIsSubmitting(false)
    
    if (result.success) {
      loadData()
      setIsDeleteBranchDialogOpen(false)
      setSelectedBranch(null)
    }
  }

  const openEditChurchDialog = (org: Organization) => {
    setSelectedOrg(org)
    setChurchForm({
      name: org.name,
      description: org.description || "",
      address: org.address || "",
      phone: org.phone || "",
      email: org.email || "",
      website: org.website || "",
      locationUrl: org.location_url || "",
    })
    setIsEditChurchOpen(true)
  }

  const openDeleteChurchDialog = (org: Organization) => {
    setSelectedOrg(org)
    setIsDeleteChurchDialogOpen(true)
  }

  const openAddBranchDialog = (org: Organization) => {
    setSelectedOrg(org)
    resetBranchForm()
    setIsCreateBranchOpen(true)
  }

  const openEditBranchDialog = (branch: Location) => {
    setSelectedBranch(branch)
    setBranchForm({
      name: branch.name,
      address: branch.address || "",
      city: branch.city || "",
      country: branch.country || "",
      phone: branch.phone || "",
      pastorId: branch.pastor_id || "",
      isMainBranch: branch.is_main_campus,
    })
    setIsEditBranchOpen(true)
  }

  const openDeleteBranchDialog = (branch: Location) => {
    setSelectedBranch(branch)
    setIsDeleteBranchDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t.admin.churchList}</h2>
        <Button onClick={() => { resetChurchForm(); setIsCreateChurchOpen(true) }} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t.admin.createChurch}</span>
          <span className="sm:hidden">{t.common.create}</span>
        </Button>
      </div>

      {/* Churches List */}
      {organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Church className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t.common.noResults}</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {organizations.map((org) => (
            <AccordionItem key={org.id} value={org.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Church className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{org.name}</p>
                    <p className="text-xs text-muted-foreground">/{org.slug}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4">
                  {/* Organization Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {org.description && (
                      <div className="col-span-full">
                        <p className="text-muted-foreground">{org.description}</p>
                      </div>
                    )}
                    {org.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{org.address}</span>
                      </div>
                    )}
                    {org.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{org.phone}</span>
                      </div>
                    )}
                    {org.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{org.email}</span>
                      </div>
                    )}
                    {org.website && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4 shrink-0" />
                        <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">
                          {org.website}
                        </a>
                      </div>
                    )}
                    {org.location_url && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        <a href={org.location_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                          {t.admin.locationUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Branches Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">{t.admin.branchList}</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openAddBranchDialog(org)}
                        className="gap-1 h-8 bg-transparent"
                      >
                        <Plus className="h-3 w-3" />
                        <span className="hidden sm:inline">{t.admin.createBranch}</span>
                      </Button>
                    </div>
                    
                    {org.locations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t.admin.noBranches}</p>
                    ) : (
                      <div className="space-y-2">
                        {org.locations.map((loc) => (
                          <div 
                            key={loc.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 gap-2"
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 sm:mt-0 shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium">{loc.name}</p>
                                  {loc.is_main_campus && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                      {t.dashboard.mainBranch}
                                    </span>
                                  )}
                                </div>
                                {loc.city && (
                                  <p className="text-xs text-muted-foreground">{loc.city}{loc.country ? `, ${loc.country}` : ''}</p>
                                )}
                                {loc.pastor && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <User className="h-3 w-3" />
                                    <span>{loc.pastor.full_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-7 sm:ml-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditBranchDialog(loc)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => openDeleteBranchDialog(loc)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditChurchDialog(org)}
                      className="gap-2 bg-transparent"
                    >
                      <Pencil className="h-4 w-4" />
                      {t.common.edit}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openDeleteChurchDialog(org)}
                      className="gap-2 text-destructive hover:text-destructive bg-transparent"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t.common.delete}
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Create Church Dialog */}
      <Dialog open={isCreateChurchOpen} onOpenChange={setIsCreateChurchOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.admin.createChurch}</DialogTitle>
            <DialogDescription>{t.admin.manageChurches}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="churchName">{t.admin.churchName} *</Label>
              <Input
                id="churchName"
                value={churchForm.name}
                onChange={(e) => setChurchForm({ ...churchForm, name: e.target.value })}
                placeholder="Iglesia Comunidad de Fe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="churchDesc">{t.admin.description}</Label>
              <Textarea
                id="churchDesc"
                value={churchForm.description}
                onChange={(e) => setChurchForm({ ...churchForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="churchAddress">{t.admin.address}</Label>
              <Input
                id="churchAddress"
                value={churchForm.address}
                onChange={(e) => setChurchForm({ ...churchForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="churchPhone">{t.admin.phone}</Label>
                <Input
                  id="churchPhone"
                  value={churchForm.phone}
                  onChange={(e) => setChurchForm({ ...churchForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="churchEmail">{t.admin.email}</Label>
                <Input
                  id="churchEmail"
                  type="email"
                  value={churchForm.email}
                  onChange={(e) => setChurchForm({ ...churchForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="churchWebsite">{t.admin.website}</Label>
              <Input
                id="churchWebsite"
                value={churchForm.website}
                onChange={(e) => setChurchForm({ ...churchForm, website: e.target.value })}
                placeholder="https://www.iglesia.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="churchLocationUrl">{t.admin.locationUrl}</Label>
              <Input
                id="churchLocationUrl"
                value={churchForm.locationUrl}
                onChange={(e) => setChurchForm({ ...churchForm, locationUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
              />
            </div>
            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {message.text}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateChurchOpen(false)} className="bg-transparent">
              {t.common.cancel}
            </Button>
            <Button onClick={handleCreateChurch} disabled={!churchForm.name || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Church Dialog */}
      <Dialog open={isEditChurchOpen} onOpenChange={setIsEditChurchOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.admin.editChurch}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editChurchName">{t.admin.churchName} *</Label>
              <Input
                id="editChurchName"
                value={churchForm.name}
                onChange={(e) => setChurchForm({ ...churchForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editChurchDesc">{t.admin.description}</Label>
              <Textarea
                id="editChurchDesc"
                value={churchForm.description}
                onChange={(e) => setChurchForm({ ...churchForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editChurchAddress">{t.admin.address}</Label>
              <Input
                id="editChurchAddress"
                value={churchForm.address}
                onChange={(e) => setChurchForm({ ...churchForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editChurchPhone">{t.admin.phone}</Label>
                <Input
                  id="editChurchPhone"
                  value={churchForm.phone}
                  onChange={(e) => setChurchForm({ ...churchForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editChurchEmail">{t.admin.email}</Label>
                <Input
                  id="editChurchEmail"
                  type="email"
                  value={churchForm.email}
                  onChange={(e) => setChurchForm({ ...churchForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editChurchWebsite">{t.admin.website}</Label>
              <Input
                id="editChurchWebsite"
                value={churchForm.website}
                onChange={(e) => setChurchForm({ ...churchForm, website: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editChurchLocationUrl">{t.admin.locationUrl}</Label>
              <Input
                id="editChurchLocationUrl"
                value={churchForm.locationUrl}
                onChange={(e) => setChurchForm({ ...churchForm, locationUrl: e.target.value })}
              />
            </div>
            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {message.text}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditChurchOpen(false)} className="bg-transparent">
              {t.common.cancel}
            </Button>
            <Button onClick={handleEditChurch} disabled={!churchForm.name || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Church Dialog */}
      <AlertDialog open={isDeleteChurchDialogOpen} onOpenChange={setIsDeleteChurchDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.deleteChurch}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.admin.confirmDelete}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteChurch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Branch Dialog */}
      <Dialog open={isCreateBranchOpen} onOpenChange={setIsCreateBranchOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.admin.createBranch}</DialogTitle>
            <DialogDescription>{selectedOrg?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="branchName">{t.admin.branchName} *</Label>
              <Input
                id="branchName"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                placeholder="Sede Centro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchAddress">{t.admin.address}</Label>
              <Input
                id="branchAddress"
                value={branchForm.address}
                onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branchCity">{t.admin.city}</Label>
                <Input
                  id="branchCity"
                  value={branchForm.city}
                  onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchCountry">{t.admin.country}</Label>
                <Input
                  id="branchCountry"
                  value={branchForm.country}
                  onChange={(e) => setBranchForm({ ...branchForm, country: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMainBranch"
                checked={branchForm.isMainBranch}
                onCheckedChange={(checked) => setBranchForm({ ...branchForm, isMainBranch: !!checked })}
              />
              <Label htmlFor="isMainBranch" className="text-sm font-normal">
                {t.admin.isMainBranch}
              </Label>
            </div>
            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {message.text}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateBranchOpen(false)} className="bg-transparent">
              {t.common.cancel}
            </Button>
            <Button onClick={handleCreateBranch} disabled={!branchForm.name || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={isEditBranchOpen} onOpenChange={setIsEditBranchOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.admin.editBranch}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editBranchName">{t.admin.branchName} *</Label>
              <Input
                id="editBranchName"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBranchAddress">{t.admin.address}</Label>
              <Input
                id="editBranchAddress"
                value={branchForm.address}
                onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editBranchCity">{t.admin.city}</Label>
                <Input
                  id="editBranchCity"
                  value={branchForm.city}
                  onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editBranchCountry">{t.admin.country}</Label>
                <Input
                  id="editBranchCountry"
                  value={branchForm.country}
                  onChange={(e) => setBranchForm({ ...branchForm, country: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBranchPhone">{t.admin.phone}</Label>
              <Input
                id="editBranchPhone"
                value={branchForm.phone}
                onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBranchPastor">{t.admin.pastor}</Label>
              <Select
                value={branchForm.pastorId}
                onValueChange={(value) => setBranchForm({ ...branchForm, pastorId: value === "none" ? "" : value })}
              >
                <SelectTrigger id="editBranchPastor">
                  <SelectValue placeholder={t.admin.selectPastor} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.admin.noPastor}</SelectItem>
                  {pastors.map((pastor) => (
                    <SelectItem key={pastor.id} value={pastor.id}>
                      {pastor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="editIsMainBranch"
                checked={branchForm.isMainBranch}
                onCheckedChange={(checked) => setBranchForm({ ...branchForm, isMainBranch: !!checked })}
              />
              <Label htmlFor="editIsMainBranch" className="text-sm font-normal">
                {t.admin.isMainBranch}
              </Label>
            </div>
            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {message.text}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditBranchOpen(false)} className="bg-transparent">
              {t.common.cancel}
            </Button>
            <Button onClick={handleEditBranch} disabled={!branchForm.name || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Dialog */}
      <AlertDialog open={isDeleteBranchDialogOpen} onOpenChange={setIsDeleteBranchDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.deleteBranch}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.admin.confirmDelete}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBranch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
