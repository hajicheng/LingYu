import { embed } from 'ai';
import { openai } from './openai';
import { supabase } from './supabase';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { RAGContext, ContentType } from '@/types';

// 文本分块配置
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

/**
 * 将学习内容向量化并存储到数据库
 */
export async function addLearningContent(
  userId: string,
  content: string,
  contentType: ContentType,
  tags: string[] = [],
  metadata: Record<string, any> = {}
): Promise<string[]> {
  // 文本分块（对于较长的内容）
  const chunks = content.length > 400 
    ? await textSplitter.splitText(content) 
    : [content];

  const chunkIds: string[] = [];

  // 向量化并存储每个块
  for (const chunk of chunks) {
    // 生成向量
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: chunk,
    });

    // 存储到 Supabase
    const { data, error } = await supabase
      .from('learning_chunks')
      .insert({
        user_id: userId,
        content: chunk,
        vector: embedding,
        content_type: contentType,
        tags,
        metadata,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to insert chunk: ${error.message}`);
    }

    if (data) {
      chunkIds.push(data.id);

      // 初始化学习进度
      await supabase
        .from('learning_progress')
        .insert({
          user_id: userId,
          chunk_id: data.id,
          mastery_level: 0,
          review_count: 0,
        });
    }
  }

  return chunkIds;
}

/**
 * 检索用户学习内容（RAG）
 */
export async function retrieveLearningContext(
  userId: string,
  query: string,
  matchThreshold: number = 0.7,
  matchCount: number = 5
): Promise<RAGContext[]> {
  // 生成查询向量
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query,
  });

  // 从数据库检索相似内容
  const { data, error } = await supabase.rpc('get_user_learning_context', {
    p_user_id: userId,
    query_vector: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    console.error('Error retrieving learning context:', error);
    return [];
  }

  return data || [];
}

/**
 * 构建 RAG Prompt
 */
export function buildRAGPrompt(contexts: RAGContext[]): string {
  if (contexts.length === 0) {
    return '用户知识库中暂无相关内容。';
  }

  return contexts
    .map(
      (ctx, index) =>
        `[知识点 ${index + 1} - ${getContentTypeLabel(ctx.content_type)}]
内容：${ctx.content}
${ctx.tags.length > 0 ? `标签：${ctx.tags.join(', ')}` : ''}
${Object.keys(ctx.metadata).length > 0 ? `附加信息：${JSON.stringify(ctx.metadata, null, 2)}` : ''}
相似度：${(ctx.similarity * 100).toFixed(1)}%`
    )
    .join('\n\n---\n\n');
}

function getContentTypeLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    vocabulary: '单词',
    grammar: '语法',
    note: '笔记',
    example: '例句',
  };
  return labels[type];
}

