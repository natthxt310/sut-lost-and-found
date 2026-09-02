'use client';

import React, { useState, useEffect } from 'react';
import { PostItem, User, MonthlyStats, QuarterlyStats, PostReport } from '../../types';

export default function AdminPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [quarterlyStats, setQuarterlyStats] = useState<QuarterlyStats | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'approval' | 'reports' | 'quarterly' | 'stats' | 'users'>('reports');
  const [postFilter, setPostFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [reportFilter, setReportFilter] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  // Dark / Light Theme State (สลับโหมดมืด / โหมดสว่าง)
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem('sut_theme');
    if (saved) {
      setIsDark(saved === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('sut_theme', nextDark ? 'dark' : 'light');
  };

  const loadQuarterly = async (q: number) => {
    try {
      const res = await fetch(`/api/stats/quarterly?quarter=${q}`);
      const json = await res.json();
      if (json.success) setQuarterlyStats(json.data);
    } catch (err) {
      console.error('Failed to load quarterly stats', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [resPosts, resUsers, resReports, resStats, resQuarterly] = await Promise.all([
        fetch('/api/posts?all=true'),
        fetch('/api/users'),
        fetch('/api/reports?status=all'),
        fetch('/api/stats'),
        fetch(`/api/stats/quarterly?quarter=${selectedQuarter}`),
      ]);
      const dataPosts = await resPosts.json();
      const dataUsers = await resUsers.json();
      const dataReports = await resReports.json();
      const dataStats = await resStats.json();
      const dataQuarterly = await resQuarterly.json();

      if (dataPosts.success) setPosts(dataPosts.data);
      if (dataUsers.success) setUsers(dataUsers.data);
      if (dataReports.success) setReports(dataReports.data);
      if (dataStats.success) setStats(dataStats.data);
      if (dataQuarterly.success) setQuarterlyStats(dataQuarterly.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleQuarterChange = async (q: number) => {
    setSelectedQuarter(q);
    await loadQuarterly(q);
  };

  // อนุมัติหรือปฏิเสธโพสต์ (Approval Action)
  const handleApprovePost = async (id: string, isApproved: boolean) => {
    try {
      const res = await fetch(`/api/posts/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          isApproved
            ? '✅ อนุมัติโพสต์เรียบร้อยแล้ว โพสต์จะแสดงบนฟีดสาธารณะทันที'
            : '❌ ปฏิเสธโพสต์เรียบร้อยแล้ว'
        );
        loadData();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอนุมัติโพสต์');
    }
  };

  // ดำเนินการกับรายงาน (Report Management Action: ซ่อน, ลบ, หรือยกเลิก)
  const handleReportAction = async (reportId: string, action: 'hide' | 'delete' | 'dismiss') => {
    const actionNames: { [key: string]: string } = {
      hide: 'ซ่อนโพสต์นี้ไม่ให้แสดงบนฟีดสาธารณะ',
      delete: 'ลบโพสต์นี้ออกจากระบบอย่างถาวร',
      dismiss: 'ยกเลิกรายงานนี้ (โพสต์ปลอดภัย)',
    };
    if (!confirm(`คุณต้องการ${actionNames[action]} หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'ดำเนินการสำเร็จ');
        loadData();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้ (Admin Moderation)?')) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('🗑️ ลบโพสต์ออกจากระบบเรียบร้อยแล้ว');
        loadData();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('คุณต้องการระงับ/ลบบัญชีผู้ใช้นี้หรือไม่?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('ลบบัญชีผู้ใช้เรียบร้อยแล้ว');
        loadData();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  // ตัวนับโพสต์รออนุมัติ
  const pendingPosts = posts.filter((p) => p.isApproved === false);
  const approvedPosts = posts.filter((p) => p.isApproved === true);

  // คัดกรองโพสต์ในแท็บ Approval
  const displayedPosts = posts.filter((p) => {
    if (postFilter === 'pending') return p.isApproved === false;
    if (postFilter === 'approved') return p.isApproved === true;
    return true;
  });

  // ตัวนับรายงานโพสต์ไม่เหมาะสม
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const resolvedReports = reports.filter((r) => r.status === 'resolved' || r.status === 'dismissed');

  // คัดกรองรายงานในแท็บ Reports
  const displayedReports = reports.filter((r) => {
    if (reportFilter === 'pending') return r.status === 'pending';
    if (reportFilter === 'resolved') return r.status === 'resolved' || r.status === 'dismissed';
    return true;
  });

  // Dynamic Theme Colors
  const theme = {
    bg: isDark ? '#0B132B' : '#F8F9FA',
    navBg: isDark ? 'rgba(11, 19, 43, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    card: isDark ? '#1E293B' : '#FFFFFF',
    cardAlt: isDark ? '#0F172A' : '#F1F5F9',
    tableHeader: isDark ? '#0F172A' : '#F1F5F9',
    border: isDark ? '#334155' : '#E2E8F0',
    borderAlt: isDark ? '#475569' : '#CBD5E1',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    textSub: isDark ? '#CBD5E1' : '#334155',
  };

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        minHeight: '100vh',
        color: theme.text,
        fontFamily: 'inherit',
        transition: 'background-color 0.25s ease, color 0.25s ease',
      }}
    >
      {/* Toast Alert */}
      {actionSuccessMsg ? (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.9rem',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {actionSuccessMsg}
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* UNIFIED STICKY TOP NAVBAR (แถบนำทางหลัก รวมแบรนด์ แท็บ และปุ่มสลับโหมด) */}
      {/* ============================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 200,
          backgroundColor: theme.navBg,
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${theme.border}`,
          padding: '0.75rem 1.5rem',
          transition: 'background-color 0.25s ease, border-color 0.25s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Left: Brand Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #FF7A00, #E65100)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '0.95rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '10px',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 12px rgba(255, 122, 0, 0.35)',
              }}
            >
              SUT
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: theme.text, margin: 0, letterSpacing: '-0.3px' }}>
                  Lost & Found
                </h1>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 122, 0, 0.15)',
                    color: '#FF7A00',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '6px',
                  }}
                >
                  ADMIN
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>
                ศูนย์ควบคุม & ตรวจสอบของหาย มทส. (Admin Portal)
              </span>
            </div>
          </div>

          {/* Center: Navigation Tabs (Pill Buttons) */}
          <nav style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* TAB 1: ตรวจสอบและอนุมัติโพสต์ */}
            <button
              onClick={() => setActiveTab('approval')}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: activeTab === 'approval' ? '1.5px solid #FF7A00' : `1px solid ${theme.border}`,
                backgroundColor: activeTab === 'approval' ? '#FF7A00' : theme.card,
                color: activeTab === 'approval' ? '#FFFFFF' : theme.text,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span>🛡️ อนุมัติโพสต์</span>
              {pendingPosts.length > 0 && (
                <span
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '1px 6px',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                  }}
                >
                  {pendingPosts.length}
                </span>
              )}
            </button>

            {/* TAB 2: หน้าจัดการรายงาน (Report Management) */}
            <button
              onClick={() => setActiveTab('reports')}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: activeTab === 'reports' ? '1.5px solid #EF4444' : `1px solid ${theme.border}`,
                backgroundColor: activeTab === 'reports' ? '#EF4444' : theme.card,
                color: activeTab === 'reports' ? '#FFFFFF' : theme.text,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span>🚨 จัดการรายงาน</span>
              {pendingReports.length > 0 && (
                <span
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#EF4444',
                    borderRadius: '8px',
                    padding: '1px 6px',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                  }}
                >
                  {pendingReports.length}
                </span>
              )}
            </button>

            {/* TAB 3: รายงานประจำไตรมาส */}
            <button
              onClick={() => setActiveTab('quarterly')}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: activeTab === 'quarterly' ? '1.5px solid #FF7A00' : `1px solid ${theme.border}`,
                backgroundColor: activeTab === 'quarterly' ? '#FF7A00' : theme.card,
                color: activeTab === 'quarterly' ? '#FFFFFF' : theme.text,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span>📅 ประจำไตรมาส</span>
            </button>

            {/* TAB 4: สถิติรายเดือน / ภาพรวม */}
            <button
              onClick={() => setActiveTab('stats')}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: activeTab === 'stats' ? '1.5px solid #FF7A00' : `1px solid ${theme.border}`,
                backgroundColor: activeTab === 'stats' ? '#FF7A00' : theme.card,
                color: activeTab === 'stats' ? '#FFFFFF' : theme.text,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span>📊 สถิติภาพรวม</span>
            </button>

            {/* TAB 5: จัดการสมาชิก */}
            <button
              onClick={() => setActiveTab('users')}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: activeTab === 'users' ? '1.5px solid #FF7A00' : `1px solid ${theme.border}`,
                backgroundColor: activeTab === 'users' ? '#FF7A00' : theme.card,
                color: activeTab === 'users' ? '#FFFFFF' : theme.text,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span>👥 สมาชิก ({users.length})</span>
            </button>
          </nav>

          {/* Right: Quick Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Status Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: theme.card,
                border: `1px solid ${theme.border}`,
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: theme.textMuted,
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              <span>Admin Online</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              style={{
                backgroundColor: theme.card,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                padding: '7px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
              }}
              title="รีเฟรชข้อมูลล่าสุด"
            >
              🔄
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{
                backgroundColor: theme.card,
                color: isDark ? '#F59E0B' : '#D97706',
                border: `1px solid ${theme.border}`,
                padding: '7px 12px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              title="สลับโหมดมืด / โหมดสว่าง"
            >
              {isDark ? '☀️ สว่าง' : '🌙 มืด'}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================== */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.75rem 1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: theme.textMuted }}>
            ⏳ กำลังโหลดข้อมูล...
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* TAB 1: APPROVAL QUEUE (ตรวจสอบและอนุมัติโพสต์ก่อนขึ้นแสดง) */}
            {/* ============================================================== */}
            {activeTab === 'approval' && (
              <div>
                {/* Status Filter Bar */}
                <div
                  style={{
                    backgroundColor: theme.card,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '16px',
                    padding: '1.2rem 1.5rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: theme.text }}>
                      🛡️ คิวตรวจสอบและอนุมัติโพสต์ (Post Moderation Queue)
                    </h3>
                    <p style={{ margin: '4px 0 0 0', color: theme.textMuted, fontSize: '0.85rem' }}>
                      โพสต์ที่สร้างใหม่จะต้องได้รับการอนุมัติจาก Admin ก่อน จึงจะแสดงให้ผู้ใช้อื่นเห็นในหน้าฟีด
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setPostFilter('pending')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: postFilter === 'pending' ? '2px solid #F59E0B' : `1px solid ${theme.borderAlt}`,
                        backgroundColor: postFilter === 'pending' ? 'rgba(245, 158, 11, 0.15)' : theme.cardAlt,
                        color: postFilter === 'pending' ? '#F59E0B' : theme.textMuted,
                      }}
                    >
                      ⏳ รออนุมัติ ({pendingPosts.length})
                    </button>
                    <button
                      onClick={() => setPostFilter('approved')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: postFilter === 'approved' ? '2px solid #10B981' : `1px solid ${theme.borderAlt}`,
                        backgroundColor: postFilter === 'approved' ? 'rgba(16, 185, 129, 0.15)' : theme.cardAlt,
                        color: postFilter === 'approved' ? '#10B981' : theme.textMuted,
                      }}
                    >
                      ✅ อนุมัติแล้ว ({approvedPosts.length})
                    </button>
                    <button
                      onClick={() => setPostFilter('all')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: postFilter === 'all' ? '2px solid #FF7A00' : `1px solid ${theme.borderAlt}`,
                        backgroundColor: postFilter === 'all' ? 'rgba(255, 122, 0, 0.15)' : theme.cardAlt,
                        color: postFilter === 'all' ? '#FF7A00' : theme.textMuted,
                      }}
                    >
                      📋 ทั้งหมด ({posts.length})
                    </button>
                  </div>
                </div>

                {/* Posts Cards Grid */}
                {displayedPosts.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: theme.card,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '16px',
                      padding: '4rem 2rem',
                      textAlign: 'center',
                      color: theme.textMuted,
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                    <h4 style={{ fontSize: '1.2rem', color: theme.text, margin: 0 }}>ไม่มีโพสต์ที่อยู่ในหมวดหมู่นี้</h4>
                    <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                      {postFilter === 'pending'
                        ? 'ยอดเยี่ยม! ไม่มีโพสต์ที่ค้างรอการอนุมัติในขณะนี้'
                        : 'ไม่พบรายการโพสต์ตามตัวกรองที่เลือก'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {displayedPosts.map((post) => {
                      const isPending = post.isApproved === false;
                      return (
                        <div
                          key={post.id}
                          style={{
                            backgroundColor: theme.card,
                            borderTop: `1px solid ${theme.border}`,
                            borderRight: `1px solid ${theme.border}`,
                            borderBottom: `1px solid ${theme.border}`,
                            borderLeft: isPending ? '4px solid #F59E0B' : '4px solid #10B981',
                            borderRadius: '16px',
                            padding: '1.25rem 1.5rem',
                            display: 'flex',
                            gap: '1.25rem',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            boxShadow: isPending ? '0 4px 20px rgba(245, 158, 11, 0.15)' : 'none',
                          }}
                        >
                          {/* Image Thumbnail */}
                          <div
                            style={{
                              width: '100px',
                              height: '100px',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              backgroundColor: theme.cardAlt,
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={post.imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80'}
                              alt={post.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>

                          {/* Post Info */}
                          <div style={{ flex: '1 1 300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                              {/* Type Badge */}
                              <span
                                style={{
                                  backgroundColor: post.type === 'lost' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: post.type === 'lost' ? '#EF4444' : '#10B981',
                                  border: post.type === 'lost' ? '1px solid #EF4444' : '1px solid #10B981',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                }}
                              >
                                {post.type === 'lost' ? '🔍 ของหาย' : '🎁 พบของ'}
                              </span>

                              {/* Approval Status Badge */}
                              <span
                                style={{
                                  backgroundColor: isPending ? '#FEF3C7' : '#DCFCE7',
                                  color: isPending ? '#B45309' : '#16A34A',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                }}
                              >
                                {isPending ? '⏳ รอแอดมินอนุมัติ' : '✅ อนุมัติแล้ว (แสดงบนฟีด)'}
                              </span>

                              {/* AI Content Safety Shield */}
                              <span
                                style={{
                                  backgroundColor: theme.cardAlt,
                                  color: '#38BDF8',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                }}
                              >
                                🛡️ AI Safe
                              </span>
                            </div>

                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: theme.text, margin: '0 0 4px 0' }}>
                              {post.title}
                            </h4>

                            <div style={{ fontSize: '0.85rem', color: theme.textMuted, display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span>📦 {post.category}</span>
                              <span>🎨 สี: {post.color}</span>
                              <span>📍 {post.location}</span>
                              <span>🕒 {post.dateTime}</span>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: theme.textSub, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <span>👤 ผู้โพสต์: <strong>{post.userName}</strong></span>
                              <span>📞 {post.userContact}</span>
                              <span>✉️ {post.userEmail}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px', flexShrink: 0 }}>
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleApprovePost(post.id, true)}
                                  style={{
                                    backgroundColor: '#10B981',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                  }}
                                >
                                  ✅ อนุมัติโพสต์ (Approve)
                                </button>
                                <button
                                  onClick={() => handleApprovePost(post.id, false)}
                                  style={{
                                    backgroundColor: theme.cardAlt,
                                    color: '#EF4444',
                                    border: '1px solid #EF4444',
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  ❌ ปฏิเสธ (Reject)
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleApprovePost(post.id, false)}
                                  style={{
                                    backgroundColor: theme.cardAlt,
                                    color: '#F59E0B',
                                    border: '1px solid #F59E0B',
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  ⏸️ ระงับการแสดงผล
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleDeletePost(post.id)}
                              style={{
                                backgroundColor: theme.card,
                                color: '#EF4444',
                                border: `1px solid ${theme.border}`,
                                padding: '8px 12px',
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                              }}
                            >
                              🗑️ ลบโพสต์ถาวร
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: REPORT MANAGEMENT (หน้าจัดการรายงานโพสต์ไม่เหมาะสม) */}
            {/* ============================================================== */}
            {activeTab === 'reports' && (
              <div>
                {/* Header Card */}
                <div
                  style={{
                    backgroundColor: theme.card,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          color: '#EF4444',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        🚨 REPORT MANAGEMENT
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: theme.text }}>
                        หน้าจัดการรายงานโพสต์ไม่เหมาะสม
                      </h3>
                    </div>
                    <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.85rem' }}>
                      ตรวจสอบรายละเอียดโพสต์ที่ถูกรายงานจากผู้ใช้ และดำเนินการซ่อนหรือลบโพสต์ที่มีปัญหา
                    </p>
                  </div>

                  {/* Filter Tabs */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setReportFilter('pending')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: reportFilter === 'pending' ? '2px solid #EF4444' : `1px solid ${theme.borderAlt}`,
                        backgroundColor: reportFilter === 'pending' ? 'rgba(239, 68, 68, 0.15)' : theme.cardAlt,
                        color: reportFilter === 'pending' ? '#EF4444' : theme.textMuted,
                      }}
                    >
                      ⏳ รอตรวจสอบ ({pendingReports.length})
                    </button>
                    <button
                      onClick={() => setReportFilter('resolved')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: reportFilter === 'resolved' ? '2px solid #10B981' : `1px solid ${theme.borderAlt}`,
                        backgroundColor: reportFilter === 'resolved' ? 'rgba(16, 185, 129, 0.15)' : theme.cardAlt,
                        color: reportFilter === 'resolved' ? '#10B981' : theme.textMuted,
                      }}
                    >
                      ✅ ดำเนินการแล้ว ({resolvedReports.length})
                    </button>
                    <button
                      onClick={() => setReportFilter('all')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: reportFilter === 'all' ? '2px solid #FF7A00' : `1px solid ${theme.borderAlt}`,
                        backgroundColor: reportFilter === 'all' ? 'rgba(255, 122, 0, 0.15)' : theme.cardAlt,
                        color: reportFilter === 'all' ? '#FF7A00' : theme.textMuted,
                      }}
                    >
                      📋 ทั้งหมด ({reports.length})
                    </button>
                  </div>
                </div>

                {/* Reports List */}
                {displayedReports.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: theme.card,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '16px',
                      padding: '4rem 2rem',
                      textAlign: 'center',
                      color: theme.textMuted,
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛡️</div>
                    <h4 style={{ fontSize: '1.2rem', color: theme.text, margin: 0 }}>ไม่มีรายงานโพสต์ในหมวดหมู่นี้</h4>
                    <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                      {reportFilter === 'pending'
                        ? 'ยอดเยี่ยม! ไม่มีรายงานโพสต์ไม่เหมาะสมที่ค้างรอตรวจสอบในขณะนี้'
                        : 'ไม่พบรายการรายงานตามตัวกรองที่เลือก'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {displayedReports.map((rep) => {
                      const isPending = rep.status === 'pending';
                      const reportedPost = posts.find((p) => p.id === rep.postId);
                      const isPostHidden = reportedPost?.moderationStatus === 'hidden' || reportedPost?.isApproved === false;

                      return (
                        <div
                          key={rep.id}
                          style={{
                            backgroundColor: theme.card,
                            borderTop: `1px solid ${theme.border}`,
                            borderRight: `1px solid ${theme.border}`,
                            borderBottom: `1px solid ${theme.border}`,
                            borderLeft: isPending ? '4px solid #EF4444' : '4px solid #10B981',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.2rem',
                            boxShadow: isPending ? '0 4px 20px rgba(239, 68, 68, 0.1)' : 'none',
                          }}
                        >
                          {/* Report Metadata Row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              {/* Reason Badge */}
                              <span
                                style={{
                                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                  color: '#EF4444',
                                  border: '1px solid #EF4444',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                }}
                              >
                                {rep.reasonText}
                              </span>

                              {/* Status Badge */}
                              <span
                                style={{
                                  backgroundColor: isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: isPending ? '#F59E0B' : '#10B981',
                                  border: isPending ? '1px solid #F59E0B' : '1px solid #10B981',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                }}
                              >
                                {isPending ? '⏳ รอแอดมินดำเนินการ' : `✅ ดำเนินการแล้ว (${rep.actionTaken === 'hidden' ? 'ซ่อนโพสต์' : rep.actionTaken === 'deleted' ? 'ลบโพสต์ถาวร' : 'ยกเลิกรายงาน'})`}
                              </span>

                              {/* Post Status Badge */}
                              {reportedPost ? (
                                <span
                                  style={{
                                    backgroundColor: isPostHidden ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: isPostHidden ? '#EF4444' : '#10B981',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {isPostHidden ? '⏸️ โพสต์ถูกซ่อนอยู่' : '🌐 โพสต์ยังแสดงอยู่'}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    backgroundColor: 'rgba(148, 163, 184, 0.15)',
                                    color: theme.textMuted,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  🗑️ โพสต์ถูกลบออกจากระบบแล้ว
                                </span>
                              )}
                            </div>

                            <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>
                              🕒 รายงานเมื่อ: {new Date(rep.createdAt).toLocaleString('th-TH')}
                            </span>
                          </div>

                          {/* Reporter Details & Message */}
                          <div
                            style={{
                              backgroundColor: theme.cardAlt,
                              borderRadius: '12px',
                              padding: '0.85rem 1.1rem',
                              border: `1px solid ${theme.border}`,
                            }}
                          >
                            <div style={{ fontSize: '0.8rem', color: theme.textMuted, marginBottom: '4px' }}>
                              👤 <strong>ผู้รายงาน:</strong> {rep.reporterName}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: theme.text, fontStyle: 'italic' }}>
                              💬 &quot;{rep.details || 'ไม่มีข้อความเพิ่มเติม'}&quot;
                            </div>
                          </div>

                          {/* Reported Post Details (การตรวจสอบรายละเอียดโพสต์ที่ถูกรายงาน) */}
                          <div
                            style={{
                              border: `1px solid ${theme.border}`,
                              borderRadius: '12px',
                              padding: '1rem',
                              display: 'flex',
                              gap: '1.25rem',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : '#FFFFFF',
                            }}
                          >
                            {/* Thumbnail */}
                            <div
                              style={{
                                width: '90px',
                                height: '90px',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                backgroundColor: theme.cardAlt,
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={rep.postImageUrl || reportedPost?.imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80'}
                                alt={rep.postTitle}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>

                            {/* Post Info */}
                            <div style={{ flex: '1 1 250px' }}>
                              <div style={{ fontSize: '0.75rem', color: theme.textMuted, marginBottom: '4px' }}>
                                📦 หมวดหมู่: <strong>{rep.postCategory || reportedPost?.category || 'ทั่วไป'}</strong> | 👤 ผู้โพสต์: <strong>{rep.postAuthorName || reportedPost?.userName || '-'}</strong>
                              </div>
                              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: theme.text, fontWeight: 800 }}>
                                {rep.postTitle}
                              </h4>
                              {reportedPost?.description && (
                                <p style={{ margin: 0, fontSize: '0.85rem', color: theme.textMuted }}>
                                  {reportedPost.description}
                                </p>
                              )}
                              {reportedPost?.location && (
                                <div style={{ fontSize: '0.8rem', color: theme.textSub, marginTop: '4px' }}>
                                  📍 สถานที่: {reportedPost.location} | 🎨 สี: {reportedPost.color}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons: ซ่อนโพสต์, ลบโพสต์ถาวร, หรือยกเลิกรายงาน */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {/* 1. ดำเนินการซ่อนโพสต์ที่มีปัญหา */}
                              <button
                                onClick={() => handleReportAction(rep.id, 'hide')}
                                disabled={isPostHidden}
                                style={{
                                  backgroundColor: isPostHidden ? theme.cardAlt : '#F59E0B',
                                  color: isPostHidden ? theme.textMuted : '#FFFFFF',
                                  border: isPostHidden ? `1px solid ${theme.border}` : 'none',
                                  padding: '9px 14px',
                                  borderRadius: '10px',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  cursor: isPostHidden ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: isPostHidden ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.3)',
                                }}
                                title="ซ่อนโพสต์ไม่ให้แสดงบนฟีดสาธารณะ"
                              >
                                ⏸️ {isPostHidden ? 'ซ่อนอยู่แล้ว' : 'ซ่อนโพสต์ (Hide)'}
                              </button>

                              {/* 2. ดำเนินการลบโพสต์ที่มีปัญหา */}
                              <button
                                onClick={() => handleReportAction(rep.id, 'delete')}
                                style={{
                                  backgroundColor: '#EF4444',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  padding: '9px 14px',
                                  borderRadius: '10px',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                }}
                                title="ลบโพสต์ที่มีปัญหาออกจากระบบอย่างถาวร"
                              >
                                🗑️ ลบโพสต์ถาวร (Delete)
                              </button>

                              {/* 3. ปุ่มยกเลิกรายงาน / โพสต์ปลอดภัย */}
                              {isPending && (
                                <button
                                  onClick={() => handleReportAction(rep.id, 'dismiss')}
                                  style={{
                                    backgroundColor: theme.cardAlt,
                                    color: theme.textMuted,
                                    border: `1px solid ${theme.border}`,
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                  }}
                                  title="ตรวจสอบแล้วไม่มีปัญหา ยกเลิกการรายงาน"
                                >
                                  🛡️ ปล่อยผ่าน (Dismiss)
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: QUARTERLY ANALYTICS (รายงานประจำไตรมาส) */}
            {/* ============================================================== */}
            {activeTab === 'quarterly' && quarterlyStats && (
              <div>
                {/* Quarter Selector Header */}
                <div
                  style={{
                    backgroundColor: theme.card,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: theme.text, margin: 0 }}>
                      📅 รายงานวิเคราะห์สถิติประจำไตรมาส: {quarterlyStats.quarterName} ปี 2569
                    </h3>
                    <p style={{ color: theme.textMuted, fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                      สรุปยอดของหาย ของที่พบ การส่งคืน และ 5 อันดับหมวดหมู่ที่หายบ่อยที่สุด
                    </p>
                  </div>

                  {/* Quarter Switcher Buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { q: 1, label: 'Q1 (ม.ค. - มี.ค.)' },
                      { q: 2, label: 'Q2 (เม.ย. - มิ.ย.)' },
                      { q: 3, label: 'Q3 (ก.ค. - ก.ย.)' },
                      { q: 4, label: 'Q4 (ต.ค. - ธ.ค.)' },
                    ].map((item) => (
                      <button
                        key={item.q}
                        onClick={() => handleQuarterChange(item.q)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          border: selectedQuarter === item.q ? '2px solid #FF7A00' : `1px solid ${theme.borderAlt}`,
                          backgroundColor: selectedQuarter === item.q ? '#FF7A00' : theme.cardAlt,
                          color: selectedQuarter === item.q ? '#FFFFFF' : theme.text,
                          transition: 'all 0.2s',
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4 Main Requested Metric Cards + Return Rate */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  {/* 1. จำนวนของหายทั้งหมดในไตรมาสนั้น */}
                  <div style={{ backgroundColor: theme.card, borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: '4px solid #EF4444', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>1. ของหายทั้งหมดในไตรมาส</div>
                    <div style={{ color: '#EF4444', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 2px 0' }}>
                      {quarterlyStats.totalLost} <span style={{ fontSize: '1rem', fontWeight: 600, color: theme.textMuted }}>ชิ้น</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>โพสต์ของหายทั้งหมด</div>
                  </div>

                  {/* 2. จำนวนของที่ถูกส่งคืนทั้งหมดในไตรมาสนั้น */}
                  <div style={{ backgroundColor: theme.card, borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: '4px solid #10B981', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>2. ส่งคืนสำเร็จในไตรมาส</div>
                    <div style={{ color: '#10B981', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 2px 0' }}>
                      {quarterlyStats.totalReturned} <span style={{ fontSize: '1rem', fontWeight: 600, color: theme.textMuted }}>ชิ้น</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>ส่งมอบคืนเจ้าของแล้ว</div>
                  </div>

                  {/* 3. จำนวนของที่หาพบแล้วแต่ยังไม่ถูกส่งคืนในไตรมาสนั้น */}
                  <div style={{ backgroundColor: theme.card, borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: '4px solid #F59E0B', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>3. พบแล้วยังไม่ส่งคืน</div>
                    <div style={{ color: '#F59E0B', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 2px 0' }}>
                      {quarterlyStats.foundNotReturned} <span style={{ fontSize: '1rem', fontWeight: 600, color: theme.textMuted }}>ชิ้น</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>รอเจ้าของมารับคืน</div>
                  </div>

                  {/* 4. จำนวนของที่ยังหาไม่เจอทั้งหมดในไตรมาสนั้น */}
                  <div style={{ backgroundColor: theme.card, borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: '4px solid #6366F1', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>4. ยังหาไม่เจอทั้งหมด</div>
                    <div style={{ color: '#6366F1', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 2px 0' }}>
                      {quarterlyStats.unfoundLost} <span style={{ fontSize: '1rem', fontWeight: 600, color: theme.textMuted }}>ชิ้น</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>อยู่ระหว่างตามหา</div>
                  </div>

                  {/* Return Rate Percentage */}
                  <div style={{ backgroundColor: theme.card, borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: '4px solid #FF7A00', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>อัตราส่งคืนสำเร็จ (% Return Rate)</div>
                    <div style={{ color: '#FF7A00', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 2px 0' }}>
                      {quarterlyStats.returnRatePercentage}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>คำนวณตามสูตรสัดส่วนส่งคืน</div>
                  </div>
                </div>

                {/* 5. 5 อันดับแรกของหมวดหมู่ของของที่หายบ่อยที่สุด */}
                <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '18px', padding: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: theme.text }}>
                        🏆 5 อันดับแรกของหมวดหมู่ของของที่หายบ่อยที่สุด ({quarterlyStats.quarterName})
                      </h3>
                      <p style={{ color: theme.textMuted, fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                        วิเคราะห์ความถี่ตามหมวดหมู่สิ่งของที่มีการแจ้งของหายเข้ามามากที่สุด
                      </p>
                    </div>
                    <span style={{ fontSize: '0.85rem', backgroundColor: 'rgba(255, 122, 0, 0.15)', color: '#FF7A00', padding: '4px 10px', borderRadius: '8px', fontWeight: 800 }}>
                      TOP 5 CATEGORIES
                    </span>
                  </div>

                  {quarterlyStats.top5LostCategories.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: theme.textMuted }}>
                      ยังไม่มีข้อมูลของหายในไตรมาสนี้
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: theme.tableHeader, borderBottom: `1px solid ${theme.border}` }}>
                            <th style={{ padding: '12px 14px', width: '100px', textAlign: 'center', color: theme.textMuted, backgroundColor: theme.tableHeader, borderRadius: '8px 0 0 8px' }}>อันดับ</th>
                            <th style={{ padding: '12px 14px', color: theme.textMuted, backgroundColor: theme.tableHeader }}>หมวดหมู่สิ่งของ</th>
                            <th style={{ padding: '12px 14px', width: '160px', textAlign: 'center', color: theme.textMuted, backgroundColor: theme.tableHeader }}>จำนวนที่หาย (ชิ้น)</th>
                            <th style={{ padding: '12px 14px', width: '120px', textAlign: 'center', color: theme.textMuted, backgroundColor: theme.tableHeader }}>สัดส่วน (%)</th>
                            <th style={{ padding: '12px 14px', width: '240px', color: theme.textMuted, backgroundColor: theme.tableHeader, borderRadius: '0 8px 8px 0' }}>แถบเปรียบเทียบ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quarterlyStats.top5LostCategories.map((cat) => {
                            const rankBadges = ['🥇 อันดับ 1', '🥈 อันดับ 2', '🥉 อันดับ 3', 'อันดับ 4', 'อันดับ 5'];
                            return (
                              <tr key={cat.rank} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                <td style={{ padding: '14px', textAlign: 'center' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      fontWeight: 800,
                                      fontSize: '0.8rem',
                                      backgroundColor: cat.rank <= 3 ? 'rgba(245, 158, 11, 0.15)' : theme.cardAlt,
                                      color: cat.rank === 1 ? '#F59E0B' : cat.rank === 2 ? '#94A3B8' : '#D97706',
                                    }}
                                  >
                                    {rankBadges[cat.rank - 1]}
                                  </span>
                                </td>
                                <td style={{ padding: '14px', fontWeight: 700, color: theme.text }}>
                                  {cat.category}
                                </td>
                                <td style={{ padding: '14px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#EF4444' }}>
                                    {cat.count}
                                  </span>{' '}
                                  <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>รายการ</span>
                                </td>
                                <td style={{ padding: '14px', textAlign: 'center', fontWeight: 800, color: '#FF7A00' }}>
                                  {cat.percentage}%
                                </td>
                                <td style={{ padding: '14px' }}>
                                  <div style={{ backgroundColor: theme.cardAlt, borderRadius: '6px', height: '10px', width: '100%', overflow: 'hidden' }}>
                                    <div
                                      style={{
                                      backgroundColor: cat.rank === 1 ? '#EF4444' : cat.rank === 2 ? '#FF7A00' : '#F59E0B',
                                      height: '100%',
                                      width: `${Math.max(cat.percentage, 8)}%`,
                                      borderRadius: '6px',
                                      transition: 'width 0.5s ease-in-out',
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: STATS OVERVIEW (สถิติภาพรวม / รายเดือน) */}
            {/* ============================================================== */}
            {activeTab === 'stats' && stats && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ backgroundColor: theme.card, borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: '4px solid #EF4444', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ color: theme.textMuted, fontSize: '0.85rem', fontWeight: 700 }}>ของหายทั้งหมด</div>
                    <div style={{ color: '#EF4444', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 0 0' }}>{stats.totalLost}</div>
                  </div>
                  <div style={{ backgroundColor: theme.card, borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: '4px solid #F59E0B', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ color: theme.textMuted, fontSize: '0.85rem', fontWeight: 700 }}>พบของทั้งหมด</div>
                    <div style={{ color: '#F59E0B', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 0 0' }}>{stats.totalFound}</div>
                  </div>
                  <div style={{ backgroundColor: theme.card, borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: '4px solid #10B981', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ color: theme.textMuted, fontSize: '0.85rem', fontWeight: 700 }}>ส่งคืนสำเร็จ</div>
                    <div style={{ color: '#10B981', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 0 0' }}>{stats.totalReturned}</div>
                  </div>
                  <div style={{ backgroundColor: theme.card, borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: '4px solid #6366F1', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ color: theme.textMuted, fontSize: '0.85rem', fontWeight: 700 }}>ยังหาไม่เจอทั้งหมด</div>
                    <div style={{ color: '#6366F1', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 0 0' }}>{stats.totalUnfound ?? 20}</div>
                  </div>
                  <div style={{ backgroundColor: theme.card, borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: '4px solid #FF7A00', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ color: theme.textMuted, fontSize: '0.85rem', fontWeight: 700 }}>Success Rate</div>
                    <div style={{ color: '#FF7A00', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 0 0' }}>{stats.returnRatePercentage}%</div>
                  </div>
                </div>

                {/* Monthly Trend Table */}
                <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: theme.text }}>สถิติเปรียบเทียบรายเดือน</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: theme.tableHeader, borderBottom: `1px solid ${theme.border}` }}>
                          <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, borderRadius: '8px 0 0 8px' }}>ประจำเดือน</th>
                          <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader }}>ของหาย (ชิ้น)</th>
                          <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader }}>พบของ (ชิ้น)</th>
                          <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader }}>ส่งคืนสำเร็จ (ชิ้น)</th>
                          <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader }}>ยังหาไม่เจอ (ชิ้น)</th>
                          <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, borderRadius: '0 8px 8px 0' }}>อัตราสำเร็จ (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.monthlyTrend.map((t, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${theme.border}` }}>
                            <td style={{ padding: '12px', fontWeight: 700, color: theme.text }}>{t.month}</td>
                            <td style={{ padding: '12px', color: '#EF4444' }}>{t.lost}</td>
                            <td style={{ padding: '12px', color: '#F59E0B' }}>{t.found}</td>
                            <td style={{ padding: '12px', color: '#10B981' }}>{t.returned}</td>
                            <td style={{ padding: '12px', color: '#6366F1', fontWeight: 700 }}>{t.unfound ?? (t.lost - t.returned > 0 ? t.lost - t.returned : 0)}</td>
                            <td style={{ padding: '12px', fontWeight: 800, color: '#FF7A00' }}>
                              {t.lost + t.found > 0 ? Math.round((t.returned / (t.lost + t.found)) * 100) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 5: USER MANAGEMENT (จัดการสมาชิก) */}
            {/* ============================================================== */}
            {activeTab === 'users' && (
              <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', color: theme.text }}>
                  👥 รายชื่อสมาชิกและนักศึกษา ({users.length})
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: theme.tableHeader, borderBottom: `1px solid ${theme.border}` }}>
                        <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, borderRadius: '8px 0 0 8px' }}>รหัสนักศึกษา</th>
                        <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader }}>ชื่อ-นามสกุล</th>
                        <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader }}>อีเมล</th>
                        <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader }}>เบอร์โทร</th>
                        <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader }}>บทบาท (Role)</th>
                        <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, borderRadius: '0 8px 8px 0' }}>การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#FF7A00' }}>{u.studentId}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: theme.text }}>{u.fullName}</td>
                          <td style={{ padding: '12px', color: theme.textMuted }}>{u.email}</td>
                          <td style={{ padding: '12px', color: theme.textMuted }}>{u.phone || '-'}</td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                backgroundColor: u.role === 'admin' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                                color: u.role === 'admin' ? '#F59E0B' : '#38BDF8',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                              }}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                style={{
                                  backgroundColor: theme.cardAlt,
                                  color: '#EF4444',
                                  border: '1px solid #EF4444',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                ระงับบัญชี
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
