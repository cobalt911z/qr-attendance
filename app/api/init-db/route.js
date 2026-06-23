import { getDb } from '@/lib/db';

/**
 * GET /api/init-db
 * Initializes the database by running the SQL schema statements directly.
 * Run this once after deployment.
 *
 * Note: @neondatabase/serverless only supports tagged-template calls (sql`...`),
 * so we embed each statement as a literal template tag.
 */
export async function GET() {
  try {
    const sql = getDb();

    // ClassSessions table
    await sql`
      CREATE TABLE IF NOT EXISTS "ClassSessions" (
        id               SERIAL PRIMARY KEY,
        course_name      VARCHAR(255) NOT NULL,
        current_token    VARCHAR(255),
        token_expires_at TIMESTAMP,
        room_lat         DECIMAL(10, 7),
        room_lng         DECIMAL(10, 7),
        created_at       TIMESTAMP DEFAULT NOW(),
        is_active        BOOLEAN DEFAULT TRUE
      )
    `;

    // AttendanceRecords table
    await sql`
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
      )
    `;

    // Indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_token
      ON "ClassSessions"(current_token)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_attendance_session
      ON "AttendanceRecords"(session_id)
    `;

    return Response.json({
      success: true,
      message: 'Database initialized successfully. Tables: ClassSessions, AttendanceRecords',
      tables: ['ClassSessions', 'AttendanceRecords'],
      indexes: ['idx_sessions_token', 'idx_attendance_session'],
    });
  } catch (error) {
    console.error('DB init error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
