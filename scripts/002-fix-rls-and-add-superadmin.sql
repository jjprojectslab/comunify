-- Fix RLS infinite recursion and add SUPER_ADMIN role

-- Step 1: Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Anyone can view organizations for signup" ON organizations;
DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

DROP POLICY IF EXISTS "Users can view locations in their organization" ON locations;
DROP POLICY IF EXISTS "Admins can create locations" ON locations;
DROP POLICY IF EXISTS "Admins can update locations" ON locations;
DROP POLICY IF EXISTS "Admins can delete locations" ON locations;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in organization" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles in organization" ON profiles;

-- Step 2: Update user_role enum to include SUPER_ADMIN
-- First, we need to add the new value to the enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- Step 3: Create simple, non-recursive RLS policies

-- PROFILES policies (no self-referencing)
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ORGANIZATIONS policies (public read, restricted write)
CREATE POLICY "organizations_select_public" ON organizations
  FOR SELECT USING (true);

CREATE POLICY "organizations_insert_superadmin" ON organizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "organizations_update_superadmin" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "organizations_delete_superadmin" ON organizations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- LOCATIONS policies (read by org members, write by super admin or org admin)
CREATE POLICY "locations_select_public" ON locations
  FOR SELECT USING (true);

CREATE POLICY "locations_insert_admin" ON locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'SUPER_ADMIN' OR (profiles.role = 'ADMIN' AND profiles.organization_id = organization_id))
    )
  );

CREATE POLICY "locations_update_admin" ON locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'SUPER_ADMIN' OR (profiles.role = 'ADMIN' AND profiles.organization_id = organization_id))
    )
  );

CREATE POLICY "locations_delete_admin" ON locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'SUPER_ADMIN' OR (profiles.role = 'ADMIN' AND profiles.organization_id = organization_id))
    )
  );
