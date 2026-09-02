import { NextRequest, NextResponse } from 'next/server';
import { persistentDb } from '../../../lib/db';
import { moderateChatMessage } from '../../../lib/moderation';

// =========================================================================
// 💬 API สำหรับจัดการข้อความแชท (Persistent In-App Chat API)
// =========================================================================
// 💡 อธิบายการทำงานแบบเข้าใจง่าย:
// - GET: ดึงประวัติข้อความแชท (ตาม postId หรือตาม userId) จาก database.json
// - POST: ส่งข้อความแชทใหม่ บันทึกลง database.json จริงถาวร ไม่สูญหาย
// =========================================================================

// GET /api/messages - ดึงประวัติข้อความแชท
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId') || undefined;
    const userA = searchParams.get('userA') || undefined;
    const userB = searchParams.get('userB') || undefined;
    const userId = searchParams.get('userId') || undefined;

    let messages = persistentDb.getMessages(postId, userA, userB);

    // หากระบุ userId ให้กรองเฉพาะข้อความที่เกี่ยวข้องกับผู้ใช้นั้น (เป็นผู้ส่งหรือผู้รับ)
    if (userId) {
      messages = messages.filter((m) => m.senderId === userId || m.receiverId === userId);
    }

    return NextResponse.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/messages - ส่งข้อความแชทใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.postId || !body.senderId || !body.receiverId || !body.text) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (postId, senderId, receiverId, text)' },
        { status: 400 }
      );
    }

    // 🛡️ ตรวจสอบคำไม่เหมาะสม / คำหยาบในข้อความแชท
    const modCheck = moderateChatMessage(body.text);
    if (!modCheck.isSafe) {
      return NextResponse.json(
        { success: false, error: modCheck.reason || 'ข้อความมีคำไม่เหมาะสม' },
        { status: 400 }
      );
    }

    const createdMsg = persistentDb.sendMessage({
      postId: body.postId,
      postTitle: body.postTitle || '',
      senderId: body.senderId,
      senderName: body.senderName || 'ผู้ใช้งาน มทส.',
      receiverId: body.receiverId,
      receiverName: body.receiverName || 'ผู้รับ',
      text: body.text.trim(),
    });

    // 🔔 สร้างการแจ้งเตือนข้อความแชทใหม่ส่งไปยังผู้รับ (Receiver Chat Notification)
    try {
      persistentDb.saveNotifications([
        {
          id: `notif-chat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          targetUserId: body.receiverId,
          targetUserEmail: body.receiverEmail,
          type: 'message',
          sourcePostId: body.postId,
          matchedPostId: body.postId,
          sourcePostTitle: body.postTitle || 'สิ่งของที่นัดรับ',
          matchedPostTitle: body.text.trim(),
          matchScore: 100,
          category: 'แชทข้อความ',
          color: '',
          location: '',
          matchedWithUserName: body.senderName || 'ผู้ใช้ มทส.',
          matchedWithContact: '',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.warn('Failed to save chat notification:', e);
    }

    return NextResponse.json(
      { success: true, message: 'Message sent successfully', data: createdMsg },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}
