import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

// 创建内容验证 schema
const createContentSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().min(1, '内容不能为空'),
  type: z.enum(['TEXT', 'AUDIO', 'VIDEO']).default('TEXT'),
  tags: z.array(z.string()).default([]),
});

// 更新内容验证 schema
const updateContentSchema = z.object({
  title: z.string().min(1, '标题不能为空').optional(),
  content: z.string().min(1, '内容不能为空').optional(),
  type: z.enum(['TEXT', 'AUDIO', 'VIDEO']).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * 获取用户的所有内容
 * GET /api/content
 */
router.get('/', async (req, res) => {
  try {
    const { type, tag, page = '1', limit = '10' } = req.query;
    const userId = req.user!.userId;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = { userId };
    if (type) where.type = type;
    if (tag) where.tags = { has: tag };

    // 查询内容
    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.content.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        contents,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('获取内容列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取内容列表失败',
    });
  }
});

/**
 * 获取单个内容详情
 * GET /api/content/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const content = await prisma.content.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: '内容不存在',
      });
    }

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('获取内容详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取内容详情失败',
    });
  }
});

/**
 * 创建新内容
 * POST /api/content
 */
router.post('/', async (req, res) => {
  try {
    const validatedData = createContentSchema.parse(req.body);
    const userId = req.user!.userId;

    const content = await prisma.content.create({
      data: {
        ...validatedData,
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: '创建成功',
      data: content,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: error.errors,
      });
    }

    console.error('创建内容错误:', error);
    res.status(500).json({
      success: false,
      message: '创建内容失败',
    });
  }
});

/**
 * 更新内容
 * PUT /api/content/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const validatedData = updateContentSchema.parse(req.body);

    // 检查内容是否存在且属于当前用户
    const existingContent = await prisma.content.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingContent) {
      return res.status(404).json({
        success: false,
        message: '内容不存在',
      });
    }

    // 更新内容
    const content = await prisma.content.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      message: '更新成功',
      data: content,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: error.errors,
      });
    }

    console.error('更新内容错误:', error);
    res.status(500).json({
      success: false,
      message: '更新内容失败',
    });
  }
});

/**
 * 删除内容
 * DELETE /api/content/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // 检查内容是否存在且属于当前用户
    const existingContent = await prisma.content.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingContent) {
      return res.status(404).json({
        success: false,
        message: '内容不存在',
      });
    }

    // 删除内容
    await prisma.content.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除内容错误:', error);
    res.status(500).json({
      success: false,
      message: '删除内容失败',
    });
  }
});

/**
 * 批量删除内容
 * POST /api/content/batch-delete
 */
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user!.userId;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的内容ID列表',
      });
    }

    // 删除属于当前用户的内容
    const result = await prisma.content.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    res.json({
      success: true,
      message: `成功删除 ${result.count} 条内容`,
      data: { count: result.count },
    });
  } catch (error) {
    console.error('批量删除内容错误:', error);
    res.status(500).json({
      success: false,
      message: '批量删除失败',
    });
  }
});

export default router;
