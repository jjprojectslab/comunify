"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  ArrowLeft, 
  Search, 
  Plus, 
  Loader2, 
  UserMinus, 
  Star, 
  StarOff,
  Users,
  Mail
} from "lucide-react"
import { 
  addAreaMember, 
  removeAreaMember,
  toggleAreaLeader,
  type AreaMember 
} from "@/app/actions/areas"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import Link from "next/link"

type AvailableUser = { id: string; full_name: string; email: string; role: string }

interface AreaMembersClientProps {
  areaId: string
  areaName: string
  areaLocationId: string | null
  initialMembers: AreaMember[]
  initialAvailableUsers: AvailableUser[]
  profile: {
    id: string
    full_name: string
    role: string
  }
}

export function AreaMembersClient({
  areaId,
  areaName,
  areaLocationId,
  initialMembers,
  initialAvailableUsers,
  profile,
}: AreaMembersClientProps) {
  const [members, setMembers] = useState<AreaMember[]>(initialMembers)
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>(initialAvailableUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [addUserSearch, setAddUserSearch] = useState("")
  
  // Dialog states
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<AreaMember | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  const canSetLeader = ["SUPER_ADMIN", "PASTOR", "LEADER"].includes(profile.role)

  // Filter members by search
  const filteredMembers = members.filter(m => 
    m.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter available users by search
  const filteredAvailable = availableUsers.filter(u =>
    u.full_name?.toLowerCase().includes(addUserSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(addUserSearch.toLowerCase())
  )

  const handleAddMember = async (userId: string) => {
    setIsProcessing(userId)
    
    const result = await addAreaMember(areaId, userId)
    
    if (result.success) {
      // Move user from available to members
      const user = availableUsers.find(u => u.id === userId)
      if (user) {
        setAvailableUsers(prev => prev.filter(u => u.id !== userId))
        setMembers(prev => [{
          id: `temp-${Date.now()}`,
          area_id: areaId,
          user_id: userId,
          added_at: new Date().toISOString(),
          is_leader: false,
          user: user
        }, ...prev])
      }
    }
    
    setIsProcessing(null)
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return
    
    const result = await removeAreaMember(areaId, memberToRemove.user_id)
    
    if (result.success) {
      // Move user back to available
      if (memberToRemove.user) {
        setAvailableUsers(prev => [...prev, {
          id: memberToRemove.user!.id,
          full_name: memberToRemove.user!.full_name,
          email: memberToRemove.user!.email,
          role: memberToRemove.user!.role
        }])
      }
      setMembers(prev => prev.filter(m => m.user_id !== memberToRemove.user_id))
    }
    
    setMemberToRemove(null)
  }

  const handleToggleLeader = async (member: AreaMember) => {
    setIsProcessing(member.user_id)
    
    const newIsLeader = !member.is_leader
    const result = await toggleAreaLeader(areaId, member.user_id, newIsLeader)
    
    if (result.success) {
      setMembers(prev => prev.map(m => 
        m.user_id === member.user_id 
          ? { ...m, is_leader: newIsLeader }
          : m
      ))
    }
    
    setIsProcessing(null)
  }

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      SUPER_ADMIN: "bg-purple-100 text-purple-800",
      ADMIN: "bg-blue-100 text-blue-800",
      PASTOR: "bg-green-100 text-green-800",
      LEADER: "bg-amber-100 text-amber-800",
      MEMBER: "bg-gray-100 text-gray-800",
    }
    return roleColors[role] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile.full_name} userRole={profile.role} />
      
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/areas">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{areaName}</h1>
              <p className="text-muted-foreground">
                {members.length} miembro{members.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button onClick={() => setIsAddMemberOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Miembro
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Members List */}
        {filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No se encontraron miembros" : "No hay miembros en esta area"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Intenta con otro termino de busqueda" 
                  : "Agrega miembros para empezar a organizar esta area"
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddMemberOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Miembro
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {member.user?.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.user?.full_name}</p>
                          {member.is_leader && (
                            <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800">
                              <Star className="h-3 w-3" />
                              Lider
                            </Badge>
                          )}
                          <Badge variant="secondary" className={getRoleBadge(member.user?.role || "")}>
                            {member.user?.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {member.user?.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canSetLeader && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleLeader(member)}
                          disabled={isProcessing === member.user_id}
                          title={member.is_leader ? "Quitar como lider" : "Asignar como lider"}
                        >
                          {isProcessing === member.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : member.is_leader ? (
                            <StarOff className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMemberToRemove(member)}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Miembro</DialogTitle>
            <DialogDescription>
              Selecciona un usuario para agregarlo al area
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario..."
                value={addUserSearch}
                onChange={(e) => setAddUserSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredAvailable.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {addUserSearch ? "No se encontraron usuarios" : "No hay usuarios disponibles"}
                </p>
              ) : (
                filteredAvailable.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddMember(user.id)}
                      disabled={isProcessing === user.id}
                    >
                      {isProcessing === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitar Miembro</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de quitar a <strong>{memberToRemove?.user?.full_name}</strong> de esta area?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Quitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
