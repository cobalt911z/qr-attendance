import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'QR Attendance — ระบบเช็คชื่อ Dynamic QR Code',
  description:
    'ระบบเช็คชื่อนักเรียนด้วย QR Code แบบ Dynamic ที่เปลี่ยนทุก 10 วินาที พร้อมระบบยืนยันตำแหน่ง GPS และป้องกันการโกง',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body>{children}</body>
    </html>
  );
}
