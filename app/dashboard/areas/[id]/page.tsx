import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AreaMembersClient } from "@/components/dashboard/area-members-client"

export default async function AreaMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: areaId } = await params
  const supabase = await createClient()
  
  // Auth check
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    user = data.user
  } catch {
    redirect("/login")
  }
  
  if (!user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      location:locations!profiles_location_id_fkey(*)
    `)
    .eq("id", user.id)
    .single()

  // Check permission
  if (!profile || !["SUPER_ADMIN", "PASTOR", "LEADER"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Get area details
  const { data: area } = await supabase
    .from("areas")
    .select(`
      *,
      location:locations(*)
    `)
    .eq("id", areaId)
    .single()

  if (!area) {
    notFound()
  }

  // Check if user has access to this area (SUPER_ADMIN sees all, others only their location)
  if (profile.role !== "SUPER_ADMIN" && area.location_id !== profile.location_id) {
    redirect("/dashboard/areas")
  }

  // Get area members
  const { data: members } = await supabase
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

  // Get available users to add (same location, not already members)
  const memberIds = (members || []).map(m => m.user_id)
  
  let availableUsersQuery = supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("is_active", true)
    .order("full_name")

  if (area.location_id) {
    availableUsersQuery = availableUsersQuery.eq("location_id", area.location_id)
  }

  if (memberIds.length > 0) {
    availableUsersQuery = availableUsersQuery.not("id", "in", `(${memberIds.join(",")})`)
  }

  const { data: availableUsers } = await availableUsersQuery

  return (
    <AreaMembersClient
      areaId={areaId}
      areaName={area.name}
      areaLocationId={area.location_id}
      initialMembers={members || []}
      initialAvailableUsers={availableUsers || []}
      profile={{
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
      }}
    />
  )
}
