import './globals.css';
import Link from 'next/link';
import React from 'react';

export const metadata = {
  title: 'SUT Lost and Found - ระบบตามหาของหาย มหาวิทยาลัยเทคโนโลยีสุรนารี',
  description: 'แพลตฟอร์มกลางตามหาของหายและแจ้งพบสิ่งของชุมชน มทส. แบบไร้ตัวกลาง พร้อมระบบ Auto-Matching อัจฉริยะ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <nav className="navbar">
          <div className="nav-container">
            <Link href="/" className="brand-logo">
              <div className="brand-badge">SUT</div>
              <div className="brand-text">
                <h1>Lost & Found</h1>
                <span>ระบบของหายชุมชน มทส. (กลุ่ม 7)</span>
              </div>
            </Link>
            <div className="nav-links">
              <Link href="/" className="nav-btn nav-btn-outline">
                🔍 สำรวจของหาย
              </Link>
              <Link href="/admin" className="nav-btn nav-btn-primary">
                ⚙️ Admin Dashboard
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
