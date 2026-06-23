import { getDb } from '@/lib/db';

/**
 * GET /api/teacher/session
 * Returns all class sessions ordered by most recent.
 */
export async function GET() {
  try {
    const sql = getDb();
    const sessions = await sql`
      SELECT id, course_name, is_active, created_at, room_lat, room_lng, gps_enabled, max_distance
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
 * Body: { course_name, room_lat, room_lng, gps_enabled, max_distance }
 * Creates a new class session with optional GPS parameters.
 */
export async function POST(request) {
  try {
    const { course_name, room_lat, room_lng, gps_enabled, max_distance } = await request.json();

    const isGpsEnabled = gps_enabled !== false;
    const distanceLimit = max_distance != null ? parseInt(max_distance) : 50;

    if (!course_name) {
      return Response.json(
        { success: false, error: 'กรุณากรอกชื่อวิชา' },
        { status: 400 }
      );
    }

    if (isGpsEnabled && (room_lat == null || room_lng == null)) {
      return Response.json(
        { success: false, error: 'กรุณาส่งพิกัดห้องเรียนเมื่อต้องการตรวจสอบ GPS' },
        { status: 400 }
      );
    }

    const sql = getDb();
    const result = await sql`
      INSERT INTO "ClassSessions" (course_name, room_lat, room_lng, gps_enabled, max_distance, is_active)
      VALUES (${course_name}, ${isGpsEnabled ? room_lat : null}, ${isGpsEnabled ? room_lng : null}, ${isGpsEnabled}, ${distanceLimit}, true)
      RETURNING id, course_name, room_lat, room_lng, gps_enabled, max_distance, created_at
    `;

    return Response.json({ success: true, session: result[0] });
  } catch (error) {
    console.error('POST session error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

