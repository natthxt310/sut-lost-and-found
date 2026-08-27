import { NextRequest, NextResponse } from 'next/server';
import { backendStore } from '../../../lib/store';

// GET /api/users - ดึงรายชื่อผู้ใช้ทั้งหมด (Source 1 Retrieve)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (studentId) {
      const user = backendStore.getUserByStudentId(studentId);
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: user });
    }

    const users = backendStore.getUsers();
    return NextResponse.json({ success: true, count: users.length, data: users });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - ลงทะเบียนสมาชิกใหม่ด้วยรหัสนักศึกษา + รหัสผ่าน (Source 1 Create / Register)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.studentId || !body.fullName) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกรหัสนักศึกษาและชื่อ-นามสกุล' },
        { status: 400 }
      );
    }

    const sId = body.studentId.trim().toUpperCase();

    // ตรวจสอบว่ารหัสนักศึกษานี้เคยลงทะเบียนแล้วหรือไม่
    const existing = backendStore.getUserByStudentId(sId);
    if (existing) {
      return NextResponse.json(
        { success: false, error: `รหัสนักศึกษา ${sId} ได้ลงทะเบียนไว้แล้ว สามารถเข้าสู่ระบบได้ทันที` },
        { status: 409 }
      );
    }

    const newUser = backendStore.createUser({
      studentId: sId,
      fullName: body.fullName.trim(),
      password: body.password || '123456',
      email: body.email || `${sId.toLowerCase()}@g.sut.ac.th`,
      phone: body.phone || '08x-xxx-xxxx',
      role: body.role || 'student',
    });

    return NextResponse.json({ success: true, message: 'ลงทะเบียนสำเร็จ', data: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}
