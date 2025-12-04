import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class RAGService {
  /**
   * 个性化问答：基于用户已学习的内容回答问题
   */
  async personalizedQA(userId: string, question: string): Promise<string> {
    try {
      // 1. 获取用户的所有学习内容
      const userContents = await prisma.content.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50, // 限制最近50条内容
      });

      if (userContents.length === 0) {
        return "你还没有添加任何学习内容，请先添加一些学习材料后再提问。";
      }

      // 2. 使用关键词匹配找到相关内容
      const relevantContents = this.findRelevantContents(question, userContents);

      // 3. 构建上下文
      const context = relevantContents
        .map(content => `标题: ${content.title}\n内容: ${content.content}`)
        .join('\n\n---\n\n');

      // 4. 调用OpenAI生成回答
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `你是一个个人学习助手。请基于用户的学习内容回答问题。如果用户的学习内容中没有相关信息，请诚实地说明。

用户的学习内容：
${context}

请用中文回答，并且：
1. 优先使用用户已学习的内容
2. 如果内容不足，可以适当补充相关知识
3. 回答要简洁明了，便于理解`
          },
          {
            role: "user",
            content: question
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || "抱歉，我无法生成回答。";
    } catch (error) {
      console.error('个性化问答错误:', error);
      return "抱歉，处理您的问题时出现了错误。";
    }
  }

  /**
   * 知识关联：自动关联相关的学习内容
   */
  async findRelatedContents(userId: string, contentId: string, limit: number = 5): Promise<any[]> {
    try {
      // 1. 获取目标内容
      const targetContent = await prisma.content.findUnique({
        where: { id: contentId },
      });

      if (!targetContent || targetContent.userId !== userId) {
        return [];
      }

      // 2. 获取用户的其他内容
      const otherContents = await prisma.content.findMany({
        where: {
          userId,
          id: { not: contentId },
        },
      });

      // 3. 计算相似度并排序
      const relatedContents = otherContents
        .map(content => ({
          ...content,
          similarity: this.calculateSimilarity(targetContent, content),
        }))
        .filter(content => content.similarity > 0.1) // 过滤掉相似度太低的
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return relatedContents;
    } catch (error) {
      console.error('知识关联错误:', error);
      return [];
    }
  }

  /**
   * 学习建议：根据用户的学习历史推荐相关的学习材料
   */
  async generateLearningRecommendations(userId: string): Promise<{
    recommendations: string[];
    suggestedTopics: string[];
    reviewContents: any[];
  }> {
    try {
      // 1. 获取用户的学习内容和统计信息
      const userContents = await prisma.content.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const chatSessions = await prisma.chatSession.findMany({
        where: { userId },
        include: { messages: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      if (userContents.length === 0) {
        return {
          recommendations: ["开始添加一些学习内容，比如单词、语法规则或例句"],
          suggestedTopics: ["基础语法", "常用词汇", "日常对话"],
          reviewContents: [],
        };
      }

      // 2. 分析学习内容的类型和标签
      const contentTypes = this.analyzeContentTypes(userContents);
      const commonTags = this.extractCommonTags(userContents);

      // 3. 找出需要复习的内容（7天前的内容）
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const reviewContents = userContents
        .filter(content => content.createdAt < sevenDaysAgo)
        .slice(0, 5);

      // 4. 生成个性化建议
      const recommendations = await this.generatePersonalizedRecommendations(
        userContents,
        chatSessions,
        contentTypes,
        commonTags
      );

      // 5. 建议新的学习主题
      const suggestedTopics = this.suggestNewTopics(commonTags, contentTypes);

      return {
        recommendations,
        suggestedTopics,
        reviewContents,
      };
    } catch (error) {
      console.error('学习建议错误:', error);
      return {
        recommendations: ["继续保持学习的好习惯！"],
        suggestedTopics: [],
        reviewContents: [],
      };
    }
  }

  // 私有辅助方法
  private findRelevantContents(question: string, contents: any[]): any[] {
    const questionLower = question.toLowerCase();
    const keywords = questionLower.split(/\s+/).filter(word => word.length > 1);

    return contents
      .map(content => ({
        ...content,
        relevance: this.calculateRelevance(questionLower, keywords, content),
      }))
      .filter(content => content.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);
  }

  private calculateRelevance(question: string, keywords: string[], content: any): number {
    const contentText = `${content.title} ${content.content}`.toLowerCase();
    let score = 0;

    // 关键词匹配
    keywords.forEach(keyword => {
      if (contentText.includes(keyword)) {
        score += 1;
      }
    });

    // 标签匹配
    content.tags.forEach((tag: string) => {
      if (question.includes(tag.toLowerCase())) {
        score += 2;
      }
    });

    // 内容类型匹配
    if (question.includes('语法') && content.type === 'TEXT') {
      score += 1;
    }

    return score;
  }

  private calculateSimilarity(content1: any, content2: any): number {
    // 简单的相似度计算：基于标签重叠和内容关键词
    let similarity = 0;

    // 标签相似度
    const tags1 = content1.tags || [];
    const tags2 = content2.tags || [];
    const commonTags = tags1.filter((tag: string) => tags2.includes(tag));
    similarity += commonTags.length * 0.3;

    // 内容类型相似度
    if (content1.type === content2.type) {
      similarity += 0.2;
    }

    // 简单的文本相似度（基于共同词汇）
    const words1 = content1.content.toLowerCase().split(/\s+/);
    const words2 = content2.content.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word) && word.length > 2);
    similarity += Math.min(commonWords.length * 0.1, 0.5);

    return Math.min(similarity, 1);
  }

  private analyzeContentTypes(contents: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    contents.forEach(content => {
      types[content.type] = (types[content.type] || 0) + 1;
    });
    return types;
  }

  private extractCommonTags(contents: any[]): string[] {
    const tagCount: Record<string, number> = {};
    contents.forEach(content => {
      content.tags.forEach((tag: string) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
  }

  private async generatePersonalizedRecommendations(
    contents: any[],
    chatSessions: any[],
    contentTypes: Record<string, number>,
    commonTags: string[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // 基于内容数量的建议
    if (contents.length < 10) {
      recommendations.push("建议继续添加更多学习内容，丰富你的知识库");
    }

    // 基于内容类型的建议
    if (contentTypes.TEXT && !contentTypes.AUDIO) {
      recommendations.push("考虑添加一些音频内容来提高听力技能");
    }

    // 基于标签的建议
    if (commonTags.includes('语法') && !commonTags.includes('练习')) {
      recommendations.push("建议添加一些语法练习题来巩固理论知识");
    }

    // 基于聊天历史的建议
    if (chatSessions.length > 0) {
      const recentQuestions = chatSessions
        .flatMap(session => session.messages)
        .filter(msg => msg.role === 'user')
        .slice(0, 10);

      if (recentQuestions.length > 5) {
        recommendations.push("你很活跃！建议定期整理聊天中学到的知识点");
      }
    }

    // 默认建议
    if (recommendations.length === 0) {
      recommendations.push("保持良好的学习习惯，继续加油！");
    }

    return recommendations;
  }

  private suggestNewTopics(commonTags: string[], contentTypes: Record<string, number>): string[] {
    const suggestions: string[] = [];

    // 基于已有标签建议相关主题
    if (commonTags.includes('语法')) {
      suggestions.push('高级语法结构', '语法练习');
    }
    if (commonTags.includes('词汇')) {
      suggestions.push('同义词辨析', '词汇搭配');
    }
    if (commonTags.includes('口语')) {
      suggestions.push('发音练习', '日常对话');
    }

    // 基于内容类型建议
    if (contentTypes.TEXT && Object.keys(contentTypes).length === 1) {
      suggestions.push('听力材料', '视频学习');
    }

    // 通用建议
    if (suggestions.length === 0) {
      suggestions.push('阅读理解', '写作练习', '听力训练');
    }

    return suggestions.slice(0, 5);
  }
}

export const ragService = new RAGService();
