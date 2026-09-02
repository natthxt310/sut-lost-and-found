import { NextResponse } from 'next/server';
import { backendStore } from '../../../../lib/store';

// GET /api/stats/quarterly?quarter=3&year=2569
// รายงานสถิติประจำไตรมาสสำหรับ Admin Dashboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quarterParam = searchParams.get('quarter');
    const yearParam = searchParams.get('year');

    const quarter = quarterParam ? parseInt(quarterParam, 10) : 3;
    const year = yearParam ? parseInt(yearParam, 10) : 2569;

    const stats = backendStore.getQuarterlyStats(quarter, year);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch quarterly statistics' }, { status: 500 });
  }
}
