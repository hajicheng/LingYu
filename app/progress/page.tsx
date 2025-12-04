'use client';

import { useEffect, useState } from 'react';
import StatsOverview from '@/components/StatsOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { LearningStats } from '@/types';

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID || '00000000-0000-0000-0000-000000000001';

export default function ProgressPage() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/learning/stats?userId=${DEMO_USER_ID}`);
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
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">学习进度</h1>
        <p className="text-muted-foreground">
          查看你的学习统计和进度追踪
        </p>
      </div>

      <div className="space-y-8">
        {/* 统计概览 */}
        <StatsOverview userId={DEMO_USER_ID} />

        {/* 周学习趋势 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <Card>
            <CardHeader>
              <CardTitle>最近 7 天学习趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.weeklyProgress.map((day) => (
                  <div key={day.date} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{day.date}</span>
                      <span className="text-muted-foreground">
                        新增 {day.itemsAdded} · 复习 {day.itemsReviewed}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{
                              width: `${Math.min((day.itemsAdded / 10) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${Math.min((day.itemsReviewed / 10) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span>新增内容</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span>复习内容</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

