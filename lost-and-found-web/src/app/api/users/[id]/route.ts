import { NextRequest, NextResponse } from 'next/server';
import { backendStore } from '../../../../lib/store';
import { moderateUserName } from '../../../../lib/moderation';

// GET /api/users/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = backendStore.getUserById(id);
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: user });
}

// PUT /api/users/[id] - แก้ไขข้อมูลผู้ใช้/โปรไฟล์ (Source 1 Update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.fullName) {
      const nameCheck = moderateUserName(body.fullName);
      if (!nameCheck.isSafe) {
        return NextResponse.json(
          { success: false, error: nameCheck.reason || 'ชื่อมีคำไม่เหมาะสม' },
          { status: 400 }
        );
      }
    }

    const updated = backendStore.updateUser(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'User updated successfully', data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - ลบผู้ใช้ (Source 1 Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = backendStore.deleteUser(id);
  if (!success) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'User deleted successfully' });
}
