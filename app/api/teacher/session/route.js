import { getDb } from '@/lib/db';

/**
 * GET /api/teacher/session
 * Returns all class sessions ordered by most recent.
 */
export async function GET() {
  try {
    const sql = getDb();
    const sessions = await sql`
      SELECT id, course_name, is_active, created_at, room_lat, room_lng
      FROM "ClassSessions"
      ORDER BY created_at DESC
      LIMIT 20
    `;
    return Response.json({ success: true, sessions });
  } catch (error) {
    console.error('GET session error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/teacher/session
 * Body: { course_name, room_lat, room_lng }
 * Creates a new class session with the teacher's GPS location as the room anchor.
 */
export async function POST(request) {
  try {
    const { course_name, room_lat, room_lng } = await request.json();

    if (!course_name || room_lat == null || room_lng == null) {
      return Response.json(
        { success: false, error: 'course_name, room_lat, room_lng are required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    const result = await sql`
      INSERT INTO "ClassSessions" (course_name, room_lat, room_lng, is_active)
      VALUES (${course_name}, ${room_lat}, ${room_lng}, true)
      RETURNING id, course_name, room_lat, room_lng, created_at
    `;

    return Response.json({ success: true, session: result[0] });
  } catch (error) {
    console.error('POST session error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
