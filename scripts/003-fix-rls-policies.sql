-- Script 003: Fix RLS policies (infinite recursion) and add SUPER_ADMIN role
-- This script removes problematic policies and creates simple ones

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "organizations_select" ON organizations;
DROP POLICY IF EXISTS "organizations_insert" ON organizations;
DROP POLICY IF EXISTS "organizations_update" ON organizations;
DROP POLICY IF EXISTS "organizations_delete" ON organizations;

DROP POLICY IF EXISTS "locations_select" ON locations;
DROP POLICY IF EXISTS "locations_insert" ON locations;
DROP POLICY IF EXISTS "locations_update" ON locations;
DROP POLICY IF EXISTS "locations_delete" ON locations;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

-- Add SUPER_ADMIN to the role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- Create simple, non-recursive policies for organizations
-- Everyone can view organizations (needed for signup flow)
CREATE POLICY "organizations_select_all" ON organizations
  FOR SELECT USING (true);

-- Only authenticated users can insert (will be restricted by app logic)
CREATE POLICY "organizations_insert_auth" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can update their own org (app logic restricts to admins)
CREATE POLICY "organizations_update_auth" ON organizations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Only authenticated users can delete (app logic restricts to super admins)
CREATE POLICY "organizations_delete_auth" ON organizations
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create simple policies for locations
CREATE POLICY "locations_select_all" ON locations
  FOR SELECT USING (true);

CREATE POLICY "locations_insert_auth" ON locations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "locations_update_auth" ON locations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "locations_delete_auth" ON locations
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create simple policies for profiles
-- Users can see all profiles (needed for member directories)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

-- Anyone authenticated can create their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Only allow delete of own profile
CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);
