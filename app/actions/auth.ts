"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ============ AUTH ACTIONS ============

export async function signIn(formData: { email: string; password: string }) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      // Handle specific error codes
      if (error.message.includes("email_not_confirmed")) {
        return { success: false, error: "Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada." }
      }
      if (error.message.includes("Invalid login credentials")) {
        return { success: false, error: "Email o contraseña incorrectos." }
      }
      return { success: false, error: error.message }
    }

    revalidatePath("/", "layout")
    return { success: true, user: data.user }
  } catch (e) {
    console.error("SignIn error:", e)
    return { success: false, error: "Error de conexión. Por favor intenta de nuevo." }
  }
}

export async function signUp(formData: {
  firstName: string
  lastName: string
  email: string
  password: string
  organizationId?: string | null
  locationId?: string | null
}) {
  const supabase = await createClient()

  // Create user in Supabase Auth
  // The profile will be created automatically by the database trigger
  // which reads organization_id and location_id from user metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || undefined,
      data: {
        full_name: `${formData.firstName} ${formData.lastName}`,
        organization_id: formData.organizationId || null,
        location_id: formData.locationId || null,
      },
    },
  })

  if (authError) {
    return { success: false, error: authError.message }
  }

  if (!authData.user) {
    return { success: false, error: "Failed to create user" }
  }

  // Profile is created automatically by database trigger (handle_new_user)
  // with organization_id and location_id from user metadata

  revalidatePath("/", "layout")
  return { 
    success: true, 
    user: authData.user,
    message: "Cuenta creada exitosamente. Por favor revisa tu email para verificar tu cuenta."
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  const { redirect } = await import("next/navigation")
  redirect("/")
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      organization:organizations(*),
      location:locations(*)
    `)
    .eq("id", user.id)
    .single()

  return profile
}

// Alias for getUserProfile
export const getProfile = getUserProfile

// ============ ORGANIZATION ACTIONS ============

export async function searchOrganizations(query: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .ilike("name", `%${query}%`)
    .limit(10)

  if (error) {
    console.error("Error searching organizations:", error)
    return []
  }

  return data || []
}

export async function getOrganizationLocations(organizationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("locations")
    .select("id, name, is_main_campus, city, address")
    .eq("organization_id", organizationId)
    .order("is_main_campus", { ascending: false })

  if (error) {
    console.error("Error fetching locations:", error)
    return []
  }

  return data || []
}

export async function getAllOrganizations() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .order("name")
    .limit(50)

  if (error) {
    console.error("Error fetching organizations:", error)
    return []
  }

  return data || []
}

// ============ SUPER ADMIN ACTIONS ============

// Helper to check if current user is SUPER_ADMIN
async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return profile?.role === "SUPER_ADMIN"
}

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export async function createOrganization(formData: {
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  locationUrl?: string
}) {
  const supabase = await createClient()
  
  // Check if user is SUPER_ADMIN
  if (!(await isSuperAdmin())) {
    return { success: false, error: "Unauthorized: Only Super Admins can create organizations" }
  }

  let slug = generateSlug(formData.name)
  
  // Check if slug exists and generate unique one
  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("slug")
    .eq("slug", slug)
    .single()

  if (existingOrg) {
    slug = `${slug}-${Date.now().toString(36)}`
  }
  
  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: formData.name,
      slug: slug,
      description: formData.description || null,
      address: formData.address || null,
      phone: formData.phone || null,
      email: formData.email || null,
      website: formData.website || null,
      location_url: formData.locationUrl || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true, organization: data }
}

export async function updateOrganization(
  id: string,
  formData: {
    name?: string
    description?: string
    address?: string
    phone?: string
    email?: string
    website?: string
    locationUrl?: string
  }
) {
  const supabase = await createClient()
  
  if (!(await isSuperAdmin())) {
    return { success: false, error: "Unauthorized: Only Super Admins can update organizations" }
  }

  const updateData: Record<string, string | null> = {}
  if (formData.name) updateData.name = formData.name
  if (formData.description !== undefined) updateData.description = formData.description || null
  if (formData.address !== undefined) updateData.address = formData.address || null
  if (formData.phone !== undefined) updateData.phone = formData.phone || null
  if (formData.email !== undefined) updateData.email = formData.email || null
  if (formData.website !== undefined) updateData.website = formData.website || null
  if (formData.locationUrl !== undefined) updateData.location_url = formData.locationUrl || null

  const { data, error } = await supabase
    .from("organizations")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true, organization: data }
}

export async function deleteOrganization(id: string) {
  const supabase = await createClient()
  
  if (!(await isSuperAdmin())) {
    return { success: false, error: "Unauthorized: Only Super Admins can delete organizations" }
  }

  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Check if current user can manage users (not MEMBER)
export async function canManageUsers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  return profile?.role && profile.role !== "MEMBER"
}

// Get user roles from user_roles table
export async function getUserRoles(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
  
  if (error) {
    console.error("Error fetching user roles:", error)
    return []
  }
  
  return data?.map(r => r.role) || []
}

// Update user roles (add/remove)
export async function updateUserRoles(userId: string, roles: string[]) {
  const supabase = await createClient()
  
  if (!(await canManageUsers())) {
    return { success: false, error: "No autorizado: Solo usuarios con roles pueden gestionar roles" }
  }
  
  // Get current roles
  const { data: currentRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
  
  const currentRoleNames = currentRoles?.map(r => r.role) || []
  
  // Roles to add
  const rolesToAdd = roles.filter(r => !currentRoleNames.includes(r))
  // Roles to remove
  const rolesToRemove = currentRoleNames.filter(r => !roles.includes(r))
  
  // Add new roles
  if (rolesToAdd.length > 0) {
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert(rolesToAdd.map(role => ({ user_id: userId, role })))
    
    if (insertError) {
      return { success: false, error: insertError.message }
    }
  }
  
  // Remove roles
  if (rolesToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .in("role", rolesToRemove)
    
    if (deleteError) {
      return { success: false, error: deleteError.message }
    }
  }
  
  // Update primary role in profiles table (use the highest priority role)
  const rolePriority = ["SUPER_ADMIN", "ADMIN", "PASTOR", "LEADER", "MEMBER"]
  const primaryRole = rolePriority.find(r => roles.includes(r)) || "MEMBER"
  
  await supabase
    .from("profiles")
    .update({ role: primaryRole })
    .eq("id", userId)
  
  revalidatePath("/dashboard")
  return { success: true }
}

// Update user profile
export async function updateUserProfile(userId: string, data: {
  full_name?: string
  organization_id?: string | null
  location_id?: string | null
  is_active?: boolean
}) {
  const supabase = await createClient()
  
  if (!(await canManageUsers())) {
    return { success: false, error: "No autorizado" }
  }
  
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath("/dashboard")
  return { success: true }
}

// Confirm user email manually (admin function)
export async function confirmUserEmail(userId: string) {
  const supabase = await createClient()
  
  if (!(await canManageUsers())) {
    return { success: false, error: "No autorizado" }
  }
  
  // Use service role client to update auth.users
  const { createClient: createAdminClient } = await import("@supabase/supabase-js")
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  
  // Update user in auth.users to confirm email
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    email_confirm: true
  })
  
  if (authError) {
    console.error("Error confirming email in auth:", authError)
    return { success: false, error: authError.message }
  }
  
  // Also update our profile table
  const { error } = await supabase
    .from("profiles")
    .update({ email_verified: true })
    .eq("id", userId)
  
  if (error) {
    console.error("Error updating profile:", error)
  }
  
  revalidatePath("/dashboard")
  return { success: true, message: "Email verificado manualmente. El usuario ya puede iniciar sesion." }
}

// Delete a user (profile and user_roles - auth.users requires admin API)
export async function deleteUser(userId: string) {
  const supabase = await createClient()
  
  if (!(await canManageUsers())) {
    return { success: false, error: "No autorizado" }
  }

  // Get current user to prevent self-deletion
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === userId) {
    return { success: false, error: "No puedes eliminar tu propia cuenta" }
  }

  // Delete from user_roles first (due to foreign key)
  await supabase.from("user_roles").delete().eq("user_id", userId)
  
  // Delete profile
  const { error } = await supabase.from("profiles").delete().eq("id", userId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath("/dashboard")
  return { success: true, message: "Usuario eliminado correctamente" }
}

export async function getAllUsers() {
  const supabase = await createClient()
  
  if (!(await canManageUsers())) {
    return []
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      organization:organizations(id, name, slug),
      location:locations!profiles_location_id_fkey(id, name, city),
      user_roles(role)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    return []
  }

  // Transform to include roles array
  return (data || []).map(user => ({
    ...user,
    roles: user.user_roles?.map((r: { role: string }) => r.role) || [user.role]
  }))
}

export async function getAllLocations() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("locations")
    .select("id, name, city")
    .order("name")

  if (error) {
    console.error("Error fetching locations:", error)
    return []
  }

  return data || []
}

export async function getOrganizationsWithLocations() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("organizations")
    .select(`
      *,
      locations (
        *,
        pastor:profiles!locations_pastor_id_fkey(id, full_name, email)
      )
    `)
    .order("name")

  if (error) {
    console.error("Error fetching organizations:", error)
    return []
  }

  return data || []
}

export async function createLocation(formData: {
  organizationId: string
  name: string
  city?: string
  country?: string
  address?: string
  isMainCampus?: boolean
}) {
  const supabase = await createClient()
  
  if (!(await isSuperAdmin())) {
    return { success: false, error: "Unauthorized: Only Super Admins can create locations" }
  }

  const { data, error } = await supabase
    .from("locations")
    .insert({
      organization_id: formData.organizationId,
      name: formData.name,
      city: formData.city || null,
      country: formData.country || null,
      address: formData.address || null,
      is_main_campus: formData.isMainCampus || false,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true, location: data }
}

export async function updateLocation(
  id: string,
  formData: {
    name?: string
    address?: string
    city?: string
    country?: string
    phone?: string
    pastorId?: string | null
    isMainCampus?: boolean
  }
) {
  const supabase = await createClient()
  
  if (!(await isSuperAdmin())) {
    return { success: false, error: "Unauthorized: Only Super Admins can update locations" }
  }

  const updateData: Record<string, string | boolean | null> = {}
  if (formData.name) updateData.name = formData.name
  if (formData.address !== undefined) updateData.address = formData.address || null
  if (formData.city !== undefined) updateData.city = formData.city || null
  if (formData.country !== undefined) updateData.country = formData.country || null
  if (formData.phone !== undefined) updateData.phone = formData.phone || null
  if (formData.pastorId !== undefined) updateData.pastor_id = formData.pastorId || null
  if (formData.isMainCampus !== undefined) updateData.is_main_campus = formData.isMainCampus

  const { data, error } = await supabase
    .from("locations")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true, location: data }
}

export async function deleteLocation(id: string) {
  const supabase = await createClient()
  
  if (!(await isSuperAdmin())) {
    return { success: false, error: "Unauthorized: Only Super Admins can delete locations" }
  }

  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function getPastors() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "PASTOR")
    .order("full_name")

  if (error) {
    console.error("Error fetching pastors:", error)
    return []
  }

  return data || []
}

export async function createUserAsAdmin(formData: {
  firstName: string
  lastName: string
  email: string
  password: string
  organizationId?: string
  locationId?: string
  role: "MEMBER" | "LEADER" | "PASTOR" | "ADMIN"
}) {
  const supabase = await createClient()
  
  if (!(await canManageUsers())) {
    return { success: false, error: "No autorizado: Solo usuarios con roles pueden crear usuarios" }
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || undefined,
      data: {
        full_name: `${formData.firstName} ${formData.lastName}`,
      },
    },
  })

  if (authError) {
    return { success: false, error: authError.message }
  }

  if (!authData.user) {
    return { success: false, error: "Failed to create user" }
  }

  // Create profile immediately after user creation
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    organization_id: formData.organizationId || null,
    location_id: formData.locationId || null,
    full_name: `${formData.firstName} ${formData.lastName}`,
    email: formData.email,
    role: formData.role,
    is_active: true,
    email_verified: false,
  })

  if (profileError) {
    console.error("Error creating profile:", profileError)
    return { success: false, error: `Error creando perfil: ${profileError.message}` }
  }

  // Add role to user_roles table
  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: authData.user.id,
    role: formData.role,
  })

  if (roleError) {
    console.error("Error creating user role:", roleError)
  }

  revalidatePath("/dashboard")
  return { 
    success: true, 
    message: "Usuario creado. El usuario debe confirmar su email antes de iniciar sesión, o puedes verificarlo manualmente desde la edición." 
  }
}
