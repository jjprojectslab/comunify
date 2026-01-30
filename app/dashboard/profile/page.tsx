import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileContent } from "@/components/dashboard/profile-content"

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Get user profile with organization and location
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      organization:organizations(*),
      location:locations(*)
    `)
    .eq("id", user.id)
    .single()

  return (
    <ProfileContent 
      profile={profile} 
      user={{
        id: user.id,
        email: user.email || "",
        email_confirmed_at: user.email_confirmed_at || null,
      }} 
    />
  )
}
