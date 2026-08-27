'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PostItem, MonthlyStats } from '../types';

export default function HomePage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

  const fetchPostsAndStats = async () => {
    try {
      setLoading(true);
      const [resPosts, resStats] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/stats'),
      ]);
      const dataPosts = await resPosts.json();
      const dataStats = await resStats.json();

      if (dataPosts.success) setPosts(dataPosts.data);
      if (dataStats.success) setStats(dataStats.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsAndStats();
  }, []);

  const filteredPosts = posts.filter((p) => {
    const matchType = filterType === 'all' || p.type === filterType;
    const matchCat = selectedCategory === 'ทั้งหมด' || p.category.includes(selectedCategory);
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchType && matchCat && matchSearch;
  });

  return (
    <main className="main-wrapper">
      {/* Hero Section */}
      <section className="hero-card">
        <div className="hero-text">
          <h2>SUT Lost & Found Platform</h2>
          <p>
            ระบบดิจิทัลศูนย์กลางตามหาของหายและแจ้งพบสิ่งของสำหรับนักศึกษาและบุคลากรมหาวิทยาลัยเทคโนโลยีสุรนารี
            (มทส.) ด้วยระบบตัดตัวกลางและระบบจับคู่อัตโนมัติ (Tag-Based Auto-Matching)
          </p>
        </div>
      </section>

      {/* Stat Grid */}
      {stats && (
        <section className="stat-grid">
          <div className="stat-card">
            <div className="stat-info">
              <h3>ของหายที่กำลังตามหา</h3>
              <p style={{ color: '#DC2626' }}>{stats.totalLost} ชิ้น</p>
            </div>
            <div className="stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              🔍
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>สิ่งของที่พบ / รอส่งมอบ</h3>
              <p style={{ color: '#D97706' }}>{stats.totalFound} ชิ้น</p>
            </div>
            <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
              🎁
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>ส่งคืนสำเร็จแล้ว</h3>
              <p style={{ color: '#16A34A' }}>{stats.totalReturned} ชิ้น</p>
            </div>
            <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              ✓
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>อัตราความสำเร็จ (Return Rate)</h3>
              <p style={{ color: '#E65100' }}>{stats.returnRatePercentage}%</p>
            </div>
            <div className="stat-icon" style={{ background: '#FFF3E0', color: '#E65100' }}>
              📊
            </div>
          </div>
        </section>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#FFFFFF',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn-sm ${filterType === 'all' ? 'nav-btn-primary' : 'nav-btn-outline'}`}
            onClick={() => setFilterType('all')}
            style={{ padding: '0.5rem 1rem' }}
          >
            ทั้งหมด ({posts.length})
          </button>
          <button
            className={`btn-sm ${filterType === 'lost' ? 'nav-btn-primary' : 'nav-btn-outline'}`}
            onClick={() => setFilterType('lost')}
            style={{ padding: '0.5rem 1rem' }}
          >
            เฉพาะของหาย (Lost)
          </button>
          <button
            className={`btn-sm ${filterType === 'found' ? 'nav-btn-primary' : 'nav-btn-outline'}`}
            onClick={() => setFilterType('found')}
            style={{ padding: '0.5rem 1rem' }}
          >
            เฉพาะพบของ (Found)
          </button>
        </div>

        <input
          type="text"
          placeholder="ค้นหาชื่อสิ่งของ, สถานที่ใน มทส..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '0.875rem',
            minWidth: '280px',
            outline: 'none',
          }}
        />
      </div>

      {/* Items Grid */}
      <section>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
          รายการประกาศ ({filteredPosts.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
            กำลังโหลดข้อมูลจาก Next.js API...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#FFFFFF', borderRadius: '12px' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6B7280' }}>ไม่พบรายการที่ค้นหา</p>
          </div>
        ) : (
          <div className="items-grid">
            {filteredPosts.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-image-wrapper">
                  <img src={item.imageUrl} alt={item.title} />
                  <span
                    className={`item-type-badge ${
                      item.type === 'lost' ? 'item-type-lost' : 'item-type-found'
                    }`}
                  >
                    {item.type === 'lost' ? 'ของหาย (Lost)' : 'พบของ (Found)'}
                  </span>
                </div>
                <div className="item-body">
                  <div className="item-status-row">
                    <span
                      className={`badge ${
                        item.status === 'lost'
                          ? 'badge-lost'
                          : item.status === 'found'
                          ? 'badge-found'
                          : 'badge-returned'
                      }`}
                    >
                      {item.status === 'lost'
                        ? 'ยังไม่เจอ'
                        : item.status === 'found'
                        ? 'เจอแล้ว/รอส่งมอบ'
                        : 'ส่งคืนสำเร็จ ✓'}
                    </span>
                    <span className="item-date">{item.dateTime}</span>
                  </div>

                  <h4 className="item-title">{item.title}</h4>

                  <div className="item-tags">
                    <span className="tag tag-location">📍 {item.location}</span>
                    <span className="tag">🏷️ {item.category}</span>
                    <span className="tag">🎨 สี: {item.color}</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#4B5563', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                    {item.description}
                  </p>

                  <div className="item-contact">
                    <strong>ผู้โพสต์:</strong> {item.userName} ({item.userContact})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
