-- Church Management SaaS Database Schema
-- Organizations (Tenants) - e.g., "Vida y Paz Global"
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations (Campus/Sede/Anexo) - e.g., "Downtown Campus", "North Annex"
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  is_main_campus BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles Enum Type
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('MEMBER', 'LEADER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Profiles (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'MEMBER',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_organization ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Organizations
-- Users can view their own organization
CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Anyone can view organizations for signup flow (to find a church)
CREATE POLICY "Anyone can view organizations for signup" ON organizations
  FOR SELECT USING (true);

-- Admins can update their own organization
CREATE POLICY "Admins can update their organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Anyone authenticated can create an organization (for new church registration)
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for Locations
-- Users can view locations in their organization
CREATE POLICY "Users can view locations in their organization" ON locations
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR true -- Allow viewing for signup flow
  );

-- Admins can create locations in their organization
CREATE POLICY "Admins can create locations" ON locations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
    OR auth.uid() IS NOT NULL -- Allow during signup
  );

-- Admins can update locations in their organization
CREATE POLICY "Admins can update locations" ON locations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can delete locations in their organization
CREATE POLICY "Admins can delete locations" ON locations
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- RLS Policies for Profiles
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Users can view profiles in their organization
CREATE POLICY "Users can view profiles in organization" ON profiles
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Allow profile creation during signup
CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Admins can update profiles in their organization
CREATE POLICY "Admins can update profiles in organization" ON profiles
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
