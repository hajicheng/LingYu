import { streamText } from 'ai';
import { openai } from '@/lib/openai';
import { retrieveLearningContext, buildRAGPrompt } from '@/lib/rag';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { userId, messages } = await req.json();

    if (!userId || !messages || !Array.isArray(messages)) {
      return new Response('Invalid request', { status: 400 });
    }

    // 获取最新的用户消息
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== 'user') {
      return new Response('Invalid message format', { status: 400 });
    }

    // 从用户知识库检索相关内容
    const contexts = await retrieveLearningContext(
      userId,
      latestMessage.content,
      0.7,
      5
    );

    // 构建 RAG 上下文
    const contextPrompt = buildRAGPrompt(contexts);

    // 生成系统提示
    const systemPrompt = `你是一个专业的语言学习助手，你的任务是基于用户的个人学习知识库来回答问题。

## 用户知识库内容

${contextPrompt}

## 回答指南

1. **优先使用知识库内容**：如果知识库中有相关信息，请优先基于这些内容回答
2. **关联学习内容**：尝试将多个相关知识点联系起来，帮助用户建立知识网络
3. **补充通用知识**：如果知识库中没有足够信息，可以补充通用的语言知识，但要明确说明这是补充内容
4. **鼓励学习**：给予积极的反馈，鼓励用户继续学习
5. **提供例句**：在解释时尽量提供例句帮助理解
6. **使用 Markdown**：使用 Markdown 格式化回答，让内容更清晰

## 回答格式

使用清晰的结构组织回答：
- 使用标题和列表
- 重要信息使用**粗体**
- 代码或单词使用 \`code\` 格式
- 例句使用引用块

请基于以上信息回答用户的问题。`;

    // 流式生成回答
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      temperature: 0.7,
      maxTokens: 1000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

