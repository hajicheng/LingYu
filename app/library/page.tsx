'use client';

import { useState } from 'react';
import ContentList from '@/components/ContentList';
import QuickAdd from '@/components/QuickAdd';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID || '00000000-0000-0000-0000-000000000001';

export default function LibraryPage() {
  const [refresh, setRefresh] = useState(0);

  const handleContentAdded = () => {
    setRefresh(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">我的知识库</h1>
        <p className="text-muted-foreground">
          管理你的学习内容，包括单词、语法、笔记和例句
        </p>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">内容列表</TabsTrigger>
          <TabsTrigger value="add">添加内容</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <ContentList userId={DEMO_USER_ID} refresh={refresh} />
        </TabsContent>

        <TabsContent value="add" className="max-w-2xl">
          <QuickAdd userId={DEMO_USER_ID} onAdded={handleContentAdded} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

