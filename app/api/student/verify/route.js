import { getDb } from '@/lib/db';
import { haversineDistance } from '@/lib/haversine';

const MAX_DISTANCE_METRES = 50; // students must be within 50 m of classroom

/**
 * POST /api/student/verify
 * Body: { token, student_id, lat, lng, fingerprint }
 *
 * Anti-cheat checks (in order):
 *  1. Token must exist in ClassSessions
 *  2. Token must not be expired (server-side check)
 *  3. Student GPS must be within 50 m of room GPS
 *  4. student_id must not already have checked in to this session
 *  5. device fingerprint must not already be used in this session
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { token, student_id, lat, lng, fingerprint } = body;

    // ── Validate required fields ─────────────────────────────────────────────
    if (!token || !student_id || lat == null || lng == null || !fingerprint) {
      return Response.json(
        { success: false, error: 'กรุณาส่งข้อมูลให้ครบ (token, student_id, lat, lng, fingerprint)' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // ── 1 & 2: Find session by token and check expiry ────────────────────────
    const sessions = await sql`
      SELECT id, room_lat, room_lng, token_expires_at
      FROM "ClassSessions"
      WHERE current_token = ${token}
        AND is_active = true
    `;

    if (sessions.length === 0) {
      return Response.json(
        { success: false, error: 'QR Code ไม่ถูกต้อง กรุณาสแกนใหม่' },
        { status: 401 }
      );
    }

    const session = sessions[0];
    const now = new Date();
    const expiresAt = new Date(session.token_expires_at);

    if (now > expiresAt) {
      return Response.json(
        { success: false, error: 'QR Code หมดอายุแล้ว กรุณาสแกน QR Code ล่าสุด' },
        { status: 401 }
      );
    }

    // ── 3: GPS proximity check ───────────────────────────────────────────────
    if (session.room_lat == null || session.room_lng == null) {
      return Response.json(
        { success: false, error: 'ยังไม่ได้ตั้งค่าพิกัดห้องเรียน' },
        { status: 400 }
      );
    }

    const distance = haversineDistance(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(session.room_lat),
      parseFloat(session.room_lng)
    );

    if (distance > MAX_DISTANCE_METRES) {
      return Response.json(
        {
          success: false,
          error: `ตำแหน่งของคุณอยู่ห่างจากห้องเรียน ${Math.round(distance)} เมตร (ต้องอยู่ภายใน ${MAX_DISTANCE_METRES} เมตร)`,
        },
        { status: 403 }
      );
    }

    // ── 4 & 5: Duplicate check (student_id + fingerprint) ───────────────────
    const existing = await sql`
      SELECT id, student_id, device_fingerprint
      FROM "AttendanceRecords"
      WHERE session_id = ${session.id}
        AND (student_id = ${student_id} OR device_fingerprint = ${fingerprint})
    `;

    if (existing.length > 0) {
      const dupByStudent = existing.some((r) => r.student_id === student_id);
      if (dupByStudent) {
        return Response.json(
          { success: false, error: 'รหัสนักศึกษานี้ได้เช็คชื่อในคาบนี้แล้ว' },
          { status: 409 }
        );
      }
      return Response.json(
        { success: false, error: 'อุปกรณ์นี้ได้ใช้เช็คชื่อในคาบนี้แล้ว' },
        { status: 409 }
      );
    }

    // ── 5: Record the attendance ─────────────────────────────────────────────
    await sql`
      INSERT INTO "AttendanceRecords"
        (session_id, student_id, student_lat, student_lng, device_fingerprint, check_in_time)
      VALUES
        (${session.id}, ${student_id}, ${lat}, ${lng}, ${fingerprint}, NOW())
    `;

    return Response.json({
      success: true,
      message: `เช็คชื่อสำเร็จ! (ระยะห่าง ${Math.round(distance)} เมตรจากห้องเรียน)`,
      student_id,
      distance_m: Math.round(distance),
    });
  } catch (error) {
    console.error('verify error:', error);
    return Response.json(
      { success: false, error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
