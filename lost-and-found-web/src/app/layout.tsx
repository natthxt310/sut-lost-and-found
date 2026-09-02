import './globals.css';
import React from 'react';
import Navbar from '../components/Navbar';

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
        <Navbar />
        {children}
      </body>
    </html>
  );
}
