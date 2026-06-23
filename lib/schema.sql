-- ============================================================
-- QR Attendance System — Database Schema
-- Run via GET /api/init-db  (once after deployment)
-- ============================================================

-- Class sessions created by the teacher
CREATE TABLE IF NOT EXISTS "ClassSessions" (
  id               SERIAL PRIMARY KEY,
  course_name      VARCHAR(255) NOT NULL,
  current_token    VARCHAR(255),
  token_expires_at TIMESTAMP,
  room_lat         DECIMAL(10, 7),
  room_lng         DECIMAL(10, 7),
  created_at       TIMESTAMP DEFAULT NOW(),
  is_active        BOOLEAN DEFAULT TRUE
);

-- Student check-in records
CREATE TABLE IF NOT EXISTS "AttendanceRecords" (
  id                 SERIAL PRIMARY KEY,
  session_id         INTEGER NOT NULL REFERENCES "ClassSessions"(id) ON DELETE CASCADE,
  student_id         VARCHAR(100) NOT NULL,
  student_lat        DECIMAL(10, 7),
  student_lng        DECIMAL(10, 7),
  device_fingerprint VARCHAR(255),
  check_in_time      TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, student_id),
  UNIQUE(session_id, device_fingerprint)
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_sessions_token ON "ClassSessions"(current_token);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON "AttendanceRecords"(session_id);
