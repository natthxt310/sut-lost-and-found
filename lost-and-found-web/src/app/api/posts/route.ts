import { NextRequest, NextResponse } from 'next/server';
import { backendStore } from '../../../lib/store';
import { findMatchesForPost } from '../../../lib/matching';
import { moderateContent } from '../../../lib/moderation';

// GET /api/posts - ดึงรายการโพสต์ทั้งหมด พร้อมรองรับการค้นหาและกรอง (Source 2 Retrieve)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'lost' | 'found' | null;
    const category = searchParams.get('category') || undefined;
    const location = searchParams.get('location') || undefined;
    const search = searchParams.get('search') || undefined;

    const posts = backendStore.getPosts({
      type: type || undefined,
      category,
      location,
      search,
    });

    return NextResponse.json({ success: true, count: posts.length, data: posts });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST /api/posts - สร้างโพสต์ใหม่พร้อม AI Content Safety Moderation & Auto-Matching (Source 2 Create)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.category || !body.location) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (title, category, location)' },
        { status: 400 }
      );
    }

    // 1. ตรวจสอบความเหมาะสมของเนื้อหาและรูปภาพด้วย AI Moderation Engine
    const modResult = moderateContent(body.title, body.description || '', body.imageUrl);

    // หากพบคำหยาบหรือเนื้อหาต้องห้าม ปฏิเสธการโพสต์ทันที
    if (modResult.status === 'rejected') {
      return NextResponse.json(
        {
          success: false,
          error: modResult.reason,
          moderation: modResult,
        },
        { status: 400 }
      );
    }

    const isAutoApproved = modResult.status === 'approved';

    const createdPost = backendStore.createPost({
      type: body.type || 'lost',
      title: body.title.trim(),
      category: body.category,
      color: body.color || 'ไม่ระบุ',
      location: body.location,
      dateTime: body.dateTime || new Date().toLocaleString('th-TH'),
      description: body.description || '',
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
      status: body.type === 'lost' ? 'lost' : 'found',
      userId: body.userId || 'usr-anon',
      userName: body.userName || 'นักศึกษา มทส.',
      userContact: body.userContact || '089-xxx-xxxx',
      userEmail: body.userEmail || 'student@g.sut.ac.th',
      securityQuestion: body.securityQuestion,
      isApproved: isAutoApproved,
      moderationStatus: modResult.status,
      moderationScore: modResult.score,
      moderationNotes: modResult.reason,
    });

    // 2. Auto-Matching check
    const allPosts = backendStore.getPosts();
    const matches = findMatchesForPost(createdPost, allPosts);

    return NextResponse.json(
      {
        success: true,
        message: isAutoApproved
          ? 'โพสต์สำเร็จและผ่านการตรวจสอบความปลอดภัยอัตโนมัติ (AI Safe Content)'
          : 'โพสต์ถูกส่งเข้าคิวรอผู้ดูแลระบบตรวจสอบความเหมาะสมเพิ่มเติม',
        data: createdPost,
        moderation: modResult,
        matchesCount: matches.length,
        matches,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create post' }, { status: 500 });
  }
}
