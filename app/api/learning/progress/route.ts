import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateNextReview } from '@/lib/utils';
import type { UpdateProgressRequest, UpdateProgressResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: UpdateProgressRequest = await req.json();
    const { userId, chunkId, masteryLevel } = body;

    if (!userId || !chunkId || masteryLevel === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' } as UpdateProgressResponse,
        { status: 400 }
      );
    }

    if (masteryLevel < 0 || masteryLevel > 5) {
      return NextResponse.json(
        { success: false, error: 'Mastery level must be between 0 and 5' } as UpdateProgressResponse,
        { status: 400 }
      );
    }

    // 获取当前进度记录
    const { data: existingProgress } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('chunk_id', chunkId)
      .single();

    const now = new Date().toISOString();
    const reviewCount = existingProgress ? existingProgress.review_count + 1 : 1;
    const nextReview = calculateNextReview(masteryLevel, reviewCount);

    // 更新或插入进度记录
    const { error } = await supabase
      .from('learning_progress')
      .upsert({
        user_id: userId,
        chunk_id: chunkId,
        mastery_level: masteryLevel,
        last_reviewed: now,
        next_review: nextReview.toISOString(),
        review_count: reviewCount,
      }, {
        onConflict: 'user_id,chunk_id'
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      nextReview: nextReview.toISOString(),
    } as UpdateProgressResponse);
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as UpdateProgressResponse,
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const chunkId = searchParams.get('chunkId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId);

    if (chunkId) {
      query = query.eq('chunk_id', chunkId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ progress: data || [] });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

