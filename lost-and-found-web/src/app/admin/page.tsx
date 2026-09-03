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
  const [postFilter, setPostFilter] = useState<'pending' | 'approved' | 'rejected' | 'hidden' | 'all'>('pending');
  const [reportFilter, setReportFilter] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  // Tab 1: Approval Queue (Posts) Filters, Search & Sort
  const [postSearch, setPostSearch] = useState<string>('');
  const [postSort, setPostSort] = useState<'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'category' | 'location'>('newest');
  const [postTypeFilter, setPostTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [postCategoryFilter, setPostCategoryFilter] = useState<string>('all');

  // Tab 2: Report Management Filters, Search & Sort
  const [reportSearch, setReportSearch] = useState<string>('');
  const [reportSort, setReportSort] = useState<'newest' | 'oldest' | 'reason' | 'title_asc'>('newest');
  const [reportReasonFilter, setReportReasonFilter] = useState<string>('all');

  // Tab 4: Monthly Trend Table Sort
  const [monthlySortField, setMonthlySortField] = useState<'month' | 'lost' | 'found' | 'returned' | 'unfound' | 'rate'>('month');
  const [monthlySortAsc, setMonthlySortAsc] = useState<boolean>(true);

  // Tab 5: User Management Filters, Search & Sort
  const [userSearch, setUserSearch] = useState<string>('');
  const [userSort, setUserSort] = useState<'studentId_asc' | 'studentId_desc' | 'name_asc' | 'name_desc' | 'role'>('studentId_asc');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'student' | 'staff'>('all');

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

  // ดำเนินการกับรายงาน (Report Management Action: ซ่อน, ลบ, ยกเลิก, หรือปลดการซ่อน)
  const handleReportAction = async (reportId: string, action: 'hide' | 'delete' | 'dismiss' | 'unhide') => {
    const actionNames: { [key: string]: string } = {
      hide: 'ซ่อนโพสต์นี้ไม่ให้แสดงบนฟีดสาธารณะ',
      delete: 'ลบโพสต์นี้ออกจากระบบอย่างถาวร',
      dismiss: 'ยกเลิกรายงานนี้ (โพสต์ปลอดภัย)',
      unhide: 'ปลดการซ่อนโพสต์นี้และนำกลับสู่ฟีดสาธารณะ',
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

  // ปลดการซ่อนโพสต์ (Admin Unhide Post)
  const handleUnhidePost = async (id: string) => {
    if (!confirm('คุณต้องการปลดการซ่อนโพสต์นี้และนำกลับสู่ฟีดสาธารณะหรือไม่?')) return;
    try {
      const res = await fetch(`/api/posts/${id}/unhide`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        showToast('🔓 ปลดการซ่อนโพสต์เรียบร้อยแล้ว โพสต์จะแสดงบนฟีดสาธารณะตามปกติ');
        loadData();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการปลดการซ่อนโพสต์');
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

  // ดึงหมวดหมู่ทั้งหมดที่มีในโพสต์สำหรับตัวเลือก Dropdown
  const postCategories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean))).sort();

  // ตัวนับโพสต์ตามสถานะ
  const pendingPosts = posts.filter(
    (p) => p.moderationStatus === 'pending' || (p.isApproved === false && p.moderationStatus !== 'rejected' && p.moderationStatus !== 'hidden')
  );
  const approvedPosts = posts.filter((p) => p.isApproved === true || p.moderationStatus === 'approved');
  const rejectedPosts = posts.filter((p) => p.moderationStatus === 'rejected');
  const hiddenPosts = posts.filter((p) => p.moderationStatus === 'hidden');

  // โพสต์ที่กรองตามสถานะหลัก (รออนุมัติ / อนุมัติแล้ว / ปฏิเสธแล้ว / ถูกระงับ-ซ่อน / ทั้งหมด)
  const postsInCurrentStatus = posts.filter((p) => {
    if (postFilter === 'pending') {
      return p.moderationStatus === 'pending' || (p.isApproved === false && p.moderationStatus !== 'rejected' && p.moderationStatus !== 'hidden');
    }
    if (postFilter === 'approved') return p.isApproved === true || p.moderationStatus === 'approved';
    if (postFilter === 'rejected') return p.moderationStatus === 'rejected';
    if (postFilter === 'hidden') return p.moderationStatus === 'hidden';
    return true;
  });

  // คัดกรองและจัดเรียงโพสต์ในแท็บ Approval
  const displayedPosts = postsInCurrentStatus
    .filter((p) => {
      // Type filter (all, lost, found)
      if (postTypeFilter !== 'all' && p.type !== postTypeFilter) return false;

      // Category filter
      if (postCategoryFilter !== 'all' && p.category !== postCategoryFilter) return false;

      // Search query
      if (postSearch.trim()) {
        const q = postSearch.trim().toLowerCase();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        const matchCat = (p.category || '').toLowerCase().includes(q);
        const matchLoc = (p.location || '').toLowerCase().includes(q);
        const matchColor = (p.color || '').toLowerCase().includes(q);
        const matchUser = (p.userName || '').toLowerCase().includes(q);
        const matchContact = (p.userContact || '').toLowerCase().includes(q);
        const matchEmail = (p.userEmail || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat && !matchLoc && !matchColor && !matchUser && !matchContact && !matchEmail) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (postSort === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (postSort === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (postSort === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '', 'th');
      }
      if (postSort === 'title_desc') {
        return (b.title || '').localeCompare(a.title || '', 'th');
      }
      if (postSort === 'category') {
        return (a.category || '').localeCompare(b.category || '', 'th');
      }
      if (postSort === 'location') {
        return (a.location || '').localeCompare(b.location || '', 'th');
      }
      return 0;
    });

  // ตัวนับรายงานโพสต์ไม่เหมาะสม
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const resolvedReports = reports.filter((r) => r.status === 'resolved' || r.status === 'dismissed');

  // รายงานที่กรองตามสถานะหลัก (รอตรวจสอบ / ดำเนินการแล้ว / ทั้งหมด)
  const reportsInCurrentStatus = reports.filter((r) => {
    if (reportFilter === 'pending') return r.status === 'pending';
    if (reportFilter === 'resolved') return r.status === 'resolved' || r.status === 'dismissed';
    return true;
  });

  // คัดกรองและจัดเรียงรายงานในแท็บ Reports
  const displayedReports = reportsInCurrentStatus
    .filter((r) => {
      // Reason filter
      if (reportReasonFilter !== 'all' && r.reason !== reportReasonFilter) return false;

      // Search query
      if (reportSearch.trim()) {
        const q = reportSearch.trim().toLowerCase();
        const matchTitle = (r.postTitle || '').toLowerCase().includes(q);
        const matchReporter = (r.reporterName || '').toLowerCase().includes(q);
        const matchReason = (r.reasonText || '').toLowerCase().includes(q);
        const matchDetails = (r.details || '').toLowerCase().includes(q);
        const matchAuthor = (r.postAuthorName || '').toLowerCase().includes(q);
        const matchCat = (r.postCategory || '').toLowerCase().includes(q);
        if (!matchTitle && !matchReporter && !matchReason && !matchDetails && !matchAuthor && !matchCat) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (reportSort === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (reportSort === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (reportSort === 'reason') {
        return (a.reasonText || '').localeCompare(b.reasonText || '', 'th');
      }
      if (reportSort === 'title_asc') {
        return (a.postTitle || '').localeCompare(b.postTitle || '', 'th');
      }
      return 0;
    });

  // คัดกรองและจัดเรียงสมาชิกในแท็บ Users
  const displayedUsers = users
    .filter((u) => {
      // Role filter
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;

      // Search query
      if (userSearch.trim()) {
        const q = userSearch.trim().toLowerCase();
        const matchName = (u.fullName || '').toLowerCase().includes(q);
        const matchStudentId = (u.studentId || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchPhone = (u.phone || '').toLowerCase().includes(q);
        const matchRole = (u.role || '').toLowerCase().includes(q);
        if (!matchName && !matchStudentId && !matchEmail && !matchPhone && !matchRole) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (userSort === 'studentId_asc') {
        return (a.studentId || '').localeCompare(b.studentId || '', undefined, { numeric: true });
      }
      if (userSort === 'studentId_desc') {
        return (b.studentId || '').localeCompare(a.studentId || '', undefined, { numeric: true });
      }
      if (userSort === 'name_asc') {
        return (a.fullName || '').localeCompare(b.fullName || '', 'th');
      }
      if (userSort === 'name_desc') {
        return (b.fullName || '').localeCompare(a.fullName || '', 'th');
      }
      if (userSort === 'role') {
        const score = (r: string) => (r === 'admin' ? 3 : r === 'staff' ? 2 : 1);
        return score(b.role) - score(a.role);
      }
      return 0;
    });

  // ฟังก์ชันจัดเรียงตารางสถิติเปรียบเทียบรายเดือน
  const handleMonthlySort = (field: 'month' | 'lost' | 'found' | 'returned' | 'unfound' | 'rate') => {
    if (monthlySortField === field) {
      setMonthlySortAsc(!monthlySortAsc);
    } else {
      setMonthlySortField(field);
      setMonthlySortAsc(false); // default descending for numeric fields
    }
  };

  const sortedMonthlyTrend = stats?.monthlyTrend
    ? [...stats.monthlyTrend].sort((a, b) => {
        let diff = 0;
        if (monthlySortField === 'month') {
          diff = a.month.localeCompare(b.month, 'th');
        } else if (monthlySortField === 'lost') {
          diff = a.lost - b.lost;
        } else if (monthlySortField === 'found') {
          diff = a.found - b.found;
        } else if (monthlySortField === 'returned') {
          diff = a.returned - b.returned;
        } else if (monthlySortField === 'unfound') {
          const unfoundA = a.unfound ?? (a.lost - a.returned > 0 ? a.lost - a.returned : 0);
          const unfoundB = b.unfound ?? (b.lost - b.returned > 0 ? b.lost - b.returned : 0);
          diff = unfoundA - unfoundB;
        } else if (monthlySortField === 'rate') {
          const rateA = a.lost + a.found > 0 ? a.returned / (a.lost + a.found) : 0;
          const rateB = b.lost + b.found > 0 ? b.returned / (b.lost + b.found) : 0;
          diff = rateA - rateB;
        }
        return monthlySortAsc ? diff : -diff;
      })
    : [];

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
                      onClick={() => setPostFilter('rejected')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: postFilter === 'rejected' ? '2px solid #EF4444' : `1px solid ${theme.borderAlt}`,
                        backgroundColor: postFilter === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : theme.cardAlt,
                        color: postFilter === 'rejected' ? '#EF4444' : theme.textMuted,
                      }}
                    >
                      ❌ ปฏิเสธแล้ว ({rejectedPosts.length})
                    </button>
                    <button
                      onClick={() => setPostFilter('hidden')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: postFilter === 'hidden' ? '2px solid #F59E0B' : `1px solid ${theme.borderAlt}`,
                        backgroundColor: postFilter === 'hidden' ? 'rgba(245, 158, 11, 0.15)' : theme.cardAlt,
                        color: postFilter === 'hidden' ? '#F59E0B' : theme.textMuted,
                      }}
                    >
                      ⏸️ ถูกระงับ/ซ่อน ({hiddenPosts.length})
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

                {/* Tab 1: Search, Filter & Sort Control Bar */}
                <div
                  style={{
                    backgroundColor: theme.card,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '16px',
                    padding: '1.1rem 1.4rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search Input */}
                    <div style={{ flex: '1 1 300px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '12px', fontSize: '0.95rem', color: theme.textMuted }}>
                        🔍
                      </span>
                      <input
                        type="text"
                        value={postSearch}
                        onChange={(e) => setPostSearch(e.target.value)}
                        placeholder="ค้นหาชื่อโพสต์, รายละเอียด, หมวดหมู่, สถานที่, สี, หรือผู้โพสต์..."
                        style={{
                          width: '100%',
                          padding: '10px 36px 10px 38px',
                          borderRadius: '12px',
                          border: `1px solid ${theme.border}`,
                          backgroundColor: theme.cardAlt,
                          color: theme.text,
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      />
                      {postSearch && (
                        <button
                          onClick={() => setPostSearch('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            color: theme.textMuted,
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                          }}
                          title="ล้างคำค้นหา"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Post Type Selector */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        backgroundColor: theme.cardAlt,
                        padding: '4px',
                        borderRadius: '10px',
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <button
                        onClick={() => setPostTypeFilter('all')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: postTypeFilter === 'all' ? '#FF7A00' : 'transparent',
                          color: postTypeFilter === 'all' ? '#FFFFFF' : theme.textMuted,
                        }}
                      >
                        ทุกประเภท
                      </button>
                      <button
                        onClick={() => setPostTypeFilter('lost')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: postTypeFilter === 'lost' ? '#EF4444' : 'transparent',
                          color: postTypeFilter === 'lost' ? '#FFFFFF' : theme.textMuted,
                        }}
                      >
                        🔍 ของหาย
                      </button>
                      <button
                        onClick={() => setPostTypeFilter('found')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: postTypeFilter === 'found' ? '#10B981' : 'transparent',
                          color: postTypeFilter === 'found' ? '#FFFFFF' : theme.textMuted,
                        }}
                      >
                        🎁 พบของ
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Category Filter Dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: 700 }}>📦 หมวดหมู่:</span>
                        <select
                          value={postCategoryFilter}
                          onChange={(e) => setPostCategoryFilter(e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: `1px solid ${theme.border}`,
                            backgroundColor: theme.cardAlt,
                            color: theme.text,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="all">ทุกหมวดหมู่ ({postsInCurrentStatus.length})</option>
                          {postCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sort Dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: 700 }}>🔃 จัดเรียง:</span>
                        <select
                          value={postSort}
                          onChange={(e) => setPostSort(e.target.value as any)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: `1px solid ${theme.border}`,
                            backgroundColor: theme.cardAlt,
                            color: theme.text,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="newest">🕒 วันที่: ล่าสุด → เก่าสุด</option>
                          <option value="oldest">⏳ วันที่: เก่าสุด → ล่าสุด</option>
                          <option value="title_asc">🔤 ชื่อโพสต์: ก - ฮ (A-Z)</option>
                          <option value="title_desc">🔤 ชื่อโพสต์: ฮ - ก (Z-A)</option>
                          <option value="category">📦 ตามหมวดหมู่</option>
                          <option value="location">📍 ตามสถานที่</option>
                        </select>
                      </div>

                      {/* Clear Filters Button */}
                      {(postSearch || postTypeFilter !== 'all' || postCategoryFilter !== 'all' || postSort !== 'newest') && (
                        <button
                          onClick={() => {
                            setPostSearch('');
                            setPostTypeFilter('all');
                            setPostCategoryFilter('all');
                            setPostSort('newest');
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.borderAlt}`,
                            backgroundColor: theme.cardAlt,
                            color: '#EF4444',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          🔄 ล้างตัวกรอง
                        </button>
                      )}
                    </div>

                    {/* Result Counter Badge */}
                    <div style={{ fontSize: '0.8rem', color: theme.textMuted }}>
                      แสดง <strong style={{ color: '#FF7A00' }}>{displayedPosts.length}</strong> จาก {postsInCurrentStatus.length} โพสต์
                    </div>
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
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>
                      {postSearch || postTypeFilter !== 'all' || postCategoryFilter !== 'all' ? '🔍' : '🎉'}
                    </div>
                    <h4 style={{ fontSize: '1.2rem', color: theme.text, margin: 0 }}>
                      {postSearch || postTypeFilter !== 'all' || postCategoryFilter !== 'all'
                        ? 'ไม่พบโพสต์ที่ตรงกับคำค้นหาหรือตัวกรอง'
                        : 'ไม่มีโพสต์ที่อยู่ในหมวดหมู่นี้'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                      {postSearch || postTypeFilter !== 'all' || postCategoryFilter !== 'all'
                        ? 'ลองตรวจสอบคำสะกด หรือล้างคำค้นหาเพื่อแสดงรายการทั้งหมด'
                        : postFilter === 'pending'
                        ? 'ยอดเยี่ยม! ไม่มีโพสต์ที่ค้างรอการอนุมัติในขณะนี้'
                        : 'ไม่พบรายการโพสต์ตามตัวกรองที่เลือก'}
                    </p>
                    {(postSearch || postTypeFilter !== 'all' || postCategoryFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setPostSearch('');
                          setPostTypeFilter('all');
                          setPostCategoryFilter('all');
                          setPostSort('newest');
                        }}
                        style={{
                          marginTop: '12px',
                          padding: '8px 16px',
                          backgroundColor: '#FF7A00',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🔄 ล้างการค้นหาและตัวกรอง
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {displayedPosts.map((post) => {
                      const isApproved = post.isApproved === true || post.moderationStatus === 'approved';
                      const isRejected = post.moderationStatus === 'rejected';
                      const isHidden = post.moderationStatus === 'hidden';
                      const isPending = !isApproved && !isRejected && !isHidden;

                      return (
                        <div
                          key={post.id}
                          style={{
                            backgroundColor: theme.card,
                            borderTop: `1px solid ${theme.border}`,
                            borderRight: `1px solid ${theme.border}`,
                            borderBottom: `1px solid ${theme.border}`,
                            borderLeft: isRejected
                              ? '4px solid #EF4444'
                              : isHidden
                              ? '4px solid #F59E0B'
                              : isApproved
                              ? '4px solid #10B981'
                              : '4px solid #F59E0B',
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
                              {isApproved ? (
                                <span
                                  style={{
                                    backgroundColor: '#DCFCE7',
                                    color: '#16A34A',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                  }}
                                >
                                  ✅ อนุมัติแล้ว (แสดงบนฟีด)
                                </span>
                              ) : isRejected ? (
                                <span
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    color: '#EF4444',
                                    border: '1px solid #EF4444',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                  }}
                                >
                                  ❌ ปฏิเสธแล้ว (ไม่อนุมัติ)
                                </span>
                              ) : isHidden ? (
                                <span
                                  style={{
                                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                    color: '#F59E0B',
                                    border: '1px solid #F59E0B',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                  }}
                                >
                                  ⏸️ ถูกซ่อน (รายงานปัญหา)
                                </span>
                              ) : post.moderationNotes?.includes('แก้ไขแล้ว') ? (
                                <span
                                  style={{
                                    backgroundColor: '#E0F2FE',
                                    color: '#0284C7',
                                    border: '1px solid #0284C7',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                  }}
                                >
                                  ✏️ เจ้าของแก้ไขแล้ว - รอปลดระงับ
                                </span>
                              ) : (
                                <span
                                  style={{
                                    backgroundColor: '#FEF3C7',
                                    color: '#B45309',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                  }}
                                >
                                  ⏳ รอแอดมินอนุมัติ
                                </span>
                              )}

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

                            {post.moderationNotes && (
                              <div style={{ fontSize: '0.8rem', color: isRejected ? '#EF4444' : isHidden ? '#F59E0B' : '#10B981', marginBottom: '6px', fontWeight: 600 }}>
                                {post.moderationNotes}
                              </div>
                            )}

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
                            ) : isHidden ? (
                              <>
                                <button
                                  onClick={() => handleUnhidePost(post.id)}
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
                                  🔓 ปลดการซ่อน / อนุมัติ
                                </button>
                              </>
                            ) : isRejected ? (
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
                                  🔄 เปลี่ยนเป็นอนุมัติ
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
                                  ⏸️ ระงับ / ปฏิเสธ
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

                {/* Tab 2: Search, Reason Filter & Sort Control Bar */}
                <div
                  style={{
                    backgroundColor: theme.card,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '16px',
                    padding: '1.1rem 1.4rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search Input */}
                    <div style={{ flex: '1 1 300px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '12px', fontSize: '0.95rem', color: theme.textMuted }}>
                        🔍
                      </span>
                      <input
                        type="text"
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        placeholder="ค้นหาชื่อโพสต์ที่ถูกรายงาน, ผู้ร้องเรียน, ข้อความร้องเรียน, ผู้โพสต์..."
                        style={{
                          width: '100%',
                          padding: '10px 36px 10px 38px',
                          borderRadius: '12px',
                          border: `1px solid ${theme.border}`,
                          backgroundColor: theme.cardAlt,
                          color: theme.text,
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      />
                      {reportSearch && (
                        <button
                          onClick={() => setReportSearch('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            color: theme.textMuted,
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                          }}
                          title="ล้างคำค้นหา"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Reason Filter Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: 700 }}>⚠️ สาเหตุ:</span>
                      <select
                        value={reportReasonFilter}
                        onChange={(e) => setReportReasonFilter(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: `1px solid ${theme.border}`,
                          backgroundColor: theme.cardAlt,
                          color: theme.text,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="all">ทุกสาเหตุที่รายงาน</option>
                        <option value="spam">📢 สแปม / การพนัน</option>
                        <option value="scam">⚠️ หลอกลวง / มิจฉาชีพ</option>
                        <option value="inappropriate">🚫 เนื้อหาไม่เหมาะสม</option>
                        <option value="fake">❌ ข้อมูลเท็จ</option>
                        <option value="other">❓ อื่นๆ</option>
                      </select>
                    </div>

                    {/* Sort Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: 700 }}>🔃 จัดเรียง:</span>
                      <select
                        value={reportSort}
                        onChange={(e) => setReportSort(e.target.value as any)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: `1px solid ${theme.border}`,
                          backgroundColor: theme.cardAlt,
                          color: theme.text,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="newest">🕒 รายงานล่าสุด → เก่าสุด</option>
                        <option value="oldest">⏳ รายงานเก่าสุด → ล่าสุด</option>
                        <option value="reason">⚠️ ประเภทเหตุผล</option>
                        <option value="title_asc">🔤 ชื่อโพสต์: ก - ฮ (A-Z)</option>
                      </select>
                    </div>

                    {/* Clear Filter Button */}
                    {(reportSearch || reportReasonFilter !== 'all' || reportSort !== 'newest') && (
                      <button
                        onClick={() => {
                          setReportSearch('');
                          setReportReasonFilter('all');
                          setReportSort('newest');
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${theme.borderAlt}`,
                          backgroundColor: theme.cardAlt,
                          color: '#EF4444',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🔄 ล้างตัวกรอง
                      </button>
                    )}

                    {/* Result Counter */}
                    <div style={{ fontSize: '0.8rem', color: theme.textMuted, marginLeft: 'auto' }}>
                      แสดง <strong style={{ color: '#EF4444' }}>{displayedReports.length}</strong> จาก {reportsInCurrentStatus.length} รายงาน
                    </div>
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
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>
                      {reportSearch || reportReasonFilter !== 'all' ? '🔍' : '🛡️'}
                    </div>
                    <h4 style={{ fontSize: '1.2rem', color: theme.text, margin: 0 }}>
                      {reportSearch || reportReasonFilter !== 'all'
                        ? 'ไม่พบรายงานที่ตรงกับคำค้นหาหรือตัวกรอง'
                        : 'ไม่มีรายงานโพสต์ในหมวดหมู่นี้'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                      {reportSearch || reportReasonFilter !== 'all'
                        ? 'ลองตรวจสอบคำสะกด หรือล้างคำค้นหาเพื่อแสดงรายการรายงานทั้งหมด'
                        : reportFilter === 'pending'
                        ? 'ยอดเยี่ยม! ไม่มีรายงานโพสต์ไม่เหมาะสมที่ค้างรอตรวจสอบในขณะนี้'
                        : 'ไม่พบรายการรายงานตามตัวกรองที่เลือก'}
                    </p>
                    {(reportSearch || reportReasonFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setReportSearch('');
                          setReportReasonFilter('all');
                          setReportSort('newest');
                        }}
                        style={{
                          marginTop: '12px',
                          padding: '8px 16px',
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🔄 ล้างการค้นหาและตัวกรอง
                      </button>
                    )}
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

                            {/* Action Buttons: ซ่อนโพสต์, ลบโพสต์ถาวร, ปลดการซ่อน, หรือยกเลิกรายงาน */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {/* 1. ดำเนินการซ่อน หรือ ปลดการซ่อนโพสต์ที่มีปัญหา */}
                              {isPostHidden ? (
                                <button
                                  onClick={() => handleReportAction(rep.id, 'unhide')}
                                  style={{
                                    backgroundColor: '#10B981',
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
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                  }}
                                  title="ปลดการซ่อนโพสต์และนำกลับสู่ฟีดสาธารณะ"
                                >
                                  🔓 ปลดการซ่อน (Unhide)
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReportAction(rep.id, 'hide')}
                                  style={{
                                    backgroundColor: '#F59E0B',
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
                                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                  }}
                                  title="ซ่อนโพสต์ไม่ให้แสดงบนฟีดสาธารณะ"
                                >
                                  ⏸️ ซ่อนโพสต์ (Hide)
                                </button>
                              )}

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: theme.text }}>
                      📊 สถิติเปรียบเทียบรายเดือน (คลิกหัวตารางเพื่อจัดเรียง)
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>
                      เรียงตาม: <strong>{monthlySortField === 'month' ? 'ประจำเดือน' : monthlySortField === 'lost' ? 'ของหาย' : monthlySortField === 'found' ? 'พบของ' : monthlySortField === 'returned' ? 'ส่งคืน' : monthlySortField === 'unfound' ? 'ยังหาไม่เจอ' : 'อัตราสำเร็จ'}</strong> ({monthlySortAsc ? 'น้อยไปมาก 🔼' : 'มากไปน้อย 🔽'})
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: theme.tableHeader, borderBottom: `1px solid ${theme.border}` }}>
                          <th
                            onClick={() => handleMonthlySort('month')}
                            style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, borderRadius: '8px 0 0 8px', cursor: 'pointer', userSelect: 'none' }}
                            title="คลิกเพื่อจัดเรียงตามเดือน"
                          >
                            ประจำเดือน {monthlySortField === 'month' ? (monthlySortAsc ? '🔼' : '🔽') : '↕️'}
                          </th>
                          <th
                            onClick={() => handleMonthlySort('lost')}
                            style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, cursor: 'pointer', userSelect: 'none' }}
                            title="คลิกเพื่อจัดเรียงตามจำนวนของหาย"
                          >
                            ของหาย (ชิ้น) {monthlySortField === 'lost' ? (monthlySortAsc ? '🔼' : '🔽') : '↕️'}
                          </th>
                          <th
                            onClick={() => handleMonthlySort('found')}
                            style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, cursor: 'pointer', userSelect: 'none' }}
                            title="คลิกเพื่อจัดเรียงตามจำนวนที่พบ"
                          >
                            พบของ (ชิ้น) {monthlySortField === 'found' ? (monthlySortAsc ? '🔼' : '🔽') : '↕️'}
                          </th>
                          <th
                            onClick={() => handleMonthlySort('returned')}
                            style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, cursor: 'pointer', userSelect: 'none' }}
                            title="คลิกเพื่อจัดเรียงตามจำนวนที่ส่งคืนสำเร็จ"
                          >
                            ส่งคืนสำเร็จ (ชิ้น) {monthlySortField === 'returned' ? (monthlySortAsc ? '🔼' : '🔽') : '↕️'}
                          </th>
                          <th
                            onClick={() => handleMonthlySort('unfound')}
                            style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, cursor: 'pointer', userSelect: 'none' }}
                            title="คลิกเพื่อจัดเรียงตามจำนวนที่ยังหาไม่เจอ"
                          >
                            ยังหาไม่เจอ (ชิ้น) {monthlySortField === 'unfound' ? (monthlySortAsc ? '🔼' : '🔽') : '↕️'}
                          </th>
                          <th
                            onClick={() => handleMonthlySort('rate')}
                            style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, borderRadius: '0 8px 8px 0', cursor: 'pointer', userSelect: 'none' }}
                            title="คลิกเพื่อจัดเรียงตามอัตราสำเร็จ"
                          >
                            อัตราสำเร็จ (%) {monthlySortField === 'rate' ? (monthlySortAsc ? '🔼' : '🔽') : '↕️'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMonthlyTrend.map((t, idx) => (
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: theme.text, fontWeight: 800 }}>
                      👥 รายชื่อสมาชิกและนักศึกษา
                    </h3>
                    <p style={{ margin: '4px 0 0 0', color: theme.textMuted, fontSize: '0.85rem' }}>
                      จัดการรายชื่อ ค้นหา และระงับบัญชีผู้ใช้งานในระบบ มทส.
                    </p>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: theme.textMuted }}>
                    แสดง <strong style={{ color: '#FF7A00' }}>{displayedUsers.length}</strong> จาก {users.length} คน
                  </div>
                </div>

                {/* Tab 5: Search, Role Filter & Sort Bar */}
                <div
                  style={{
                    backgroundColor: theme.cardAlt,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '14px',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  {/* Search Input */}
                  <div style={{ flex: '1 1 260px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', fontSize: '0.95rem', color: theme.textMuted }}>
                      🔍
                    </span>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="ค้นหาชื่อ-นามสกุล, รหัสนักศึกษา, อีเมล, หรือเบอร์โทร..."
                      style={{
                        width: '100%',
                        padding: '9px 36px 9px 36px',
                        borderRadius: '10px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.card,
                        color: theme.text,
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                    {userSearch && (
                      <button
                        onClick={() => setUserSearch('')}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          color: theme.textMuted,
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                        title="ล้างคำค้นหา"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Role Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: 700 }}>บทบาท:</span>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value as any)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.card,
                        color: theme.text,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="all">ทุกบทบาท ({users.length})</option>
                      <option value="admin">🛡️ Admin</option>
                      <option value="student">🎓 นักศึกษา (Student)</option>
                      <option value="staff">💼 เจ้าหน้าที่ (Staff)</option>
                    </select>
                  </div>

                  {/* Sort Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: 700 }}>🔃 จัดเรียง:</span>
                    <select
                      value={userSort}
                      onChange={(e) => setUserSort(e.target.value as any)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.card,
                        color: theme.text,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="studentId_asc">🔤 รหัสนักศึกษา: น้อย → มาก</option>
                      <option value="studentId_desc">🔤 รหัสนักศึกษา: มาก → น้อย</option>
                      <option value="name_asc">👤 ชื่อ: ก - ฮ (A-Z)</option>
                      <option value="name_desc">👤 ชื่อ: ฮ - ก (Z-A)</option>
                      <option value="role">🛡️ สิทธิ์ Admin ขึ้นก่อน</option>
                    </select>
                  </div>

                  {/* Clear Filter Button */}
                  {(userSearch || userRoleFilter !== 'all' || userSort !== 'studentId_asc') && (
                    <button
                      onClick={() => {
                        setUserSearch('');
                        setUserRoleFilter('all');
                        setUserSort('studentId_asc');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme.borderAlt}`,
                        backgroundColor: theme.card,
                        color: '#EF4444',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🔄 ล้างตัวกรอง
                    </button>
                  )}
                </div>

                {displayedUsers.length === 0 ? (
                  <div
                    style={{
                      padding: '3rem 2rem',
                      textAlign: 'center',
                      color: theme.textMuted,
                      backgroundColor: theme.cardAlt,
                      borderRadius: '12px',
                      border: `1px dashed ${theme.border}`,
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔍</div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: theme.text }}>
                      ไม่พบสมาชิกที่ตรงกับเงื่อนไขการค้นหา
                    </h4>
                    <p style={{ margin: '6px 0 12px 0', fontSize: '0.85rem' }}>
                      ลองค้นหาด้วยคำอื่น หรือกดล้างตัวกรองเพื่อแสดงข้อมูลทั้งหมด
                    </p>
                    <button
                      onClick={() => {
                        setUserSearch('');
                        setUserRoleFilter('all');
                        setUserSort('studentId_asc');
                      }}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: '#FF7A00',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🔄 ล้างตัวกรอง
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: theme.tableHeader, borderBottom: `1px solid ${theme.border}` }}>
                          <th
                            onClick={() => setUserSort(userSort === 'studentId_asc' ? 'studentId_desc' : 'studentId_asc')}
                            style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, borderRadius: '8px 0 0 8px', cursor: 'pointer', userSelect: 'none' }}
                            title="คลิกเพื่อสลับเรียงตามรหัสนักศึกษา"
                          >
                            รหัสนักศึกษา {userSort === 'studentId_asc' ? '🔼' : userSort === 'studentId_desc' ? '🔽' : '↕️'}
                          </th>
                          <th
                            onClick={() => setUserSort(userSort === 'name_asc' ? 'name_desc' : 'name_asc')}
                            style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, cursor: 'pointer', userSelect: 'none' }}
                            title="คลิกเพื่อสลับเรียงตามชื่อ-นามสกุล"
                          >
                            ชื่อ-นามสกุล {userSort === 'name_asc' ? '🔼' : userSort === 'name_desc' ? '🔽' : '↕️'}
                          </th>
                          <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader }}>อีเมล</th>
                          <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader }}>เบอร์โทร</th>
                          <th
                            onClick={() => setUserSort('role')}
                            style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, cursor: 'pointer', userSelect: 'none' }}
                            title="คลิกเพื่อเรียง Admin ขึ้นก่อน"
                          >
                            บทบาท (Role) {userSort === 'role' ? '⭐' : '↕️'}
                          </th>
                          <th style={{ padding: '12px', color: theme.textMuted, backgroundColor: theme.tableHeader, borderRadius: '0 8px 8px 0' }}>การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedUsers.map((u) => (
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
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
