import { NextRequest, NextResponse } from 'next/server';
import { backendStore } from '../../../../../lib/store';

// PUT /api/posts/[id]/unhide
// ปลดการซ่อนโพสต์โดย Admin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = backendStore.unhidePost(id);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'ปลดการซ่อนโพสต์เรียบร้อยแล้ว โพสต์จะแสดงบนฟีดสาธารณะตามปกติ',
      data: updated,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to unhide post' }, { status: 500 });
  }
}
