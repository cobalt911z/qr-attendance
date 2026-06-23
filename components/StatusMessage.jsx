'use client';

/**
 * StatusMessage — displays success or error feedback for student check-in.
 * @param {'success'|'error'|'loading'|null} type
 * @param {string} message
 */
export default function StatusMessage({ type, message }) {
  if (!type || !message) return null;

  const config = {
    success: {
      icon: '✅',
      className: 'status-success',
      title: 'เช็คชื่อสำเร็จ!',
    },
    error: {
      icon: '❌',
      className: 'status-error',
      title: 'เช็คชื่อไม่สำเร็จ',
    },
    loading: {
      icon: '⏳',
      className: 'status-loading',
      title: 'กำลังดำเนินการ…',
    },
  };

  const { icon, className, title } = config[type] || config.error;

  return (
    <div className={`status-message ${className}`}>
      <div className="status-icon">{icon}</div>
      <div className="status-content">
        <p className="status-title">{title}</p>
        <p className="status-body">{message}</p>
      </div>
    </div>
  );
}
