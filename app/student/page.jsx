'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function generateFingerprint() {
  const raw = `${navigator.userAgent}|${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}|${Intl.DateTimeFormat().resolvedOptions().timeZone}|${navigator.language}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h) ^ raw.charCodeAt(i);
  return Math.abs(h).toString(16);
}

/* ── SVG Icons (all with explicit width/height) ────────────── */
const Icons = {
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  CheckLg: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ID: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 10h2M16 14h2M7 10h5M7 14h2"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Shield: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Alert: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Logo: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>
    </svg>
  ),
};

const STEPS = ['สแกน QR', 'กรอกรหัส', 'ยืนยัน GPS', 'สำเร็จ'];

function StudentForm() {
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  const [studentId, setStudentId]     = useState('');
  const [phase, setPhase]             = useState('form');
  const [activeStep, setActiveStep]   = useState(token ? 2 : 1);
  const [resultMsg, setResultMsg]     = useState('');
  const [errorMsg, setErrorMsg]       = useState('');
  const [loadingMsg, setLoadingMsg]   = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(!!token);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/student/session-info?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSessionInfo(data);
          if (data.is_expired) {
            setErrorMsg('QR Code นี้หมดอายุแล้ว กรุณาสแกนใหม่');
          }
        } else {
          setErrorMsg(data.error || 'ดึงข้อมูลคาบเรียนล้มเหลว');
        }
      })
      .catch(() => setErrorMsg('ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อดึงข้อมูลวิชาได้'))
      .finally(() => setInfoLoading(false));
  }, [token]);

  const performVerify = async (lat, lng) => {
    const fingerprint = generateFingerprint();
    setPhase('verifying'); setLoadingMsg('กำลังยืนยันการเช็คชื่อ…');
    try {
      const res  = await fetch('/api/student/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, student_id: studentId.trim(), lat, lng, fingerprint }),
      });
      const data = await res.json();
      if (data.success) {
        setResultMsg(data.message || 'เช็คชื่อสำเร็จ');
        setPhase('success'); setActiveStep(4);
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาด');
        setPhase('error'); setActiveStep(2);
      }
    } catch {
      setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      setPhase('error'); setActiveStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) { setErrorMsg('กรุณากรอกรหัสนักศึกษา'); return; }
    if (!token)            { setErrorMsg('ไม่พบ Token กรุณาสแกน QR Code ใหม่'); return; }
    setErrorMsg('');

    if (sessionInfo?.is_expired) {
      setErrorMsg('QR Code นี้หมดอายุแล้ว กรุณาสแกนใหม่');
      return;
    }

    const gpsRequired = sessionInfo ? sessionInfo.gps_enabled !== false : true;

    if (!gpsRequired) {
      await performVerify(null, null);
      return;
    }

    setPhase('gps'); setActiveStep(3); setLoadingMsg('กำลังดึงตำแหน่ง GPS…');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        await performVerify(lat, lng);
      },
      (err) => {
        setErrorMsg(err.code === 1
          ? 'กรุณาอนุญาตให้เว็บไซต์เข้าถึง GPS แล้วลองใหม่'
          : `ไม่สามารถดึง GPS: ${err.message}`
        );
        setPhase('error'); setActiveStep(2);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const isLoading = phase === 'gps' || phase === 'verifying';

  return (
    <main className="sp-root">
      <div className="sp-card">

        {/* Step indicator */}
        <div className="sp-steps">
          {STEPS.map((label, i) => {
            const num      = i + 1;
            const isDone   = activeStep > num;
            const isActive = activeStep === num;
            return (
              <div key={i} className="sp-step">
                <div className={`sp-step-node ${isDone ? 'done' : isActive ? 'active' : 'future'}`}>
                  {isDone ? <Icons.Check /> : num}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`sp-step-connector ${isDone ? 'done' : ''}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Brand */}
        <div className="sp-brand">
          <div className="sp-brand-icon"><Icons.Logo /></div>
          <div>
            <p className="sp-brand-title">เช็คชื่อเข้าเรียน</p>
            {sessionInfo?.course_name ? (
              <p className="sp-brand-course">วิชา: {sessionInfo.course_name}</p>
            ) : (
              <p className="sp-brand-sub">QR Attendance System</p>
            )}
          </div>
        </div>

        {/* Token status */}
        {infoLoading ? (
          <div className="sp-token-badge sp-token-info">
            <span className="sp-token-dot" /><span>กำลังโหลดข้อมูลคาบเรียน…</span>
          </div>
        ) : (
          <div className={`sp-token-badge ${token && !sessionInfo?.is_expired ? 'sp-token-ok' : 'sp-token-bad'}`}>
            {token
              ? (sessionInfo?.is_expired
                  ? <><Icons.Alert /><span>QR Code หมดอายุแล้ว — กรุณาสแกนใหม่</span></>
                  : <><span className="sp-token-dot" /><span>QR Code ถูกต้อง — {sessionInfo?.gps_enabled !== false ? 'ตรวจสอบ GPS' : 'พร้อมเช็คชื่อ (ไม่ใช้ GPS)'}</span></>)
              : <><Icons.Alert /><span>ไม่พบ Token — กรุณาสแกน QR Code ใหม่</span></>
            }
          </div>
        )}

        {/* Success state */}
        {phase === 'success' ? (
          <div className="sp-success">
            <div className="sp-success-icon"><Icons.CheckLg /></div>
            <p className="sp-success-title">เช็คชื่อสำเร็จ</p>
            <p className="sp-success-msg">{resultMsg}</p>
            <p className="sp-success-hint">สามารถปิดหน้าต่างนี้ได้แล้ว</p>
          </div>
        ) : (
          <form id="checkin-form" className="sp-form" onSubmit={handleSubmit}>

            <div className="sp-field">
              <label htmlFor="student-id" className="sp-label">รหัสนักศึกษา</label>
              <div className="sp-input-wrap">
                <span className="sp-input-prefix"><Icons.ID /></span>
                <input
                  id="student-id" type="text" inputMode="text"
                  className="sp-input"
                  placeholder="เช่น 6501234567"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={isLoading || infoLoading || sessionInfo?.is_expired}
                  autoComplete="off" autoFocus
                />
              </div>
            </div>

            {errorMsg && (
              <div className="sp-alert sp-alert-error">
                <Icons.Alert />
                <span>{errorMsg}</span>
              </div>
            )}

            {isLoading && (
              <div className="sp-alert sp-alert-info">
                <div className="sp-dots"><span /><span /><span /></div>
                <span>{loadingMsg}</span>
              </div>
            )}

            <button id="btn-checkin" type="submit" className="sp-btn" disabled={isLoading || !token || infoLoading || sessionInfo?.is_expired}>
              {isLoading
                ? <span className="sp-btn-spinner" />
                : <><Icons.Arrow />ยืนยันเช็คชื่อ</>
              }
            </button>

            <div className="sp-divider" />

            <div className="sp-notice">
              <Icons.MapPin />
              <span>
                {sessionInfo && sessionInfo.gps_enabled === false
                  ? 'ระบบเช็คชื่อด้วยตัวตนเครื่องและอุปกรณ์ (ไม่ต้องเปิดสิทธิ์ GPS)'
                  : `ระบบจะขอสิทธิ์เข้าถึง GPS เพื่อยืนยันว่าคุณอยู่ในห้องเรียน (ภายใน ${sessionInfo?.max_distance || 50} เมตร)`}
              </span>
            </div>
            <div className="sp-notice" style={{ marginTop: '4px' }}>
              <Icons.Shield />
              <span>ข้อมูลของคุณถูกเข้ารหัสและใช้เพื่อยืนยันตัวตนเท่านั้น</span>
            </div>

          </form>
        )}
      </div>
    </main>
  );
}

export default function StudentPage() {
  return (
    <Suspense fallback={
      <main className="sp-root">
        <div className="sp-card" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'300px' }}>
          <div className="sp-dots"><span /><span /><span /></div>
        </div>
      </main>
    }>
      <StudentForm />
    </Suspense>
  );
}
