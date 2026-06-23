'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import QRDisplay from '@/components/QRDisplay';

const REFRESH_INTERVAL_SEC = 10;
const POLL_INTERVAL_MS = 5000;

/* ── SVG Icons (explicit width/height on every svg) ─────────── */
const Icons = {
  Logo: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" />
    </svg>
  ),
  Session: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  UsersLg: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Clock: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  MapPin: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Play: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Stop: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  Alert: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  History: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /><path d="M3.05 11a9 9 0 1 1 .5 4" /><polyline points="1 11 3 13 5 11" />
    </svg>
  ),
};

export default function TeacherPage() {
  const [courseName, setCourseName] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [token, setToken] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [locationInfo, setLocationInfo] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);

  const tokenRef = useRef(null);
  const pollRef = useRef(null);
  const clockRef = useRef(null);

  useEffect(() => { setBaseUrl(window.location.origin); }, []);

  const generateToken = useCallback(async (sid) => {
    try {
      const res = await fetch('/api/teacher/generate-token', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid }),
      });
      const data = await res.json();
      if (data.success) setToken(data.token);
    } catch { }
  }, []);

  const pollAttendance = useCallback(async (sid) => {
    try {
      const res = await fetch(`/api/teacher/attendance?sessionId=${sid}`);
      const data = await res.json();
      if (data.success) {
        setAttendanceRecords(data.records);
        setAttendanceCount(data.count);
      }
    } catch { }
  }, []);

  const handleStart = () => {
    if (!courseName.trim()) { setErrorMsg('กรุณากรอกชื่อวิชา'); return; }
    setErrorMsg('');
    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: room_lat, longitude: room_lng, accuracy } = pos.coords;
        setLocationInfo({ lat: room_lat, lng: room_lng, accuracy: Math.round(accuracy) });
        setStatus('creating');
        try {
          const res = await fetch('/api/teacher/session', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_name: courseName.trim(), room_lat, room_lng }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);

          const sid = data.session.id;
          setSessionId(sid);
          setSessionInfo(data.session);
          setStatus('running');
          setIsRunning(true);
          setSessionTime(0);

          await generateToken(sid);
          tokenRef.current = setInterval(() => generateToken(sid), REFRESH_INTERVAL_SEC * 1000);
          pollRef.current = setInterval(() => pollAttendance(sid), POLL_INTERVAL_MS);
          clockRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
        } catch (err) {
          setStatus('error');
          setErrorMsg(err.message);
        }
      },
      () => {
        setStatus('error');
        setErrorMsg('ไม่สามารถดึงตำแหน่ง GPS ได้ กรุณาอนุญาตการเข้าถึง Location');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleStop = () => {
    clearInterval(tokenRef.current);
    clearInterval(pollRef.current);
    clearInterval(clockRef.current);
    setIsRunning(false); setStatus('idle'); setToken(null);
    setAttendanceRecords([]); setAttendanceCount(0);
    setSessionTime(0); setSessionInfo(null); setLocationInfo(null);
  };

  useEffect(() => () => {
    clearInterval(tokenRef.current);
    clearInterval(pollRef.current);
    clearInterval(clockRef.current);
  }, []);

  const fmtTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const isLoading = status === 'locating' || status === 'creating';

  return (
    <main className="tp-root">

      {/* Header */}
      <header className="tp-header">
        <div className="tp-header-inner">
          <div className="tp-logo">
            <div className="tp-logo-mark"><Icons.Logo /></div>
            <div className="tp-logo-text">
              <p className="tp-logo-name">QR Attendance</p>
              <p className="tp-logo-tagline">ระบบเช็คชื่อ Dynamic QR</p>
            </div>
          </div>

          <div className="tp-stats-row">
            {isRunning && (
              <>
                <div className="tp-stat">
                  <span className="tp-stat-val">{fmtTime(sessionTime)}</span>
                  <span className="tp-stat-lbl">elapsed</span>
                </div>
                <div className="tp-stat">
                  <span className="tp-stat-val">{attendanceCount}</span>
                  <span className="tp-stat-lbl">checked in</span>
                </div>
                <div className="tp-live-pill">
                  <span className="tp-live-dot" />
                  LIVE
                </div>
              </>
            )}
          </div>
          <Link href="/teacher/history" className="tp-history-btn">
            <Icons.History />
            <span>ประวัติ</span>
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="tp-body">

        {/* Left card */}
        <div className="tp-card">
          {!isRunning ? (

            /* Setup form */
            <div className="tp-setup-panel">
              <div className="tp-panel-header">
                <div className="tp-panel-icon"><Icons.Session /></div>
                <div>
                  <p className="tp-panel-title">สร้างคาบเรียนใหม่</p>
                  <p className="tp-panel-subtitle">QR Code will regenerate every 10 seconds</p>
                </div>
              </div>

              <div className="tp-field">
                <label htmlFor="course-name" className="tp-label">ชื่อวิชา / คาบเรียน</label>
                <input
                  id="course-name" type="text" className="tp-input"
                  placeholder=""
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  disabled={isLoading}
                />
              </div>

              {errorMsg && (
                <div className="tp-error">
                  <Icons.Alert />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="tp-divider" />

              <div className="tp-features">
                <div className="tp-feature-item">
                  <span className="tp-feature-dot" />
                  QR Code เปลี่ยนทุก 10 วินาที — ป้องกันการส่งต่อ
                </div>
                <div className="tp-feature-item">
                  <span className="tp-feature-dot" />
                  ยืนยันตำแหน่ง GPS ภายใน 50 เมตร
                </div>
                <div className="tp-feature-item">
                  <span className="tp-feature-dot" />
                  ตรวจจับ Device Fingerprint — ป้องกันเช็คชื่อซ้ำ
                </div>
              </div>

              <button
                id="btn-start"
                className="tp-btn-primary"
                onClick={handleStart}
                disabled={isLoading}
              >
                {isLoading ? (
                  <><span className="tp-spinner" />{status === 'locating' ? 'กำลังดึงตำแหน่ง GPS…' : 'กำลังสร้าง Session…'}</>
                ) : (
                  <><Icons.Play />เริ่มเช็คชื่อ</>
                )}
              </button>
            </div>

          ) : (

            /* QR display */
            <div className="tp-qr-panel">
              <div className="tp-course-badge">
                <span className="tp-course-badge-dot" />
                {sessionInfo?.course_name}
              </div>

              <QRDisplay token={token} baseUrl={baseUrl} intervalSec={REFRESH_INTERVAL_SEC} />

              {locationInfo && (
                <div className="tp-gps-row">
                  <Icons.MapPin />
                  <span className="tp-gps-coords">
                    {locationInfo.lat.toFixed(5)}, {locationInfo.lng.toFixed(5)}
                  </span>
                  <span className="tp-gps-acc">±{locationInfo.accuracy} m</span>
                </div>
              )}

              <button id="btn-stop" className="tp-btn-danger" onClick={handleStop}>
                <Icons.Stop />หยุดเช็คชื่อ
              </button>
            </div>
          )}
        </div>

        {/* Right card — attendance */}
        <div className="tp-card tp-right">
          <div className="tp-right-header">
            <div className="tp-right-title">
              <Icons.Users />
              รายชื่อผู้เช็คชื่อ
            </div>
            {attendanceCount > 0 && (
              <span className="tp-count-badge">{attendanceCount} คน</span>
            )}
          </div>

          {attendanceRecords.length === 0 ? (
            <div className="tp-empty">
              <div className="tp-empty-icon"><Icons.UsersLg /></div>
              <p className="tp-empty-title">ยังไม่มีนักเรียนเช็คชื่อ</p>
              <p className="tp-empty-sub">
                {isRunning ? 'รอนักเรียนสแกน QR Code…' : 'กด "เริ่มเช็คชื่อ" เพื่อเริ่มต้น'}
              </p>
            </div>
          ) : (
            <>
              <div className="tp-table-wrap">
                <table className="tp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>รหัสนักศึกษา</th>
                      <th>เวลา</th>
                      <th>ระยะห่าง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((r, i) => (
                      <tr key={r.id}>
                        <td className="tp-td-num">{i + 1}</td>
                        <td className="tp-td-id">{r.student_id}</td>
                        <td className="tp-td-time">
                          {new Date(r.check_in_time).toLocaleTimeString('th-TH', {
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                          })}
                        </td>
                        <td className="tp-td-dist">
                          {r.distance_m != null ? `${r.distance_m} m` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isRunning && (
                <div className="tp-table-footer">อัปเดตอัตโนมัติทุก 5 วินาที</div>
              )}
            </>
          )}
        </div>

      </div>
    </main>
  );
}
