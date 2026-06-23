'use client';

/**
 * AttendanceTable — displays a live list of students who have checked in.
 * @param {Array} records - Array of attendance record objects
 * @param {number} count - Total count
 */
export default function AttendanceTable({ records = [], count = 0 }) {
  if (records.length === 0) {
    return (
      <div className="attendance-empty">
        <div className="attendance-empty-icon">👥</div>
        <p>ยังไม่มีนักเรียนเช็คชื่อ</p>
      </div>
    );
  }

  return (
    <div className="attendance-wrapper">
      <div className="attendance-header">
        <h3 className="attendance-title">รายชื่อผู้เช็คชื่อ</h3>
        <span className="attendance-badge">{count} คน</span>
      </div>
      <div className="attendance-scroll">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>#</th>
              <th>รหัสนักศึกษา</th>
              <th>เวลาเช็คชื่อ</th>
              <th>ระยะห่าง</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => {
              const time = new Date(r.check_in_time).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              return (
                <tr key={r.id} className="attendance-row">
                  <td className="attendance-num">{i + 1}</td>
                  <td className="attendance-student-id">{r.student_id}</td>
                  <td className="attendance-time">{time}</td>
                  <td className="attendance-dist">
                    {r.distance_m != null ? `${r.distance_m} ม.` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
