import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { GetContentResponse } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const tagsParam = searchParams.get('tags');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // 构建查询
    let query = supabase
      .from('learning_chunks')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 按类型筛选
    if (type) {
      query = query.eq('content_type', type);
    }

    // 按标签筛选
    if (tagsParam) {
      const tags = tagsParam.split(',');
      query = query.overlaps('tags', tags);
    }

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      contents: data || [],
      total: count || 0,
    } as GetContentResponse);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const chunkId = searchParams.get('chunkId');

    if (!userId || !chunkId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 删除学习内容
    const { error } = await supabase
      .from('learning_chunks')
      .delete()
      .eq('id', chunkId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

