import express from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * 获取用户统计数据
 * GET /api/stats/overview
 */
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user!.userId;

    // 并行查询各项统计数据
    const [
      contentCount,
      chatSessionCount,
      studySessionCount,
      totalStudyDuration,
      recentContents,
      recentStudySessions,
    ] = await Promise.all([
      // 内容总数
      prisma.content.count({ where: { userId } }),
      
      // 聊天会话总数
      prisma.chatSession.count({ where: { userId } }),
      
      // 学习会话总数
      prisma.studySession.count({ where: { userId } }),
      
      // 总学习时长
      prisma.studySession.aggregate({
        where: { userId },
        _sum: { duration: true },
      }),
      
      // 最近的内容
      prisma.content.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
        },
      }),
      
      // 最近的学习记录
      prisma.studySession.findMany({
        where: { userId },
        take: 7,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          contentCount,
          chatSessionCount,
          studySessionCount,
          totalStudyDuration: totalStudyDuration._sum.duration || 0,
        },
        recentContents,
        recentStudySessions,
      },
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
    });
  }
});

/**
 * 获取内容类型分布
 * GET /api/stats/content-types
 */
router.get('/content-types', async (req, res) => {
  try {
    const userId = req.user!.userId;

    const contents = await prisma.content.findMany({
      where: { userId },
      select: { type: true },
    });

    // 统计各类型数量
    const typeCount = contents.reduce((acc: any, content) => {
      acc[content.type] = (acc[content.type] || 0) + 1;
      return acc;
    }, {});

    const distribution = Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
    }));

    res.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error('获取内容类型分布错误:', error);
    res.status(500).json({
      success: false,
      message: '获取内容类型分布失败',
    });
  }
});

/**
 * 获取学习趋势（最近7天）
 * GET /api/stats/study-trend
 */
router.get('/study-trend', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const studySessions = await prisma.studySession.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 按日期分组统计
    const trendData = studySessions.reduce((acc: any, session) => {
      const date = session.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, duration: 0, count: 0 };
      }
      acc[date].duration += session.duration;
      acc[date].count += 1;
      return acc;
    }, {});

    const trend = Object.values(trendData);

    res.json({
      success: true,
      data: {
        days,
        trend,
      },
    });
  } catch (error) {
    console.error('获取学习趋势错误:', error);
    res.status(500).json({
      success: false,
      message: '获取学习趋势失败',
    });
  }
});

/**
 * 创建学习记录
 * POST /api/stats/study-session
 */
router.post('/study-session', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { duration } = req.body;

    if (!duration || duration <= 0) {
      return res.status(400).json({
        success: false,
        message: '学习时长必须大于0',
      });
    }

    const studySession = await prisma.studySession.create({
      data: {
        userId,
        duration: Math.floor(duration),
      },
    });

    res.status(201).json({
      success: true,
      message: '学习记录创建成功',
      data: studySession,
    });
  } catch (error) {
    console.error('创建学习记录错误:', error);
    res.status(500).json({
      success: false,
      message: '创建学习记录失败',
    });
  }
});

/**
 * 获取标签统计
 * GET /api/stats/tags
 */
router.get('/tags', async (req, res) => {
  try {
    const userId = req.user!.userId;

    const contents = await prisma.content.findMany({
      where: { userId },
      select: { tags: true },
    });

    // 统计所有标签
    const tagCount: any = {};
    contents.forEach((content) => {
      content.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    const tags = Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a: any, b: any) => b.count - a.count);

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('获取标签统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取标签统计失败',
    });
  }
});

export default router;
