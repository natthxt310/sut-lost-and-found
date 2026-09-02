'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PostItem, User, MonthlyStats, QuarterlyStats } from '../../types';

export default function AdminPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [quarterlyStats, setQuarterlyStats] = useState<QuarterlyStats | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'approval' | 'quarterly' | 'stats' | 'posts' | 'users'>('approval');
  const [postFilter, setPostFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

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
      const [resPosts, resUsers, resStats, resQuarterly] = await Promise.all([
        fetch('/api/posts?all=true'),
        fetch('/api/users'),
        fetch('/api/stats'),
        fetch(`/api/stats/quarterly?quarter=${selectedQuarter}`),
      ]);
      const dataPosts = await resPosts.json();
      const dataUsers = await resUsers.json();
      const dataStats = await resStats.json();
      const dataQuarterly = await resQuarterly.json();

      if (dataPosts.success) setPosts(dataPosts.data);
      if (dataUsers.success) setUsers(dataUsers.data);
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

  const handleUpdateStatus = async (id: string, status: 'lost' | 'found' | 'returned') => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('🔄 อัปเดตสถานะสิ่งของเรียบร้อย');
        loadData();
      }
    } catch (err) {
      alert('ไม่สามารถอัปเดตสถานะได้');
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

  return (
    <div style={{ backgroundColor: '#0B132B', minHeight: '100vh', color: '#F1F5F9', padding: '2rem 1.5rem', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Toast Alert */}
        {actionSuccessMsg ? (
          <div
            style={{
              position: 'fixed',
              top: '24px',
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

        {/* Top Header Card (SUT Dark & Orange Theme) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            border: '1px solid #334155',
            borderRadius: '20px',
            padding: '1.75rem 2rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #FF7A00, #E65100)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  letterSpacing: '0.5px',
                }}
              >
                🛡️ SUT ADMIN CONSOLE
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                ศูนย์ตรวจสอบ & อนุมัติเนื้อหา มทส.
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
              ระบบจัดการและอนุมัติโพสต์ (Admin Portal)
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: '6px 0 0 0' }}>
              ตรวจสอบความถูกต้องและอนุมัติโพสต์ก่อนแสดงผลสู่สาธารณะ พร้อมรายงานสถิติประจำไตรมาส
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={loadData}
              style={{
                backgroundColor: '#334155',
                color: '#FFFFFF',
                border: '1px solid #475569',
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              🔄 รีเฟรชข้อมูล
            </button>
            <Link
              href="/"
              style={{
                backgroundColor: 'rgba(255, 122, 0, 0.15)',
                color: '#FF7A00',
                border: '1px solid rgba(255, 122, 0, 0.4)',
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.85rem',
                textDecoration: 'none',
              }}
            >
              🏠 ไปหน้าแรกผู้ใช้
            </Link>
          </div>
        </div>

        {/* Navigation Tabs (Style matching User UI) */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          {/* TAB 1: ตรวจสอบและอนุมัติโพสต์ */}
          <button
            onClick={() => setActiveTab('approval')}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: activeTab === 'approval' ? '2px solid #FF7A00' : '1px solid #334155',
              backgroundColor: activeTab === 'approval' ? '#FF7A00' : '#1E293B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <span>🛡️ ตรวจสอบและอนุมัติโพสต์</span>
            {pendingPosts.length > 0 && (
              <span
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                }}
              >
                {pendingPosts.length} รอตรวจ
              </span>
            )}
          </button>

          {/* TAB 2: รายงานประจำไตรมาส */}
          <button
            onClick={() => setActiveTab('quarterly')}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: activeTab === 'quarterly' ? '2px solid #FF7A00' : '1px solid #334155',
              backgroundColor: activeTab === 'quarterly' ? '#FF7A00' : '#1E293B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <span>📅 รายงานประจำไตรมาส (Quarterly)</span>
          </button>

          {/* TAB 3: สถิติรายเดือน / ภาพรวม */}
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: activeTab === 'stats' ? '2px solid #FF7A00' : '1px solid #334155',
              backgroundColor: activeTab === 'stats' ? '#FF7A00' : '#1E293B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <span>📊 สถิติภาพรวม/รายเดือน</span>
          </button>

          {/* TAB 4: จัดการสมาชิก */}
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: activeTab === 'users' ? '2px solid #FF7A00' : '1px solid #334155',
              backgroundColor: activeTab === 'users' ? '#FF7A00' : '#1E293B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <span>👥 จัดการสมาชิกและนักศึกษา ({users.length})</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94A3B8' }}>
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
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
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
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                      🛡️ คิวตรวจสอบและอนุมัติโพสต์ (Post Moderation Queue)
                    </h3>
                    <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '0.85rem' }}>
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
                        border: postFilter === 'pending' ? '2px solid #F59E0B' : '1px solid #475569',
                        backgroundColor: postFilter === 'pending' ? 'rgba(245, 158, 11, 0.2)' : '#0F172A',
                        color: postFilter === 'pending' ? '#F59E0B' : '#94A3B8',
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
                        border: postFilter === 'approved' ? '2px solid #10B981' : '1px solid #475569',
                        backgroundColor: postFilter === 'approved' ? 'rgba(16, 185, 129, 0.2)' : '#0F172A',
                        color: postFilter === 'approved' ? '#10B981' : '#94A3B8',
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
                        border: postFilter === 'all' ? '2px solid #FF7A00' : '1px solid #475569',
                        backgroundColor: postFilter === 'all' ? 'rgba(255, 122, 0, 0.2)' : '#0F172A',
                        color: postFilter === 'all' ? '#FF7A00' : '#94A3B8',
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
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '16px',
                      padding: '4rem 2rem',
                      textAlign: 'center',
                      color: '#94A3B8',
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                    <h4 style={{ fontSize: '1.2rem', color: '#FFFFFF', margin: 0 }}>ไม่มีโพสต์ที่อยู่ในหมวดหมู่นี้</h4>
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
                            backgroundColor: '#1E293B',
                            border: isPending ? '1.5px solid #F59E0B' : '1px solid #334155',
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
                              backgroundColor: '#0F172A',
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
                                  backgroundColor: post.type === 'lost' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
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
                                  backgroundColor: '#0F172A',
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

                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px 0' }}>
                              {post.title}
                            </h4>

                            <div style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span>📦 {post.category}</span>
                              <span>🎨 สี: {post.color}</span>
                              <span>📍 {post.location}</span>
                              <span>🕒 {post.dateTime}</span>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: '#CBD5E1', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                                    backgroundColor: '#334155',
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
                                    backgroundColor: '#0F172A',
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
                                backgroundColor: '#1E293B',
                                color: '#EF4444',
                                border: '1px solid #475569',
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
            {/* TAB 2: QUARTERLY ANALYTICS (รายงานประจำไตรมาส - สไตล์ User UI) */}
            {/* ============================================================== */}
            {activeTab === 'quarterly' && quarterlyStats && (
              <div>
                {/* Quarter Selector Header */}
                <div
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
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
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      📅 รายงานวิเคราะห์สถิติประจำไตรมาส: {quarterlyStats.quarterName} ปี 2569
                    </h3>
                    <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
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
                          border: selectedQuarter === item.q ? '2px solid #FF7A00' : '1px solid #475569',
                          backgroundColor: selectedQuarter === item.q ? '#FF7A00' : '#0F172A',
                          color: '#FFFFFF',
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
                  <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderLeft: '4px solid #EF4444', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700 }}>1. ของหายทั้งหมดในไตรมาส</div>
                    <div style={{ color: '#EF4444', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 2px 0' }}>
                      {quarterlyStats.totalLost} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94A3B8' }}>ชิ้น</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>โพสต์ของหายทั้งหมด</div>
                  </div>

                  {/* 2. จำนวนของที่ถูกส่งคืนทั้งหมดในไตรมาสนั้น */}
                  <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderLeft: '4px solid #10B981', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700 }}>2. ส่งคืนสำเร็จในไตรมาส</div>
                    <div style={{ color: '#10B981', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 2px 0' }}>
                      {quarterlyStats.totalReturned} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94A3B8' }}>ชิ้น</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>ส่งมอบคืนเจ้าของแล้ว</div>
                  </div>

                  {/* 3. จำนวนของที่หาพบแล้วแต่ยังไม่ถูกส่งคืนในไตรมาสนั้น */}
                  <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderLeft: '4px solid #F59E0B', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700 }}>3. พบแล้วยังไม่ส่งคืน</div>
                    <div style={{ color: '#F59E0B', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 2px 0' }}>
                      {quarterlyStats.foundNotReturned} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94A3B8' }}>ชิ้น</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>รอเจ้าของมารับคืน</div>
                  </div>

                  {/* 4. จำนวนของที่ยังหาไม่เจอทั้งหมดในไตรมาสนั้น */}
                  <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderLeft: '4px solid #6366F1', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700 }}>4. ยังหาไม่เจอทั้งหมด</div>
                    <div style={{ color: '#6366F1', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 2px 0' }}>
                      {quarterlyStats.unfoundLost} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94A3B8' }}>ชิ้น</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>อยู่ระหว่างตามหา</div>
                  </div>

                  {/* Return Rate Percentage */}
                  <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderLeft: '4px solid #FF7A00', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700 }}>อัตราส่งคืนสำเร็จ (% Return Rate)</div>
                    <div style={{ color: '#FF7A00', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 2px 0' }}>
                      {quarterlyStats.returnRatePercentage}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>คำนวณตามสูตรสัดส่วนส่งคืน</div>
                  </div>
                </div>

                {/* 5. 5 อันดับแรกของหมวดหมู่ของของที่หายบ่อยที่สุด */}
                <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '18px', padding: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#FFFFFF' }}>
                        🏆 5 อันดับแรกของหมวดหมู่ของของที่หายบ่อยที่สุด ({quarterlyStats.quarterName})
                      </h3>
                      <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                        วิเคราะห์ความถี่ตามหมวดหมู่สิ่งของที่มีการแจ้งของหายเข้ามามากที่สุด
                      </p>
                    </div>
                    <span style={{ fontSize: '0.85rem', backgroundColor: 'rgba(255, 122, 0, 0.15)', color: '#FF7A00', padding: '4px 10px', borderRadius: '8px', fontWeight: 800 }}>
                      TOP 5 CATEGORIES
                    </span>
                  </div>

                  {quarterlyStats.top5LostCategories.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>
                      ยังไม่มีข้อมูลของหายในไตรมาสนี้
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8', fontSize: '0.85rem' }}>
                          <th style={{ padding: '10px 14px', width: '90px', textAlign: 'center' }}>อันดับ</th>
                          <th style={{ padding: '10px 14px' }}>หมวดหมู่สิ่งของ</th>
                          <th style={{ padding: '10px 14px', width: '160px', textAlign: 'center' }}>จำนวนที่หาย (ชิ้น)</th>
                          <th style={{ padding: '10px 14px', width: '120px', textAlign: 'center' }}>สัดส่วน (%)</th>
                          <th style={{ padding: '10px 14px', width: '240px' }}>แถบเปรียบเทียบ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quarterlyStats.top5LostCategories.map((cat) => {
                          const rankBadges = ['🥇 อันดับ 1', '🥈 อันดับ 2', '🥉 อันดับ 3', 'อันดับ 4', 'อันดับ 5'];
                          return (
                            <tr key={cat.rank} style={{ borderBottom: '1px solid #334155' }}>
                              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    backgroundColor: cat.rank <= 3 ? 'rgba(245, 158, 11, 0.2)' : '#0F172A',
                                    color: cat.rank === 1 ? '#F59E0B' : cat.rank === 2 ? '#E2E8F0' : '#D97706',
                                  }}
                                >
                                  {rankBadges[cat.rank - 1]}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', fontWeight: 700, color: '#FFFFFF' }}>
                                {cat.category}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#EF4444' }}>
                                  {cat.count}
                                </span>{' '}
                                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>รายการ</span>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: '#FF7A00' }}>
                                {cat.percentage}%
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ backgroundColor: '#0F172A', borderRadius: '6px', height: '10px', width: '100%', overflow: 'hidden' }}>
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
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: STATS OVERVIEW (สถิติภาพรวม / รายเดือน) */}
            {/* ============================================================== */}
            {activeTab === 'stats' && stats && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 700 }}>ของหายทั้งหมด</div>
                    <div style={{ color: '#EF4444', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 0 0' }}>{stats.totalLost}</div>
                  </div>
                  <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 700 }}>พบของทั้งหมด</div>
                    <div style={{ color: '#F59E0B', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 0 0' }}>{stats.totalFound}</div>
                  </div>
                  <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 700 }}>ส่งคืนสำเร็จ</div>
                    <div style={{ color: '#10B981', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 0 0' }}>{stats.totalReturned}</div>
                  </div>
                  <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '1.25rem' }}>
                    <div style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 700 }}>Success Rate</div>
                    <div style={{ color: '#FF7A00', fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 0 0' }}>{stats.returnRatePercentage}%</div>
                  </div>
                </div>

                {/* Monthly Trend Table */}
                <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#FFFFFF' }}>สถิติเปรียบเทียบรายเดือน</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8', fontSize: '0.85rem' }}>
                        <th style={{ padding: '8px 12px' }}>ประจำเดือน</th>
                        <th style={{ padding: '8px 12px' }}>ของหาย (ชิ้น)</th>
                        <th style={{ padding: '8px 12px' }}>พบของ (ชิ้น)</th>
                        <th style={{ padding: '8px 12px' }}>ส่งคืนสำเร็จ (ชิ้น)</th>
                        <th style={{ padding: '8px 12px' }}>อัตราสำเร็จ (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.monthlyTrend.map((t, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#FFFFFF' }}>{t.month}</td>
                          <td style={{ padding: '10px 12px', color: '#EF4444' }}>{t.lost}</td>
                          <td style={{ padding: '10px 12px', color: '#F59E0B' }}>{t.found}</td>
                          <td style={{ padding: '10px 12px', color: '#10B981' }}>{t.returned}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#FF7A00' }}>
                            {t.lost + t.found > 0 ? Math.round((t.returned / (t.lost + t.found)) * 100) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: USER MANAGEMENT (จัดการสมาชิก) */}
            {/* ============================================================== */}
            {activeTab === 'users' && (
              <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', color: '#FFFFFF' }}>
                  👥 รายชื่อสมาชิกและนักศึกษา ({users.length})
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8', fontSize: '0.85rem' }}>
                      <th style={{ padding: '10px 12px' }}>รหัสนักศึกษา</th>
                      <th style={{ padding: '10px 12px' }}>ชื่อ-นามสกุล</th>
                      <th style={{ padding: '10px 12px' }}>อีเมล</th>
                      <th style={{ padding: '10px 12px' }}>เบอร์โทร</th>
                      <th style={{ padding: '10px 12px' }}>บทบาท (Role)</th>
                      <th style={{ padding: '10px 12px' }}>การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#FF7A00' }}>{u.studentId}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#FFFFFF' }}>{u.fullName}</td>
                        <td style={{ padding: '12px', color: '#94A3B8' }}>{u.email}</td>
                        <td style={{ padding: '12px', color: '#94A3B8' }}>{u.phone || '-'}</td>
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
                                backgroundColor: '#0F172A',
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
          </>
        )}
      </div>
    </div>
  );
}
