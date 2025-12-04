-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 学习内容块表
CREATE TABLE IF NOT EXISTS learning_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  vector vector(1536),
  content_type TEXT NOT NULL CHECK (content_type IN ('vocabulary', 'grammar', 'note', 'example')),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 学习进度表
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chunk_id UUID NOT NULL REFERENCES learning_chunks(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  last_reviewed TIMESTAMP WITH TIME ZONE,
  next_review TIMESTAMP WITH TIME ZONE,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chunk_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_learning_chunks_user_id ON learning_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_chunks_content_type ON learning_chunks(content_type);
CREATE INDEX IF NOT EXISTS idx_learning_chunks_created_at ON learning_chunks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_next_review ON learning_progress(next_review);

-- 创建向量相似度搜索索引（使用 HNSW 算法）
CREATE INDEX IF NOT EXISTS idx_learning_chunks_vector ON learning_chunks 
USING hnsw (vector vector_cosine_ops);

-- 创建向量检索函数
CREATE OR REPLACE FUNCTION get_user_learning_context(
  p_user_id UUID,
  query_vector vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  content_type TEXT,
  tags TEXT[],
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    lc.id,
    lc.content,
    lc.content_type,
    lc.tags,
    lc.metadata,
    1 - (lc.vector <=> query_vector) as similarity
  FROM learning_chunks lc
  WHERE lc.user_id = p_user_id
    AND 1 - (lc.vector <=> query_vector) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- 创建更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 learning_chunks 表添加触发器
DROP TRIGGER IF EXISTS update_learning_chunks_updated_at ON learning_chunks;
CREATE TRIGGER update_learning_chunks_updated_at
  BEFORE UPDATE ON learning_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用 Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（允许用户访问自己的数据）
-- 注意：这里使用简化的策略，实际生产环境需要配合认证系统

-- users 表策略
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (true);

-- learning_chunks 表策略
CREATE POLICY "Users can view their own chunks" ON learning_chunks
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own chunks" ON learning_chunks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own chunks" ON learning_chunks
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own chunks" ON learning_chunks
  FOR DELETE USING (true);

-- learning_progress 表策略
CREATE POLICY "Users can view their own progress" ON learning_progress
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own progress" ON learning_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own progress" ON learning_progress
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own progress" ON learning_progress
  FOR DELETE USING (true);

-- 插入演示用户（可选，用于开发测试）
INSERT INTO users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@example.com')
ON CONFLICT (email) DO NOTHING;

