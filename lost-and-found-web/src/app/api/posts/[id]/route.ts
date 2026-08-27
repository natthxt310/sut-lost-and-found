import { NextRequest, NextResponse } from 'next/server';
import { backendStore } from '../../../../lib/store';

// GET /api/posts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = backendStore.getPostById(id);
  if (!post) {
    return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: post });
}

// PUT /api/posts/[id] - อัปเดตสถานะหรือรายละเอียดโพสต์ (Source 2 Update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = backendStore.updatePost(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Post updated successfully', data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE /api/posts/[id] - ลบโพสต์ (Source 2 Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = backendStore.deletePost(id);
  if (!success) {
    return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'Post deleted successfully' });
}
