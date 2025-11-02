'use client';

import { useState } from 'react';
import LearningChat from '@/components/LearningChat';
import QuickAdd from '@/components/QuickAdd';
import StatsOverview from '@/components/StatsOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 演示用户 ID，实际应用应该从认证系统获取
const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID || '00000000-0000-0000-0000-000000000001';

export default function Home() {
  const [refresh, setRefresh] = useState(0);

  const handleContentAdded = () => {
    setRefresh(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">欢迎来到语言学习库</h1>
        <p className="text-muted-foreground">
          基于你的个人知识库，AI 助手将为你提供个性化的学习指导
        </p>
      </div>

      {/* 统计概览 */}
      <div className="mb-8">
        <StatsOverview userId={DEMO_USER_ID} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* 左侧：学习助手 */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>AI 学习助手</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <LearningChat userId={DEMO_USER_ID} />
            </CardContent>
          </Card>
        </div>

        {/* 右侧：快速添加 */}
        <div>
          <QuickAdd userId={DEMO_USER_ID} onAdded={handleContentAdded} />
        </div>
      </div>
    </div>
  );
}

