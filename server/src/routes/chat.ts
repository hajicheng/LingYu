import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

// 创建会话验证 schema
const createSessionSchema = z.object({
  title: z.string().optional(),
});

// 发送消息验证 schema
const sendMessageSchema = z.object({
  sessionId: z.string().min(1, '会话ID不能为空'),
  content: z.string().min(1, '消息内容不能为空'),
});

/**
 * 获取用户的所有聊天会话
 * GET /api/chat/sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    const userId = req.user!.userId;

    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('获取会话列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取会话列表失败',
    });
  }
});

/**
 * 创建新的聊天会话
 * POST /api/chat/sessions
 */
router.post('/sessions', async (req, res) => {
  try {
    const validatedData = createSessionSchema.parse(req.body);
    const userId = req.user!.userId;

    const session = await prisma.chatSession.create({
      data: {
        userId,
        title: validatedData.title || '新对话',
      },
    });

    res.status(201).json({
      success: true,
      message: '创建成功',
      data: session,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: error.errors,
      });
    }

    console.error('创建会话错误:', error);
    res.status(500).json({
      success: false,
      message: '创建会话失败',
    });
  }
});

/**
 * 获取会话的所有消息
 * GET /api/chat/sessions/:sessionId/messages
 */
router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;

    // 验证会话是否属于当前用户
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在',
      });
    }

    // 获取消息
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: {
        session,
        messages,
      },
    });
  } catch (error) {
    console.error('获取消息列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取消息列表失败',
    });
  }
});

/**
 * 发送消息
 * POST /api/chat/messages
 */
router.post('/messages', async (req, res) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body);
    const userId = req.user!.userId;
    const { sessionId, content } = validatedData;

    // 验证会话是否属于当前用户
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在',
      });
    }

    // 创建用户消息
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content,
      },
    });

    // TODO: 这里应该调用 AI 服务生成回复
    // 目前先返回一个简单的回复
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: '这是一个示例回复。请集成实际的 AI 服务来生成智能回复。',
      },
    });

    // 更新会话的 updatedAt
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    res.json({
      success: true,
      data: {
        userMessage,
        assistantMessage,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: error.errors,
      });
    }

    console.error('发送消息错误:', error);
    res.status(500).json({
      success: false,
      message: '发送消息失败',
    });
  }
});

/**
 * 删除会话
 * DELETE /api/chat/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;

    // 验证会话是否属于当前用户
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在',
      });
    }

    // 删除会话（级联删除消息）
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除会话错误:', error);
    res.status(500).json({
      success: false,
      message: '删除会话失败',
    });
  }
});

/**
 * 更新会话标题
 * PUT /api/chat/sessions/:sessionId
 */
router.put('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    const userId = req.user!.userId;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '标题不能为空',
      });
    }

    // 验证会话是否属于当前用户
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在',
      });
    }

    // 更新标题
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: title.trim() },
    });

    res.json({
      success: true,
      message: '更新成功',
      data: updatedSession,
    });
  } catch (error) {
    console.error('更新会话错误:', error);
    res.status(500).json({
      success: false,
      message: '更新会话失败',
    });
  }
});

export default router;
