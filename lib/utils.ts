import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 计算下次复习时间（基于遗忘曲线）
export function calculateNextReview(
  masteryLevel: number,
  reviewCount: number
): Date {
  // 间隔天数：1, 2, 4, 7, 15, 30, 60
  const intervals = [1, 2, 4, 7, 15, 30, 60];
  const intervalIndex = Math.min(reviewCount, intervals.length - 1);
  const days = intervals[intervalIndex];

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + days);

  return nextReview;
}

// 计算优先级
export function calculateReviewPriority(
  daysSinceReview: number,
  masteryLevel: number
): 'high' | 'medium' | 'low' {
  // 掌握程度越低，优先级越高
  // 距离上次复习越久，优先级越高
  const urgencyScore = daysSinceReview * (6 - masteryLevel);

  if (urgencyScore >= 20) return 'high';
  if (urgencyScore >= 10) return 'medium';
  return 'low';
}

// 格式化日期
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// 格式化相对时间
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return '刚刚';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} 天前`;
  return formatDate(d);
}

// 获取内容类型的中文名称
export function getContentTypeName(type: string): string {
  const names: Record<string, string> = {
    vocabulary: '单词',
    grammar: '语法',
    note: '笔记',
    example: '例句',
  };
  return names[type] || type;
}

// 获取掌握程度文本
export function getMasteryLevelText(level: number): string {
  const texts = ['未学习', '初识', '了解', '熟悉', '掌握', '精通'];
  return texts[level] || '未知';
}

// 获取掌握程度颜色
export function getMasteryLevelColor(level: number): string {
  const colors = [
    'text-gray-400',
    'text-red-500',
    'text-orange-500',
    'text-yellow-500',
    'text-green-500',
    'text-blue-500',
  ];
  return colors[level] || 'text-gray-400';
}

