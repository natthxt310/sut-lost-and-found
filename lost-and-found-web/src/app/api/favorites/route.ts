import { NextRequest, NextResponse } from 'next/server';
import { backendStore } from '../../../lib/store';

// GET /api/favorites - ดึงรายการโปรดทั้งหมด (Source 3 Retrieve)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const favorites = backendStore.getFavorites(userId);
    return NextResponse.json({ success: true, count: favorites.length, data: favorites });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/favorites - เพิ่มรายการโปรด (Source 3 Create)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.userId || !body.postId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (userId, postId)' },
        { status: 400 }
      );
    }

    const fav = backendStore.addFavorite(body.userId, body.postId, body.personalNote);
    return NextResponse.json({ success: true, message: 'Favorite added', data: fav }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add favorite' }, { status: 500 });
  }
}
