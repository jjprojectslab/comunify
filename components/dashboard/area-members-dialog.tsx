"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, UserPlus, X, Users } from "lucide-react"
import { 
  getAreaMembers, 
  addAreaMember, 
  removeAreaMember, 
  getAvailableUsersForArea,
  type Area,
  type AreaMember 
} from "@/app/actions/areas"

interface AreaMembersDialogProps {
  area: Area
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function AreaMembersDialog({ area, open, onOpenChange, onUpdate }: AreaMembersDialogProps) {
  const [members, setMembers] = useState<AreaMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<{ id: string; full_name: string; email: string; role: string }[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    const [membersData, usersData] = await Promise.all([
      getAreaMembers(area.id),
      getAvailableUsersForArea(area.id, area.location_id)
    ])
    setMembers(membersData)
    setAvailableUsers(usersData)
    setIsLoading(false)
  }

  useEffect(() => {
    if (open) {
      loadData()
      setSelectedUserId("")
    }
  }, [open, area.id])

  const handleAddMember = async () => {
    if (!selectedUserId) return
    
    setIsAdding(true)
    const result = await addAreaMember(area.id, selectedUserId)
    
    if (!result.success) {
      alert(result.error)
    } else {
      setSelectedUserId("")
      loadData()
      onUpdate()
    }
    
    setIsAdding(false)
  }

  const handleRemoveMember = async (userId: string) => {
    setRemovingId(userId)
    const result = await removeAreaMember(area.id, userId)
    
    if (!result.success) {
      alert(result.error)
    } else {
      loadData()
      onUpdate()
    }
    
    setRemovingId(null)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "bg-red-100 text-red-700"
      case "ADMIN": return "bg-orange-100 text-orange-700"
      case "PASTOR": return "bg-blue-100 text-blue-700"
      case "LEADER": return "bg-green-100 text-green-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: "Super Admin",
      ADMIN: "Admin",
      PASTOR: "Pastor",
      LEADER: "Lider",
      MEMBER: "Miembro"
    }
    return labels[role] || role
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Miembros de {area.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Member Section */}
          <div className="flex gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar miembro para agregar..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No hay usuarios disponibles
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUserId || isAdding}
              size="icon"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {members.length} miembro{members.length !== 1 ? "s" : ""} en esta area
            </h4>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay miembros en esta area
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {member.user?.full_name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.user?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(member.user?.role || "")}`}>
                        {getRoleLabel(member.user?.role || "")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={removingId === member.user_id}
                      >
                        {removingId === member.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
