"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Types
export type Area = {
  id: string
  name: string
  description: string | null
  location_id: string
  created_by: string
  created_at: string
  location?: { id: string; name: string; city: string | null }
  creator?: { id: string; full_name: string }
  member_count?: number
}

export type AreaMember = {
  id: string
  area_id: string
  user_id: string
  added_at: string
  is_leader: boolean
  user?: { id: string; full_name: string; email: string; role: string }
}

// Check if user can manage areas (SUPER_ADMIN, PASTOR, LEADER)
async function canManageAreas() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false, profile: null }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, location_id")
    .eq("id", user.id)
    .single()
  
  const allowed = profile?.role && ["SUPER_ADMIN", "PASTOR", "LEADER"].includes(profile.role)
  return { allowed, profile }
}

// Get all areas (filtered by location for non-SUPER_ADMIN) 
export async function getAreas() {
  const supabase = await createClient()
  const { allowed, profile } = await canManageAreas()
  
  if (!allowed) return []

  let query = supabase
    .from("areas")
    .select(`
      *,
      location:locations(id, name, city),
      creator:profiles!areas_created_by_fkey(id, full_name)
    `)
    .order("created_at", { ascending: false })

  // Non-SUPER_ADMIN can only see areas from their location
  if (profile?.role !== "SUPER_ADMIN" && profile?.location_id) {
    query = query.eq("location_id", profile.location_id)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching areas:", error)
    return []
  }

  // Get member count for each area
  const areasWithCount = await Promise.all(
    (data || []).map(async (area) => {
      const { count } = await supabase
        .from("area_members")
        .select("*", { count: "exact", head: true })
        .eq("area_id", area.id)
      
      return { ...area, member_count: count || 0 }
    })
  )

  return areasWithCount
}

// Create a new area
export async function createArea(data: {
  name: string
  description?: string
  location_id: string
}) {
  const supabase = await createClient()
  const { allowed, profile } = await canManageAreas()
  
  if (!allowed || !profile) {
    return { success: false, error: "No autorizado", area: null }
  }

  // Non-SUPER_ADMIN can only create areas in their own location
  const locationId = profile.role === "SUPER_ADMIN" 
    ? data.location_id 
    : profile.location_id

  if (!locationId) {
    return { success: false, error: "Debes pertenecer a una sede para crear areas", area: null }
  }

  const { data: createdArea, error } = await supabase
    .from("areas")
    .insert({
      name: data.name,
      description: data.description || null,
      location_id: locationId,
      created_by: profile.id,
    })
    .select(`
      *,
      location:locations(id, name, city),
      creator:profiles!areas_created_by_fkey(id, full_name)
    `)
    .single()

  if (error) {
    console.error("[v0] Error creating area:", error)
    return { success: false, error: error.message, area: null }
  }

  revalidatePath("/dashboard/areas")
  return { 
    success: true, 
    area: createdArea ? { ...createdArea, member_count: 0 } : null 
  }
}

// Update an area
export async function updateArea(areaId: string, data: {
  name?: string
  description?: string
  location_id?: string
}) {
  const supabase = await createClient()
  const { allowed, profile } = await canManageAreas()
  
  if (!allowed) {
    return { success: false, error: "No autorizado" }
  }

  // Only SUPER_ADMIN can change location
  const updateData: Record<string, unknown> = {
    name: data.name,
    description: data.description,
    updated_at: new Date().toISOString(),
  }

  if (profile?.role === "SUPER_ADMIN" && data.location_id) {
    updateData.location_id = data.location_id
  }

  const { error } = await supabase
    .from("areas")
    .update(updateData)
    .eq("id", areaId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Delete an area
export async function deleteArea(areaId: string) {
  const supabase = await createClient()
  const { allowed } = await canManageAreas()
  
  if (!allowed) {
    return { success: false, error: "No autorizado" }
  }

  const { error } = await supabase
    .from("areas")
    .delete()
    .eq("id", areaId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Get members of an area with search filter
export async function getAreaMembers(areaId: string, searchTerm?: string) {
  const supabase = await createClient()
  
  // Use explicit foreign key reference to avoid ambiguity
  const { data, error } = await supabase
    .from("area_members")
    .select(`
      id,
      area_id,
      user_id,
      added_at,
      is_leader,
      user:profiles!area_members_user_id_fkey(id, full_name, email, role)
    `)
    .eq("area_id", areaId)
    .order("is_leader", { ascending: false })
    .order("added_at", { ascending: false })

  if (error) {
    console.error("Error fetching area members:", error)
    return []
  }

  let members = data || []

  // Filter by search term if provided
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase()
    members = members.filter(m => 
      m.user?.full_name?.toLowerCase().includes(term) ||
      m.user?.email?.toLowerCase().includes(term)
    )
  }

  return members
}

// Add member to area
export async function addAreaMember(areaId: string, userId: string) {
  const supabase = await createClient()
  const { allowed, profile } = await canManageAreas()
  
  if (!allowed || !profile) {
    return { success: false, error: "No autorizado" }
  }

  const { error } = await supabase.from("area_members").insert({
    area_id: areaId,
    user_id: userId,
    added_by: profile.id,
  })

  if (error) {
    console.error("[v0] Error adding area member:", error)
    // Si es error 23505, es por violación de constraint (ya existe)
    // Pero como removimos el UNIQUE, esto ya no debería pasar
    if (error.code === "23505") {
      return { success: false, error: "Este miembro ya esta en el area" }
    }
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/areas")
  return { success: true }
}

// Remove member from area
export async function removeAreaMember(areaId: string, userId: string) {
  const supabase = await createClient()
  const { allowed } = await canManageAreas()
  
  if (!allowed) {
    return { success: false, error: "No autorizado" }
  }

  const { error } = await supabase
    .from("area_members")
    .delete()
    .eq("area_id", areaId)
    .eq("user_id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Toggle member as leader
export async function toggleAreaLeader(areaId: string, userId: string, isLeader: boolean) {
  const supabase = await createClient()
  const { allowed, profile } = await canManageAreas()
  
  if (!allowed) {
    return { success: false, error: "No autorizado" }
  }

  // Only PASTOR and LEADER can set leaders (not regular members)
  if (!profile?.role || !["SUPER_ADMIN", "PASTOR", "LEADER"].includes(profile.role)) {
    return { success: false, error: "Solo pastores y lideres pueden asignar lideres de area" }
  }

  const { error } = await supabase
    .from("area_members")
    .update({ is_leader: isLeader })
    .eq("area_id", areaId)
    .eq("user_id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/areas")
  return { success: true }
}

// Get users available to add to an area (same location)
export async function getAvailableUsersForArea(areaId: string, locationId: string) {
  const supabase = await createClient()
  
  // Get users in the same location who are not already in this area
  const { data: existingMembers } = await supabase
    .from("area_members")
    .select("user_id")
    .eq("area_id", areaId)

  const existingIds = existingMembers?.map(m => m.user_id) || []

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("is_active", true)
    .order("full_name")

  // Filter by location
  query = query.eq("location_id", locationId)

  const { data, error } = await query

  if (error) {
    console.error("Error fetching available users:", error)
    return []
  }

  // Filter out existing members
  return (data || []).filter(user => !existingIds.includes(user.id))
}
