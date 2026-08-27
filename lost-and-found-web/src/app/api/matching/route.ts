import { NextRequest, NextResponse } from 'next/server';
import { backendStore } from '../../../lib/store';
import { findMatchesForPost } from '../../../lib/matching';

// POST /api/matching - ตรวจสอบการจับคู่อัตโนมัติ (RQ-009)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const post = body.post || body;
    const allPosts = backendStore.getPosts();
    const matches = findMatchesForPost(post, allPosts);

    return NextResponse.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Matching calculation failed' }, { status: 500 });
  }
}
