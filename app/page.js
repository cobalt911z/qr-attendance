import { redirect } from 'next/navigation';

/**
 * Landing page — redirects to teacher dashboard by default.
 * Students arrive via /student?token=... from QR Code.
 */
export default function HomePage() {
  redirect('/teacher');
}
