import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()
  
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

  // Get user profile with organization and location
  // Use explicit foreign key reference to avoid ambiguity between profiles_location_id_fkey and locations_pastor_id_fkey
  let profile = null
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        organization:organizations(*),
        location:locations!profiles_location_id_fkey(*)
      `)
      .eq("id", user.id)
      .maybeSingle()
    
    if (!error && data) {
      profile = data
    }
  } catch (e) {
    console.error("Error fetching profile:", e)
  }

  return (
    <DashboardContent 
      profile={profile} 
      user={{
        id: user.id,
        email: user.email || "",
        email_confirmed_at: user.email_confirmed_at || null,
      }} 
    />
  )
}
