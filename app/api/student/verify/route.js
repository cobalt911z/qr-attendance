import { getDb } from '@/lib/db';
import { haversineDistance } from '@/lib/haversine';

/**
 * POST /api/student/verify
 * Body: { token, student_id, lat, lng, fingerprint }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { token, student_id, lat, lng, fingerprint } = body;

    // ── Validate basic required fields ─────────────────────────────────────────
    if (!token || !student_id || !fingerprint) {
      return Response.json(
        { success: false, error: 'กรุณาส่งข้อมูลให้ครบ (token, student_id, fingerprint)' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // ── 1 & 2: Find session by token and check expiry ────────────────────────
    const sessions = await sql`
      SELECT id, room_lat, room_lng, gps_enabled, max_distance, token_expires_at
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

    // ── 3: GPS proximity check (if enabled) ───────────────────────────────────
    const isGpsEnabled = session.gps_enabled !== false;
    let distance = null;

    if (isGpsEnabled) {
      if (lat == null || lng == null) {
        return Response.json(
          { success: false, error: 'กรุณาอนุญาตสิทธิ์เข้าถึงพิกัด GPS เพื่อยืนยันตัวตน' },
          { status: 400 }
        );
      }

      if (session.room_lat == null || session.room_lng == null) {
        return Response.json(
          { success: false, error: 'ยังไม่ได้ตั้งค่าพิกัดห้องเรียนบนเซิร์ฟเวอร์' },
          { status: 400 }
        );
      }

      distance = haversineDistance(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(session.room_lat),
        parseFloat(session.room_lng)
      );

      const maxLimit = session.max_distance || 50;

      if (distance > maxLimit) {
        return Response.json(
          {
            success: false,
            error: `ตำแหน่งของคุณอยู่ห่างจากห้องเรียน ${Math.round(distance)} เมตร (ต้องอยู่ภายใน ${maxLimit} เมตร)`,
          },
          { status: 403 }
        );
      }
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
        (${session.id}, ${student_id}, ${isGpsEnabled ? lat : null}, ${isGpsEnabled ? lng : null}, ${fingerprint}, NOW())
    `;

    return Response.json({
      success: true,
      message: isGpsEnabled
        ? `เช็คชื่อสำเร็จ! (ระยะห่าง ${Math.round(distance)} เมตรจากห้องเรียน)`
        : 'เช็คชื่อสำเร็จ!',
      student_id,
      distance_m: isGpsEnabled ? Math.round(distance) : null,
    });
  } catch (error) {
    console.error('verify error:', error);
    return Response.json(
      { success: false, error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}

