import { getDb } from '@/lib/db';

/**
 * GET /api/teacher/history
 * 
 * Without query params: Returns all sessions with attendance count.
 * With ?sessionId=xxx: Returns detailed attendance records for that session.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const sql = getDb();

    if (sessionId) {
      // Detailed records for a specific session
      const session = await sql`
        SELECT id, course_name, is_active, created_at, room_lat, room_lng
        FROM "ClassSessions"
        WHERE id = ${sessionId}
      `;

      if (session.length === 0) {
        return Response.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        );
      }

      const records = await sql`
        SELECT
          ar.id,
          ar.student_id,
          ar.check_in_time,
          ar.student_lat,
          ar.student_lng
        FROM "AttendanceRecords" ar
        WHERE ar.session_id = ${sessionId}
        ORDER BY ar.check_in_time ASC
      `;

      return Response.json({
        success: true,
        session: session[0],
        records,
        count: records.length,
      });
    }

    // List all sessions with attendance count
    const sessions = await sql`
      SELECT
        cs.id,
        cs.course_name,
        cs.is_active,
        cs.created_at,
        COALESCE(cnt.total, 0) AS attendance_count
      FROM "ClassSessions" cs
      LEFT JOIN (
        SELECT session_id, COUNT(*) AS total
        FROM "AttendanceRecords"
        GROUP BY session_id
      ) cnt ON cnt.session_id = cs.id
      ORDER BY cs.created_at DESC
      LIMIT 50
    `;

    return Response.json({ success: true, sessions });
  } catch (error) {
    console.error('history GET error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
