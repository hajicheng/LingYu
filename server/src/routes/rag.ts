import express from 'express';
import { ragService } from '../services/ragService';

const router = express.Router();

/**
 * 个性化问答 API
 * POST /api/rag/qa
 */
router.post('/qa', async (req, res) => {
  try {
    const { userId, question } = req.body;

    if (!userId || !question) {
      return res.status(400).json({
        success: false,
        message: '用户ID和问题不能为空',
      });
    }

    const answer = await ragService.personalizedQA(userId, question);

    res.json({
      success: true,
      data: {
        question,
        answer,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('个性化问答API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 知识关联 API
 * GET /api/rag/related/:contentId
 */
router.get('/related/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    const { userId, limit = 5 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空',
      });
    }

    const relatedContents = await ragService.findRelatedContents(
      userId as string,
      contentId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: {
        contentId,
        relatedContents,
        count: relatedContents.length,
      },
    });
  } catch (error) {
    console.error('知识关联API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 学习建议 API
 * GET /api/rag/recommendations/:userId
 */
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const recommendations = await ragService.generateLearningRecommendations(userId);

    res.json({
      success: true,
      data: {
        userId,
        ...recommendations,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('学习建议API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 智能搜索 API
 * POST /api/rag/search
 */
router.post('/search', async (req, res) => {
  try {
    const { userId, query, type } = req.body;

    if (!userId || !query) {
      return res.status(400).json({
        success: false,
        message: '用户ID和搜索查询不能为空',
      });
    }

    // 这里可以实现更复杂的搜索逻辑
    // 目前先使用个性化问答作为搜索结果
    const searchResult = await ragService.personalizedQA(userId, `搜索关于"${query}"的内容`);

    res.json({
      success: true,
      data: {
        query,
        type,
        result: searchResult,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('智能搜索API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

export default router;
