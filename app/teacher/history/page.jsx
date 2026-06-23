'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ── SVG Icons ───────────────────────────────────── */
const Icons = {
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Clock: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  Logo: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit',
  });
}

function formatFullTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/* ── Export CSV ──────────────────────────────────── */
function exportCSV(session, records) {
  const header = 'ลำดับ,รหัสนักศึกษา,เวลาเช็คชื่อ,Lat,Lng\n';
  const rows = records.map((r, i) =>
    `${i + 1},${r.student_id},${formatFullTime(r.check_in_time)},${r.student_lat ?? ''},${r.student_lng ?? ''}`
  ).join('\n');

  const bom = '\uFEFF';
  const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_${session.course_name}_${formatDate(session.created_at)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Main Component ─────────────────────────────── */
export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailRecords, setDetailRecords] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/history');
      const data = await res.json();
      if (data.success) setSessions(data.sessions);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const openDetail = async (session) => {
    setSelectedSession(session);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/teacher/history?sessionId=${session.id}`);
      const data = await res.json();
      if (data.success) setDetailRecords(data.records);
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  const closeDetail = () => {
    setSelectedSession(null);
    setDetailRecords([]);
  };

  return (
    <main className="hs-root">
      {/* Header */}
      <header className="hs-header">
        <div className="hs-header-inner">
          <Link href="/teacher" className="hs-back-btn">
            <Icons.ArrowLeft />
            <span>กลับ</span>
          </Link>
          <div className="hs-logo">
            <div className="hs-logo-mark"><Icons.Logo /></div>
            <div className="hs-logo-text">
              <p className="hs-logo-name">ประวัติเช็คชื่อ</p>
              <p className="hs-logo-tagline">Attendance History</p>
            </div>
          </div>
          <div className="hs-header-spacer" />
        </div>
      </header>

      {/* Content */}
      <div className="hs-body">

        {/* Session list */}
        <div className={`hs-card hs-sessions ${selectedSession ? 'hs-hidden-mobile' : ''}`}>
          <div className="hs-card-title">
            <Icons.Calendar />
            <span>คาบเรียนทั้งหมด</span>
            <span className="hs-count-badge">{sessions.length}</span>
          </div>

          {loading ? (
            <div className="hs-loading">
              <div className="sp-dots"><span/><span/><span/></div>
              <p>กำลังโหลด...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="hs-empty">
              <Icons.Calendar />
              <p>ยังไม่มีคาบเรียน</p>
            </div>
          ) : (
            <div className="hs-list">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  className={`hs-session-item ${selectedSession?.id === s.id ? 'active' : ''}`}
                  onClick={() => openDetail(s)}
                >
                  <div className="hs-session-main">
                    <p className="hs-session-name">{s.course_name}</p>
                    <div className="hs-session-meta">
                      <Icons.Clock />
                      <span>{formatDate(s.created_at)} — {formatTime(s.created_at)}</span>
                    </div>
                  </div>
                  <div className="hs-session-right">
                    <span className="hs-session-count">
                      <Icons.Users />
                      {s.attendance_count} คน
                    </span>
                    <Icons.ChevronRight />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className={`hs-card hs-detail ${selectedSession ? 'hs-visible' : ''}`}>
          {!selectedSession ? (
            <div className="hs-empty">
              <Icons.Users />
              <p>เลือกคาบเรียนเพื่อดูรายละเอียด</p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="hs-detail-header">
                <div>
                  <p className="hs-detail-title">{selectedSession.course_name}</p>
                  <p className="hs-detail-date">
                    <Icons.Clock />
                    {formatDate(selectedSession.created_at)} — {formatTime(selectedSession.created_at)}
                  </p>
                </div>
                <div className="hs-detail-actions">
                  {detailRecords.length > 0 && (
                    <button
                      className="hs-btn-export"
                      onClick={() => exportCSV(selectedSession, detailRecords)}
                    >
                      <Icons.Download />
                      Export CSV
                    </button>
                  )}
                  <button className="hs-btn-close hs-mobile-only" onClick={closeDetail}>
                    <Icons.Close />
                  </button>
                </div>
              </div>

              {/* Detail content */}
              {detailLoading ? (
                <div className="hs-loading">
                  <div className="sp-dots"><span/><span/><span/></div>
                  <p>กำลังโหลด...</p>
                </div>
              ) : detailRecords.length === 0 ? (
                <div className="hs-empty">
                  <Icons.Users />
                  <p>ไม่มีนักเรียนเช็คชื่อในคาบนี้</p>
                </div>
              ) : (
                <>
                  <div className="hs-detail-summary">
                    <span className="hs-summary-badge">{detailRecords.length} คน เช็คชื่อ</span>
                  </div>
                  <div className="hs-table-wrap">
                    <table className="hs-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>รหัสนักศึกษา</th>
                          <th>เวลาเช็คชื่อ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailRecords.map((r, i) => (
                          <tr key={r.id}>
                            <td className="hs-td-num">{i + 1}</td>
                            <td className="hs-td-id">{r.student_id}</td>
                            <td className="hs-td-time">{formatFullTime(r.check_in_time)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>

      </div>
    </main>
  );
}
