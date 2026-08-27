import { NextRequest, NextResponse } from 'next/server';
import { backendStore } from '../../../../lib/store';

// POST /api/auth/login - ตรวจสอบการเข้าสู่ระบบด้วยรหัสนักศึกษาและรหัสผ่าน
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, password } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกรหัสนักศึกษา' },
        { status: 400 }
      );
    }

    const sId = studentId.trim().toUpperCase();
    const user = backendStore.getUserByStudentId(sId);

    // ถ้ายังไม่เคยลงทะเบียน
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          notRegistered: true,
          error: `ไม่พบรหัสนักศึกษา ${sId} ในระบบ กรุณาลงทะเบียนก่อนเข้าใช้งานครั้งแรก`,
        },
        { status: 404 }
      );
    }

    // ตรวจสอบรหัสผ่าน (ถ้ามีกำหนดไว้)
    if (user.password && password && user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: user,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}
