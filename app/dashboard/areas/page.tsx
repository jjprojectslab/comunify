import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AreasPageClient } from "@/components/dashboard/areas-page-client"

export default async function AreasPage() {
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
      organization:organizations(*),
      location:locations!profiles_location_id_fkey(*)
    `)
    .eq("id", user.id)
    .single()

  // Check permission - only SUPER_ADMIN, PASTOR, LEADER can access
  if (!profile || !["SUPER_ADMIN", "PASTOR", "LEADER"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Get areas based on role
  let areasQuery = supabase
    .from("areas")
    .select(`
      *,
      location:locations(*),
      creator:profiles!areas_created_by_fkey(id, full_name)
    `)
    .order("created_at", { ascending: false })

  // Non-SUPER_ADMIN can only see areas from their location
  if (profile.role !== "SUPER_ADMIN" && profile.location_id) {
    areasQuery = areasQuery.eq("location_id", profile.location_id)
  }

  const { data: areas } = await areasQuery

  // Get locations for SUPER_ADMIN
  let locations: { id: string; name: string; city: string | null }[] = []
  if (profile.role === "SUPER_ADMIN") {
    const { data } = await supabase
      .from("locations")
      .select("id, name, city")
      .order("name")
    locations = data || []
  }

  return (
    <AreasPageClient 
      initialAreas={areas || []}
      locations={locations}
      profile={{
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
        location_id: profile.location_id,
      }}
    />
  )
}
