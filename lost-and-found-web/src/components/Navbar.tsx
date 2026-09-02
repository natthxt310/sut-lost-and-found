'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  // Theme state: defaults to dark if on admin, or reads from localStorage
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('sut_theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    } else {
      setIsDark(isAdmin);
    }
  }, [isAdmin]);

  // Listen to custom theme change event across components
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (e.detail && typeof e.detail.isDark === 'boolean') {
        setIsDark(e.detail.isDark);
      }
    };
    window.addEventListener('sut_theme_change', handleThemeChange);
    return () => window.removeEventListener('sut_theme_change', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('sut_theme', nextDark ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent('sut_theme_change', { detail: { isDark: nextDark } }));
  };

  return (
    <nav
      className={`navbar ${isDark ? 'navbar-dark' : ''}`}
      style={{
        backgroundColor: isDark ? '#0B132B' : '#FFFFFF',
        borderBottom: isDark ? '1px solid #334155' : '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div className="nav-container">
        <Link href="/" className="brand-logo" style={{ textDecoration: 'none' }}>
          <div className="brand-badge">SUT</div>
          <div className="brand-text">
            <h1 style={{ color: isDark ? '#FFFFFF' : '#111827', margin: 0 }}>Lost & Found</h1>
            <span style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
              ระบบของหายชุมชน มทส. (กลุ่ม 7)
            </span>
          </div>
        </Link>
        <div className="nav-links">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            style={{
              padding: '7px 14px',
              borderRadius: '10px',
              border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
              backgroundColor: isDark ? '#1E293B' : '#F8F9FA',
              color: isDark ? '#F59E0B' : '#475569',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            title="สลับโหมดมืด / โหมดสว่าง"
          >
            {isDark ? '☀️ โหมดสว่าง' : '🌙 โหมดมืด'}
          </button>

          <Link
            href="/"
            className="nav-btn nav-btn-outline"
            style={
              isDark
                ? {
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    color: '#F1F5F9',
                  }
                : undefined
            }
          >
            🔍 สำรวจของหาย
          </Link>
          <Link
            href="/admin"
            className="nav-btn nav-btn-primary"
            style={{
              background: 'linear-gradient(135deg, #FF7A00, #E65100)',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)',
            }}
          >
            ⚙️ Admin Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
