import { NextRequest, NextResponse } from 'next/server';
import { persistentDb } from '../../../lib/db';

// =========================================================================
// 🔔 API สำหรับจัดการการแจ้งเตือน (Notifications API)
// =========================================================================

// GET /api/notifications - ดึงรายการแจ้งเตือนตาม userId หรือ email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const email = searchParams.get('email') || undefined;

    const notifs = persistentDb.getNotifications(userId, email);
    return NextResponse.json({ success: true, count: notifs.length, data: notifs });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PUT /api/notifications - อัปเดตสถานะอ่านแล้ว
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.id) {
      persistentDb.markNotificationAsRead(body.id);
    } else if (body.markAll) {
      persistentDb.markAllNotificationsAsRead(body.userId);
    }
    return NextResponse.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE /api/notifications - ล้างการแจ้งเตือน
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    persistentDb.clearNotifications(userId);
    return NextResponse.json({ success: true, message: 'Notifications cleared' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to clear notifications' }, { status: 500 });
  }
}
