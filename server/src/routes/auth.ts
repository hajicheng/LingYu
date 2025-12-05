import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 注册验证 schema
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  name: z.string().min(2, '姓名至少2个字符'),
  password: z.string().min(6, '密码至少6个字符'),
});

// 登录验证 schema
const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
});

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    // 验证请求数据
    const validatedData = registerSchema.parse(req.body);
    const { email, name, password } = validatedData;

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册',
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user,
        token,
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

    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
    });
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    // 验证请求数据
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        token,
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

    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
    });
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
    });
  }
});

/**
 * 更新用户信息
 * PUT /api/auth/profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '姓名至少2个字符',
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: '更新成功',
      data: user,
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败',
    });
  }
});

/**
 * 修改密码
 * PUT /api/auth/password
 */
router.put('/password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '旧密码和新密码不能为空',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码至少6个字符',
      });
    }

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '旧密码错误',
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败',
    });
  }
});

export default router;
