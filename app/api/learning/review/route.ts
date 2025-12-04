import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateReviewPriority } from '@/lib/utils';
import type { GetReviewResponse, ReviewItem } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 获取需要复习的内容
    const { data: progressData, error: progressError } = await supabase
      .from('learning_progress')
      .select(`
        *,
        learning_chunks (
          id,
          content,
          content_type,
          tags,
          metadata
        )
      `)
      .eq('user_id', userId)
      .lte('next_review', now)
      .order('next_review', { ascending: true });

    if (progressError) {
      throw progressError;
    }

    // 处理数据并计算优先级
    const reviewItems: ReviewItem[] = (progressData || []).map((item: any) => {
      const chunk = item.learning_chunks;
      const lastReviewed = item.last_reviewed ? new Date(item.last_reviewed) : new Date();
      const daysSinceReview = Math.floor(
        (Date.now() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
      );

      const priority = calculateReviewPriority(
        daysSinceReview,
        item.mastery_level
      );

      return {
        chunkId: chunk.id,
        content: chunk.content,
        contentType: chunk.content_type,
        tags: chunk.tags || [],
        metadata: chunk.metadata || {},
        masteryLevel: item.mastery_level,
        daysSinceReview,
        priority,
      };
    });

    // 按优先级排序
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    reviewItems.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return NextResponse.json({
      reviewItems,
      totalDue: reviewItems.length,
    } as GetReviewResponse);
  } catch (error) {
    console.error('Error fetching review items:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

