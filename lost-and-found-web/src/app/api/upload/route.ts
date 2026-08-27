import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// =========================================================================
// 📷 ระบบอัปโหลดและบันทึกรูปภาพจริง (Image Upload API)
// =========================================================================
// 💡 อธิบายการทำงานแบบเข้าใจง่าย:
// เมื่อผู้ใช้ถ่ายรูปจากกล้องมือถือ หรือเลือกภาพจากอัลบั้ม
// ระบบจะส่งไฟล์ภาพมาที่ API นี้ เพื่อบันทึกเป็นไฟล์ภาพ `.jpg` จริงๆ ลงในโฟลเดอร์ `public/uploads` บนเซิร์ฟเวอร์
// และส่ง URL กลับไปให้แอปมือถือนำไปแสดงผล
// =========================================================================

export async function POST(request: NextRequest) {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // สร้างโฟลเดอร์ public/uploads บนคอมพิวเตอร์จริงถ้ายังไม่มี
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const contentType = request.headers.get('content-type') || '';

    // กรณีที่ 1: รับแบบ Base64 JSON
    if (contentType.includes('application/json')) {
      const body = await request.json();
      let base64Data = body.base64 || body.image || '';

      if (!base64Data) {
        return NextResponse.json({ success: false, error: 'No image data provided' }, { status: 400 });
      }

      // ตัด prefix เช่น data:image/jpeg;base64, ออกถ้ามี
      const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      let ext = 'jpg';
      let cleanBase64 = base64Data;

      if (matches && matches.length === 3) {
        ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        cleanBase64 = matches[2];
      }

      const fileName = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
      const filePath = path.join(uploadDir, fileName);

      // บันทึกไฟล์ภาพจริงลง Hard Disk
      const buffer = Buffer.from(cleanBase64, 'base64');
      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/uploads/${fileName}`;

      return NextResponse.json({
        success: true,
        message: 'Image uploaded and saved physically to disk',
        fileName,
        url: fileUrl,
      }, { status: 201 });
    }

    // กรณีที่ 2: รับแบบ Multipart FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file in form data' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'Image uploaded and saved physically to disk',
      fileName,
      url: fileUrl,
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving uploaded image:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 });
  }
}
