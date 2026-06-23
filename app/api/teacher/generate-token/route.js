import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/teacher/generate-token
 * Body: { sessionId }
 * Generates a new UUID token, sets it to expire in 15 seconds,
 * updates the ClassSession, and returns the token + expiry.
 */
export async function POST(request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return Response.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    const newToken = uuidv4();

    // Set expiry 15 seconds from now (server time)
    const result = await sql`
      UPDATE "ClassSessions"
      SET
        current_token    = ${newToken},
        token_expires_at = NOW() + INTERVAL '15 seconds'
      WHERE id = ${sessionId}
      RETURNING current_token, token_expires_at
    `;

    if (result.length === 0) {
      return Response.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      token: result[0].current_token,
      expires_at: result[0].token_expires_at,
    });
  } catch (error) {
    console.error('generate-token error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
