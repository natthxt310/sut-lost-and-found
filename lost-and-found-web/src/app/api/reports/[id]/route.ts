import { NextResponse } from 'next/server';
import { persistentDb } from '../../../../lib/db';

// PUT /api/reports/[id] - แอดมินดำเนินการกับรายงาน (ซ่อน, ลบ, หรือยกเลิก)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'hide' | 'delete' | 'dismiss' | 'unhide'

    if (!['hide', 'delete', 'dismiss', 'unhide'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action. Must be hide, delete, dismiss, or unhide' }, { status: 400 });
    }

    const result = persistentDb.handleReportAction(id, action);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: result.message, data: result.report });
  } catch (error: any) {
    console.error('Failed to process report action error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to process report action' }, { status: 500 });
  }
}
