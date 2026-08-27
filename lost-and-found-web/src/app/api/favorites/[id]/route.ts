import { NextRequest, NextResponse } from 'next/server';
import { backendStore } from '../../../../lib/store';

// PUT /api/favorites/[id] - แก้ไขโน้ตส่วนตัวของรายการโปรด (Source 3 Update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = backendStore.updateFavoriteNote(id, body.personalNote || '');
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Favorite not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Favorite note updated', data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update favorite note' }, { status: 500 });
  }
}

// DELETE /api/favorites/[id] - ลบออกจากรายการโปรด (Source 3 Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = backendStore.deleteFavorite(id);
  if (!success) {
    return NextResponse.json({ success: false, error: 'Favorite not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'Removed from favorites' });
}
