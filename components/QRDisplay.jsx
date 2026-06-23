'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

export default function QRDisplay({ token, baseUrl, intervalSec = 10 }) {
  const [progress, setProgress]   = useState(100);
  const [secondsLeft, setSecondsLeft] = useState(intervalSec);
  const [isNew, setIsNew]         = useState(false);

  useEffect(() => {
    if (!token) return;
    setProgress(100); setSecondsLeft(intervalSec); setIsNew(true);
    const t0 = setTimeout(() => setIsNew(false), 500);

    const totalMs = intervalSec * 1000;
    const tickMs  = 50;
    let elapsed   = 0;

    const timer = setInterval(() => {
      elapsed += tickMs;
      const pct = Math.max(0, 100 - (elapsed / totalMs) * 100);
      setProgress(pct);
      setSecondsLeft(Math.ceil(((totalMs - elapsed) / totalMs) * intervalSec));
      if (elapsed >= totalMs) clearInterval(timer);
    }, tickMs);

    return () => { clearInterval(timer); clearTimeout(t0); };
  }, [token, intervalSec]);

  const qrUrl     = token ? `${baseUrl}/student?token=${token}` : '';
  const isExpiring = progress < 30;
  const isWarning  = progress >= 30 && progress < 60;

  const statusLabel = isExpiring ? 'หมดอายุ' : isWarning ? 'กำลังจะเปลี่ยน' : 'พร้อมใช้งาน';
  const statusClass = isExpiring ? 'danger' : isWarning ? 'warning' : 'ok';

  // Ring math
  const R    = 143;
  const circ = 2 * Math.PI * R;
  const dash = circ * (progress / 100);

  return (
    <div className="qrd-root">
      {token ? (
        <>
          <div className="qrd-frame">
            {/* Progress ring */}
            <svg className="qrd-svg-ring" viewBox="0 0 300 300" width="300" height="300">
              <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
              <circle
                cx="150" cy="150" r={R} fill="none"
                stroke={isExpiring ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                transform="rotate(-90 150 150)"
                style={{ transition: 'stroke-dasharray 0.05s linear, stroke 0.4s ease' }}
              />
            </svg>

            {/* QR box */}
            <div className={`qrd-qr-box ${isExpiring ? 'expiring' : ''} ${isNew ? 'qrd-new' : ''}`}>
              <QRCodeSVG
                value={qrUrl} size={208}
                bgColor="transparent" fgColor="#ffffff"
                level="M"
                style={{ display: 'block' }}
              />
            </div>
          </div>

          {/* Meta row */}
          <div className="qrd-meta">
            <div className="qrd-timer">
              <span className={`qrd-timer-num ${isExpiring ? 'danger' : ''}`}>{secondsLeft}</span>
              <span className="qrd-timer-unit">วินาที</span>
            </div>
            <span className={`qrd-pill ${statusClass}`}>{statusLabel}</span>
          </div>

          {/* Thin progress bar */}
          <div className="qrd-bar">
            <div
              className={`qrd-bar-fill ${statusClass !== 'ok' ? statusClass : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      ) : (
        <div className="qrd-placeholder">
          <div className="qrd-placeholder-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h2v2h-2z M18 14h3 M14 18h2 M18 18h3v3 M14 22h2"/>
            </svg>
          </div>
          <p className="qrd-placeholder-text">กด "เริ่มเช็คชื่อ" เพื่อสร้าง QR Code</p>
        </div>
      )}
    </div>
  );
}
