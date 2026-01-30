-- Seed data for testing
-- Insert sample organizations
INSERT INTO organizations (id, name, slug, description) VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Iglesia Vida y Paz', 'vida-y-paz', 'Comunidad de fe comprometida con el servicio'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Centro Cristiano Esperanza', 'centro-esperanza', 'Donde la esperanza cobra vida'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Iglesia El Redentor', 'el-redentor', 'Renovando vidas a través del amor')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample locations for each organization
INSERT INTO locations (organization_id, name, address, city, country, is_main_campus) VALUES
  -- Vida y Paz locations
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Campus Central', 'Av. Principal 123', 'Ciudad de México', 'México', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Campus Norte', 'Calle Norte 456', 'Ciudad de México', 'México', false),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Anexo Sur', 'Blvd. Sur 789', 'Ciudad de México', 'México', false),
  -- Centro Esperanza locations
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Sede Principal', 'Calle Central 100', 'Bogotá', 'Colombia', true),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Sede Chapinero', 'Carrera 7 #50', 'Bogotá', 'Colombia', false),
  -- El Redentor locations
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Templo Mayor', 'Jr. Lima 200', 'Lima', 'Perú', true),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Sede Miraflores', 'Av. Pardo 300', 'Lima', 'Perú', false);
