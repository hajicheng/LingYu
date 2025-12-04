# RAG 检索功能使用指南

## 功能概述

本项目已集成了基于RAG（检索增强生成）技术的智能学习功能，主要包括以下三个核心功能：

### 1. 个性化问答 🤖
基于用户已学习的内容回答问题，提供个性化的学习支持。

**使用场景：**
- "我之前学过的关于过去时的语法规则是什么？"
- "总结一下我学过的单词"
- "我在语法方面有哪些薄弱环节？"

**API 接口：**
```http
POST /api/rag/qa
Content-Type: application/json

{
  "userId": "user-id",
  "question": "我之前学过的关于过去时的语法规则是什么？"
}
```

### 2. 知识关联 🔗
自动关联相关的学习内容，帮助用户建立知识体系。

**使用场景：**
- 查看与当前学习内容相关的其他知识点
- 发现知识点之间的关联性
- 构建个人知识图谱

**API 接口：**
```http
GET /api/rag/related/{contentId}?userId={userId}&limit=5
```

### 3. 学习建议 💡
根据用户的学习历史，推荐相关的学习材料和改进建议。

**使用场景：**
- 获取个性化学习建议
- 发现需要复习的内容
- 获取新的学习主题推荐

**API 接口：**
```http
GET /api/rag/recommendations/{userId}
```

## 技术实现

### 后端架构
- **RAG服务模块**: `server/src/services/ragService.ts`
- **API路由**: `server/src/routes/rag.ts`
- **数据库模型**: 基于现有的Content模型

### 前端组件
- **智能学习助手**: `client/src/components/SmartLearningAssistant.tsx`
- **使用页面**: `client/src/pages/SmartLearningPage.tsx`

### 核心算法
1. **文本相似度计算**: 基于关键词匹配和标签重叠
2. **内容检索**: 使用多维度评分机制
3. **个性化推荐**: 基于学习历史和内容分析

## 使用方法

### 1. 启动服务
```bash
# 安装依赖
npm run setup

# 启动开发服务器
npm run dev
```

### 2. 前端集成
```tsx
import SmartLearningAssistant from '../components/SmartLearningAssistant';

function MyPage() {
  return (
    <SmartLearningAssistant userId="your-user-id" />
  );
}
```

### 3. API调用示例
```javascript
// 个性化问答
const askQuestion = async (question) => {
  const response = await fetch('/api/rag/qa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user-id', question }),
  });
  return response.json();
};

// 获取学习建议
const getRecommendations = async (userId) => {
  const response = await fetch(`/api/rag/recommendations/${userId}`);
  return response.json();
};

// 查找相关内容
const findRelated = async (contentId, userId) => {
  const response = await fetch(`/api/rag/related/${contentId}?userId=${userId}`);
  return response.json();
};
```

## 配置要求

### 环境变量
```env
# OpenAI API配置（用于个性化问答）
OPENAI_API_KEY=your-openai-api-key

# 数据库配置
DATABASE_URL=your-postgresql-connection-string
```

### 依赖包
```json
{
  "dependencies": {
    "openai": "^4.20.1",
    "langchain": "^0.0.190",
    "@prisma/client": "^5.6.0"
  }
}
```

## 功能特点

### 🎯 智能化
- 基于用户个人学习内容的智能问答
- 自动识别知识点关联性
- 个性化学习路径推荐

### 🔍 精准检索
- 多维度相似度计算
- 关键词和标签匹配
- 内容类型智能分类

### 📊 数据驱动
- 基于学习历史的分析
- 复习提醒和进度跟踪
- 学习效果评估

### 🚀 易于扩展
- 模块化设计
- 标准化API接口
- 可插拔的算法组件

## 未来优化方向

1. **向量化检索**: 集成向量数据库提升检索精度
2. **深度学习**: 使用更先进的NLP模型
3. **多模态支持**: 支持图片、音频等多媒体内容
4. **协作学习**: 支持团队知识共享
5. **学习分析**: 更详细的学习行为分析

## 故障排除

### 常见问题
1. **OpenAI API调用失败**: 检查API密钥配置
2. **数据库连接错误**: 确认数据库连接字符串
3. **前端组件报错**: 确保依赖包正确安装

### 调试建议
- 查看服务器日志获取详细错误信息
- 使用浏览器开发者工具检查网络请求
- 确认用户ID和内容ID的有效性

## 贡献指南

欢迎提交Issue和Pull Request来改进RAG功能！

1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

---

**注意**: 这是一个基础版本的RAG实现，主要用于演示和学习。在生产环境中建议使用更成熟的向量数据库和检索算法。
