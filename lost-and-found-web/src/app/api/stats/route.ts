import { NextResponse } from 'next/server';
import { backendStore } from '../../../lib/store';

// GET /api/stats - สถิติรายเดือนสำหรับ Admin Dashboard (RQ-014)
export async function GET() {
  try {
    const stats = backendStore.getStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
