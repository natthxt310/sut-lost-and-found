'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PostItem, User, MonthlyStats } from '../../types';

export default function AdminPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'posts' | 'users'>('stats');

  const loadData = async () => {
    try {
      setLoading(true);
      const [resPosts, resUsers, resStats] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/users'),
        fetch('/api/stats'),
      ]);
      const dataPosts = await resPosts.json();
      const dataUsers = await resUsers.json();
      const dataStats = await resStats.json();

      if (dataPosts.success) setPosts(dataPosts.data);
      if (dataUsers.success) setUsers(dataUsers.data);
      if (dataStats.success) setStats(dataStats.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeletePost = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้ (Admin Moderation)?')) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('ลบโพสต์เรียบร้อยแล้ว');
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
        alert('ลบบัญชีผู้ใช้เรียบร้อยแล้ว');
        loadData();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  return (
    <main className="main-wrapper">
      {/* Header Admin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>⚙️ ระบบจัดการหลังบ้าน (Admin Web Portal)</h2>
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
            ศูนย์ควบคุมสำหรับผู้ดูแลระบบ สหกรณ์ และฝ่ายรักษาความปลอดภัย มทส. (RQ-012, RQ-013, RQ-014)
          </p>
        </div>
        <button
          onClick={loadData}
          className="nav-btn nav-btn-outline"
          style={{ cursor: 'pointer' }}
        >
          🔄 รีเฟรชข้อมูล
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className={`nav-btn ${activeTab === 'stats' ? 'nav-btn-primary' : 'nav-btn-outline'}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 สถิติรายเดือน (Monthly Dashboard - RQ-014)
        </button>
        <button
          className={`nav-btn ${activeTab === 'posts' ? 'nav-btn-primary' : 'nav-btn-outline'}`}
          onClick={() => setActiveTab('posts')}
        >
          📝 จัดการโพสต์และคัดกรองเนื้อหา (Post Moderation - RQ-012/013)
        </button>
        <button
          className={`nav-btn ${activeTab === 'users' ? 'nav-btn-primary' : 'nav-btn-outline'}`}
          onClick={() => setActiveTab('users')}
        >
          👥 จัดการสมาชิกและนักศึกษา (User Management)
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>กำลังโหลดข้อมูล...</div>
      ) : (
        <>
          {/* TAB 1: STATS DASHBOARD (RQ-014) */}
          {activeTab === 'stats' && stats && (
            <div>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>ของหายทั้งหมด</h3>
                    <p style={{ color: '#DC2626' }}>{stats.totalLost}</p>
                  </div>
                  <div className="stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>🔍</div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>พบของทั้งหมด</h3>
                    <p style={{ color: '#D97706' }}>{stats.totalFound}</p>
                  </div>
                  <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>🎁</div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>ส่งคืนสำเร็จ</h3>
                    <p style={{ color: '#16A34A' }}>{stats.totalReturned}</p>
                  </div>
                  <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>✓</div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Success Rate</h3>
                    <p style={{ color: '#E65100' }}>{stats.returnRatePercentage}%</p>
                  </div>
                  <div className="stat-icon" style={{ background: '#FFF3E0', color: '#E65100' }}>📈</div>
                </div>
              </div>

              {/* Monthly Trend Table */}
              <div className="table-container">
                <div className="table-header">
                  <h3>สถิติเปรียบเทียบรายเดือน (Monthly Trend)</h3>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>ประจำเดือน</th>
                      <th>ของหาย (ชิ้น)</th>
                      <th>พบของ (ชิ้น)</th>
                      <th>ส่งคืนสำเร็จ (ชิ้น)</th>
                      <th>อัตราสำเร็จ (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.monthlyTrend.map((t, idx) => (
                      <tr key={idx}>
                        <td><strong>{t.month}</strong></td>
                        <td style={{ color: '#DC2626' }}>{t.lost}</td>
                        <td style={{ color: '#D97706' }}>{t.found}</td>
                        <td style={{ color: '#16A34A' }}>{t.returned}</td>
                        <td>
                          <strong>
                            {t.lost + t.found > 0 ? Math.round((t.returned / (t.lost + t.found)) * 100) : 0}%
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Category Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="table-container">
                  <div className="table-header">
                    <h3>จำแนกตามหมวดหมู่สิ่งของ</h3>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>หมวดหมู่</th>
                        <th>จำนวน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.categoryBreakdown.map((c, i) => (
                        <tr key={i}>
                          <td>{c.category}</td>
                          <td><strong>{c.count} รายการ</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="table-container">
                  <div className="table-header">
                    <h3>จุดที่พบของหายบ่อยใน มทส.</h3>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>สถานที่</th>
                        <th>จำนวน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.locationBreakdown.map((l, i) => (
                        <tr key={i}>
                          <td>📍 {l.location}</td>
                          <td><strong>{l.count} รายการ</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POST MODERATION (RQ-012, RQ-013) & AI CONTENT SAFETY */}
          {activeTab === 'posts' && (
            <div className="table-container">
              <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>รายการโพสต์และการกลั่นกรองเนื้อหา ({posts.length})</h3>
                  <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>
                    🛡️ ระบบ AI Content Moderation คัดกรองคำหยาบ สแปม และรูปภาพอัตโนมัติเพื่อลดภาระงานแอดมิน
                  </p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>ประเภท</th>
                    <th>รูปภาพ</th>
                    <th>ชื่อสิ่งของ</th>
                    <th>สถานที่</th>
                    <th>🛡️ สถานะ AI ตรวจสอบ</th>
                    <th>สถานะสิ่งของ</th>
                    <th>การจัดการ (Admin Actions)</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <span
                          className={`item-type-badge ${
                            post.type === 'lost' ? 'item-type-lost' : 'item-type-found'
                          }`}
                          style={{ position: 'static' }}
                        >
                          {post.type === 'lost' ? 'ของหาย' : 'พบของ'}
                        </span>
                      </td>
                      <td>
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                      </td>
                      <td>
                        <strong>{post.title}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          สี: {post.color} | {post.category}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#E65100' }}>
                          ผู้โพสต์: {post.userName} ({post.userContact})
                        </div>
                      </td>
                      <td>📍 {post.location}</td>
                      <td>
                        {post.moderationStatus === 'flagged' ? (
                          <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block' }}>
                            ⚠️ Flagged: รอแอดมินตรวจ
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#DCFCE7', color: '#16A34A', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block' }}>
                            ✅ AI Auto-Safe ({post.moderationScore ? Math.round(post.moderationScore * 100) : 98}%)
                          </span>
                        )}
                        {post.moderationNotes && (
                          <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '2px', maxWidth: '160px' }}>
                            {post.moderationNotes}
                          </div>
                        )}
                      </td>
                      <td>
                        <select
                          value={post.status}
                          onChange={(e) => handleUpdateStatus(post.id, e.target.value as any)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          <option value="lost">ยังไม่เจอ (Lost)</option>
                          <option value="found">เจอแล้ว (Found)</option>
                          <option value="returned">ส่งคืนแล้ว (Returned)</option>
                        </select>
                      </td>
                      <td>
                        <div className="action-btns" style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                          <button
                            className="btn-sm btn-delete"
                            onClick={() => handleDeletePost(post.id)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            🗑️ ลบโพสต์
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="table-container">
              <div className="table-header">
                <h3>รายชื่อสมาชิกและนักศึกษา ({users.length})</h3>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>รหัสนักศึกษา</th>
                    <th>ชื่อ-นามสกุล</th>
                    <th>อีเมล มทส.</th>
                    <th>เบอร์โทรศัพท์</th>
                    <th>บทบาท (Role)</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.studentId}</strong></td>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td>
                        <span className="badge" style={{ background: u.role === 'admin' ? '#FEF3C7' : '#E0F2FE', color: u.role === 'admin' ? '#B45309' : '#0369A1' }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'admin' && (
                          <button
                            className="btn-sm btn-delete"
                            onClick={() => handleDeleteUser(u.id)}
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
    </main>
  );
}
