-- IDs
-- School: f1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6
-- Grade: g1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6
-- Class: c1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6
-- Student: s1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6

-- 1. Create Subjects
INSERT INTO "Subject" (id, "schoolId", name) VALUES
('sub-math', 'f1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'Advanced Mathematics'),
('sub-sci', 'f1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'Quantum Physics'),
('sub-eng', 'f1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'Modern Literature')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Teacher User (Placeholder)
INSERT INTO "User" (id, email, name, role, verified, "schoolId", "updatedAt")
VALUES ('t1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'teacher@school.edu', 'Prof. Orion Vance', 'TEACHER', true, 'f1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 3. Create Staffing Assignments
INSERT INTO "TeacherAssignment" (id, "teacherId", "classId", "subjectId") VALUES
('ta-math', 't1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'c1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'sub-math'),
('ta-sci', 't1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'c1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'sub-sci')
ON CONFLICT (id) DO NOTHING;

-- 4. Set Attendance Config
UPDATE "School" 
SET "attendanceConfig" = '{"type": "PERIOD", "lockAfterMinutes": 30, "enableLateMarking": true}'
WHERE id = 'f1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
