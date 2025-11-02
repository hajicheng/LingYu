// 内容类型
export type ContentType = 'vocabulary' | 'grammar' | 'note' | 'example';

// 学习内容块
export interface LearningChunk {
  id: string;
  user_id: string;
  content: string;
  content_type: ContentType;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 学习进度
export interface LearningProgress {
  id: string;
  user_id: string;
  chunk_id: string;
  mastery_level: number; // 0-5
  last_reviewed: string | null;
  next_review: string | null;
  review_count: number;
  created_at: string;
}

// RAG 检索结果
export interface RAGContext {
  id: string;
  content: string;
  content_type: ContentType;
  tags: string[];
  metadata: Record<string, any>;
  similarity: number;
}

// API 请求/响应类型

// 添加内容请求
export interface AddContentRequest {
  userId: string;
  content: string;
  contentType: ContentType;
  tags?: string[];
  metadata?: Record<string, any>;
}

// 添加内容响应
export interface AddContentResponse {
  success: boolean;
  chunkIds?: string[];
  error?: string;
}

// 聊天请求
export interface ChatRequest {
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

// 获取内容请求参数
export interface GetContentParams {
  userId: string;
  type?: ContentType;
  tags?: string[];
  limit?: number;
  offset?: number;
}

// 获取内容响应
export interface GetContentResponse {
  contents: LearningChunk[];
  total: number;
}

// 更新进度请求
export interface UpdateProgressRequest {
  userId: string;
  chunkId: string;
  masteryLevel: number;
}

// 更新进度响应
export interface UpdateProgressResponse {
  success: boolean;
  nextReview?: string;
  error?: string;
}

// 复习项目
export interface ReviewItem {
  chunkId: string;
  content: string;
  contentType: ContentType;
  tags: string[];
  metadata: Record<string, any>;
  masteryLevel: number;
  daysSinceReview: number;
  priority: 'high' | 'medium' | 'low';
}

// 获取复习建议响应
export interface GetReviewResponse {
  reviewItems: ReviewItem[];
  totalDue: number;
}

// 学习统计
export interface LearningStats {
  totalItems: number;
  vocabularyCount: number;
  grammarCount: number;
  noteCount: number;
  exampleCount: number;
  masteryDistribution: {
    level: number;
    count: number;
  }[];
  weeklyProgress: {
    date: string;
    itemsAdded: number;
    itemsReviewed: number;
  }[];
}

