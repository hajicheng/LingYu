import { NextRequest, NextResponse } from 'next/server';
import { addLearningContent } from '@/lib/rag';
import type { AddContentRequest, AddContentResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: AddContentRequest = await req.json();
    const { userId, content, contentType, tags, metadata } = body;

    // 验证必填字段
    if (!userId || !content || !contentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' } as AddContentResponse,
        { status: 400 }
      );
    }

    // 验证内容类型
    const validTypes = ['vocabulary', 'grammar', 'note', 'example'];
    if (!validTypes.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type' } as AddContentResponse,
        { status: 400 }
      );
    }

    // 添加内容到知识库
    const chunkIds = await addLearningContent(
      userId,
      content,
      contentType,
      tags || [],
      metadata || {}
    );

    return NextResponse.json({
      success: true,
      chunkIds,
    } as AddContentResponse);
  } catch (error) {
    console.error('Error adding learning content:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as AddContentResponse,
      { status: 500 }
    );
  }
}

