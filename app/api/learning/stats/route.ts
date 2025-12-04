import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { LearningStats } from '@/types';

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

    // 获取总数和各类型数量
    const { data: chunks, error: chunksError } = await supabase
      .from('learning_chunks')
      .select('content_type')
      .eq('user_id', userId);

    if (chunksError) {
      throw chunksError;
    }

    const totalItems = chunks?.length || 0;
    const vocabularyCount = chunks?.filter(c => c.content_type === 'vocabulary').length || 0;
    const grammarCount = chunks?.filter(c => c.content_type === 'grammar').length || 0;
    const noteCount = chunks?.filter(c => c.content_type === 'note').length || 0;
    const exampleCount = chunks?.filter(c => c.content_type === 'example').length || 0;

    // 获取掌握程度分布
    const { data: progress, error: progressError } = await supabase
      .from('learning_progress')
      .select('mastery_level')
      .eq('user_id', userId);

    if (progressError) {
      throw progressError;
    }

    const masteryDistribution = [0, 1, 2, 3, 4, 5].map(level => ({
      level,
      count: progress?.filter(p => p.mastery_level === level).length || 0,
    }));

    // 获取最近7天的学习数据
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentChunks, error: recentChunksError } = await supabase
      .from('learning_chunks')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentChunksError) {
      throw recentChunksError;
    }

    const { data: recentProgress, error: recentProgressError } = await supabase
      .from('learning_progress')
      .select('last_reviewed')
      .eq('user_id', userId)
      .gte('last_reviewed', sevenDaysAgo.toISOString());

    if (recentProgressError) {
      throw recentProgressError;
    }

    // 按日期分组统计
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const itemsAdded = recentChunks?.filter(c => 
        c.created_at.startsWith(dateStr)
      ).length || 0;

      const itemsReviewed = recentProgress?.filter(p => 
        p.last_reviewed && p.last_reviewed.startsWith(dateStr)
      ).length || 0;

      weeklyProgress.push({
        date: dateStr,
        itemsAdded,
        itemsReviewed,
      });
    }

    const stats: LearningStats = {
      totalItems,
      vocabularyCount,
      grammarCount,
      noteCount,
      exampleCount,
      masteryDistribution,
      weeklyProgress,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

