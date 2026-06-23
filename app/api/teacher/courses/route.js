import { getDb } from '@/lib/db';

/**
 * GET /api/teacher/courses
 * Returns a list of all unique course names.
 */
export async function GET() {
  try {
    const sql = getDb();
    const courses = await sql`
      SELECT DISTINCT course_name
      FROM "ClassSessions"
      WHERE course_name IS NOT NULL AND course_name != ''
      ORDER BY course_name
    `;
    const courseList = courses.map((c) => c.course_name);
    return Response.json({ success: true, courses: courseList });
  } catch (error) {
    console.error('GET courses error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
