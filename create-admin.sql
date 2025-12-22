-- Create the admin user if it doesn't exist
-- We use a fixed but valid UUID for now, the layout fallback will sync it to the real Supabase ID on first load.
INSERT INTO "User" (id, email, name, role, verified, "updatedAt")
VALUES ('5960ee9b-65fe-4ef0-a90f-c9361629e8b8', 'admin@school.edu', 'System Director', 'PRINCIPAL', true, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE 
SET role = 'PRINCIPAL', verified = true;

-- Ensure school exists and is linked
INSERT INTO "School" (id, name, "schoolCode", status) 
VALUES ('f1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'LUCY Academy of Excellence', 'LUCY-RE-01', 'ACTIVE')
ON CONFLICT ("schoolCode") DO NOTHING;

UPDATE "User" 
SET "schoolId" = 'f1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6'
WHERE email = 'admin@school.edu';
