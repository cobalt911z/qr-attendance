# QR Attendance — ระบบเช็คชื่อ Dynamic QR Code

ระบบเช็คชื่อนักเรียนด้วย QR Code แบบ Dynamic ที่เปลี่ยนทุก 10 วินาที พร้อมระบบป้องกันการโกงหลายชั้น

## ✨ Features

- 🔄 **Dynamic QR Code** — เปลี่ยน token ทุก 10 วินาที (หมดอายุใน 15 วินาที)
- 📍 **GPS Verification** — นักเรียนต้องอยู่ภายใน 50 เมตรจากห้องเรียน
- 🔒 **Anti-Cheat** — ป้องกัน student ID ซ้ำและ device fingerprint ซ้ำ
- 📱 **Mobile-first** — หน้านักเรียนออกแบบมาสำหรับมือถือโดยเฉพาะ
- 📺 **Dashboard** — หน้าอาจารย์แสดงรายชื่อ real-time polling ทุก 5 วินาที

## 🚀 การ Deploy บน Vercel

### Step 1: สร้าง Database
1. Push code ขึ้น GitHub
2. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
3. Import Project จาก GitHub
4. ไปที่ **Storage** → **Create Database** → เลือก **Neon Postgres**
5. เชื่อมต่อ database กับ project → Environment variables จะถูก inject อัตโนมัติ

> **หมายเหตุ:** Vercel Postgres ถูก migrate ไป Neon แล้ว project นี้ใช้ `@neondatabase/serverless` ซึ่งรองรับทั้งคู่

### Step 2: ตั้งค่า Environment Variables
ใน Vercel Dashboard → Settings → Environment Variables เพิ่ม:
```
NEXT_PUBLIC_BASE_URL = https://your-project.vercel.app
```
(ตัวอื่น ๆ จะถูกเพิ่มอัตโนมัติจาก Neon database)

### Step 3: Initialize Database
หลัง deploy แล้ว เรียก endpoint นี้ **ครั้งเดียว**:
```
GET https://your-project.vercel.app/api/init-db
```

### Step 4: เริ่มใช้งาน
- **อาจารย์:** เปิด `https://your-project.vercel.app/teacher` บนโปรเจกเตอร์
- **นักเรียน:** สแกน QR Code → เปิดลิงก์บนมือถือ

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- Neon database (สร้างฟรีได้ที่ [neon.tech](https://neon.tech))

### Setup

```bash
# 1. Clone หรือ copy project
cd qr-attendance

# 2. ติดตั้ง dependencies
npm install

# 3. ตั้งค่า environment variables
cp .env.local.example .env.local
# แก้ไข DATABASE_URL ให้ใส่ connection string ของ Neon

# 4. Initialize database (ครั้งแรกเท่านั้น)
# รัน dev server ก่อน แล้วเปิด browser ไปที่:
# http://localhost:3000/api/init-db

# 5. รัน development server
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) → จะ redirect ไป `/teacher` อัตโนมัติ

---

## 📁 Project Structure

```
qr-attendance/
├── app/
│   ├── api/
│   │   ├── init-db/route.js              # DB schema init (run once)
│   │   ├── teacher/
│   │   │   ├── session/route.js          # Create/list sessions
│   │   │   ├── generate-token/route.js   # Rotate QR token
│   │   │   └── attendance/route.js       # Fetch attendance list
│   │   └── student/
│   │       └── verify/route.js           # Anti-cheat check-in
│   ├── teacher/page.jsx                  # Teacher QR Dashboard
│   ├── student/page.jsx                  # Student mobile check-in
│   ├── layout.js
│   └── globals.css
├── components/
│   ├── QRDisplay.jsx                     # QR + countdown bar
│   ├── AttendanceTable.jsx               # Live attendance list
│   └── StatusMessage.jsx                 # Success/error UI
└── lib/
    ├── db.js                             # Neon DB client
    ├── haversine.js                      # GPS distance formula
    └── schema.sql                        # Database schema
```

---

## 🛡️ Anti-Cheat Logic (verify API)

```
Student POSTs: { token, student_id, lat, lng, fingerprint }
         │
         ▼
1. Token exists in ClassSessions?     ──No──▶ "QR ไม่ถูกต้อง"
         │
         ▼
2. token_expires_at > NOW()?          ──No──▶ "QR หมดอายุ"
         │
         ▼
3. Haversine distance ≤ 50m?          ──No──▶ "อยู่ห่าง X เมตร"
         │
         ▼
4. student_id already in session?     ──Yes─▶ "เช็คชื่อแล้ว"
         │
         ▼
5. fingerprint already in session?    ──Yes─▶ "อุปกรณ์นี้ใช้แล้ว"
         │
         ▼
      INSERT AttendanceRecord ✅
```

---

## 📊 Database Schema

```sql
ClassSessions (id, course_name, current_token, token_expires_at, room_lat, room_lng, is_active)
AttendanceRecords (id, session_id, student_id, student_lat, student_lng, device_fingerprint, check_in_time)
```

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + Custom CSS |
| Database | Neon Postgres (`@neondatabase/serverless`) |
| QR Code | `qrcode.react` |
| Token | `uuid` (v4) |
| GPS | Browser `navigator.geolocation` API |
| Hosting | Vercel (Serverless Functions) |
