import { NextRequest, NextResponse } from 'next/server';
import { backendStore } from '../../../../../lib/store';

// PUT /api/posts/[id]/approve
// อนุมัติหรือปฏิเสธโพสต์โดย Admin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const isApproved = body.isApproved !== false; // default true

    const updated = backendStore.approvePost(id, isApproved);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: isApproved ? 'อนุมัติโพสต์เรียบร้อยแล้ว โพสต์จะแสดงบนฟีดสาธารณะทันที' : 'ปฏิเสธโพสต์เรียบร้อยแล้ว',
      data: updated,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to approve post' }, { status: 500 });
  }
}
