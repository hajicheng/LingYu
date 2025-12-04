'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Target, TrendingUp } from 'lucide-react';
import type { LearningStats } from '@/types';

interface StatsOverviewProps {
  userId: string;
}

export default function StatsOverview({ userId }: StatsOverviewProps) {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/learning/stats?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const todayProgress = stats.weeklyProgress[stats.weeklyProgress.length - 1];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">总学习内容</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
          <div className="text-xs text-muted-foreground mt-2">
            <p>单词：{stats.vocabularyCount}</p>
            <p>语法：{stats.grammarCount}</p>
            <p>笔记：{stats.noteCount}</p>
            <p>例句：{stats.exampleCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">今日学习</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayProgress?.itemsAdded || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            新增内容
          </p>
          <div className="text-2xl font-bold mt-2">
            {todayProgress?.itemsReviewed || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            已复习内容
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">掌握程度</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.masteryDistribution.map((item) => {
              const percentage =
                stats.totalItems > 0
                  ? Math.round((item.count / stats.totalItems) * 100)
                  : 0;
              return (
                <div key={item.level} className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground w-12">
                    等级 {item.level}
                  </div>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground w-12 text-right">
                    {item.count}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

