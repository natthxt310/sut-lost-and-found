import { NextResponse } from 'next/server';
import { persistentDb } from '../../../lib/db';

// GET /api/reports - รายการรายงานโพสต์ไม่เหมาะสม
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const reports = persistentDb.getReports(status);
    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch reports' }, { status: 500 });
  }
}

// POST /api/reports - ผู้ใช้รายงานโพสต์ไม่เหมาะสม
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, postTitle, postImageUrl, postCategory, postAuthorName, reporterId, reporterName, reason, reasonText, details } = body;

    if (!postId || !reporterId || !reason) {
      return NextResponse.json({ success: false, error: 'Missing required report fields' }, { status: 400 });
    }

    const report = persistentDb.createReport({
      postId,
      postTitle: postTitle || 'โพสต์ไม่มีชื่อ',
      postImageUrl,
      postCategory,
      postAuthorName,
      reporterId,
      reporterName: reporterName || 'ผู้ใช้ มทส.',
      reason,
      reasonText: reasonText || reason,
      details: details || '',
    });

    return NextResponse.json({ success: true, data: report, message: 'ส่งรายงานเรียบร้อยแล้ว แอดมินจะตรวจสอบทันที' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to submit report' }, { status: 500 });
  }
}
