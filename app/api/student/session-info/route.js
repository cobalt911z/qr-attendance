import { getDb } from '@/lib/db';

/**
 * GET /api/student/session-info
 * Query params: ?token=xxx
 * Returns course name and GPS verification requirements.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return Response.json(
        { success: false, error: 'ไม่พบ Token กรุณาสแกน QR Code ใหม่' },
        { status: 400 }
      );
    }

    const sql = getDb();
    const sessions = await sql`
      SELECT course_name, gps_enabled, max_distance, token_expires_at
      FROM "ClassSessions"
      WHERE current_token = ${token}
        AND is_active = true
    `;

    if (sessions.length === 0) {
      return Response.json(
        { success: false, error: 'QR Code ไม่ถูกต้อง หรือคาบเรียนนี้ถูกปิดไปแล้ว' },
        { status: 404 }
      );
    }

    const session = sessions[0];
    const now = new Date();
    const expiresAt = new Date(session.token_expires_at);
    const isExpired = now > expiresAt;

    return Response.json({
      success: true,
      course_name: session.course_name,
      gps_enabled: session.gps_enabled !== false,
      max_distance: session.max_distance || 50,
      is_expired: isExpired,
    });
  } catch (error) {
    console.error('GET student session-info error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
