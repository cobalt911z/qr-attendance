import { getDb } from '@/lib/db';

/**
 * GET /api/teacher/attendance?sessionId=xxx
 * Returns all students who have checked in for a given session.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return Response.json(
        { success: false, error: 'sessionId query param is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
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

    return Response.json({ success: true, records, count: records.length });
  } catch (error) {
    console.error('attendance GET error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
