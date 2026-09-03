import { NextResponse } from 'next/server';
import { backendStore } from '../../../../lib/store';

// GET / POST /api/notifications/check-expiring
// ตรวจสอบและสร้างการแจ้งเตือนต่ออายุโพสต์เก่าที่ค้างเกิน 14 วัน
export async function GET() {
  try {
    const reminders = backendStore.checkAndGenerateExpiringPostReminders(14);
    return NextResponse.json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to check expiring posts' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
