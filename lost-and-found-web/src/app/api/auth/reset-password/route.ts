import { NextRequest, NextResponse } from 'next/server';
import { backendStore } from '../../../../lib/store';

// POST /api/auth/reset-password - รีเซ็ตรหัสผ่านใหม่ด้วยรหัสนักศึกษาและอีเมลยืนยันตัวตน
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, email, newPassword } = body;

    if (!studentId?.trim()) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกรหัสนักศึกษา' },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกอีเมลที่ลงทะเบียนไว้' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' },
        { status: 400 }
      );
    }

    const result = backendStore.resetPassword(
      studentId.trim().toUpperCase(),
      email.trim(),
      newPassword
    );

    if (!result.success) {
      const status = result.message.includes('ไม่พบ') ? 404 : 400;
      return NextResponse.json(
        { success: false, error: result.message },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        id: result.user?.id,
        studentId: result.user?.studentId,
        fullName: result.user?.fullName,
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' },
      { status: 500 }
    );
  }
}
