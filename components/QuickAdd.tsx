'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { getContentTypeName } from '@/lib/utils';
import type { ContentType } from '@/types';

interface QuickAddProps {
  userId: string;
  onAdded?: () => void;
}

export default function QuickAdd({ userId, onAdded }: QuickAddProps) {
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<ContentType>('vocabulary');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/learning/add-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          content: content.trim(),
          contentType,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (response.ok) {
        setContent('');
        setTags('');
        onAdded?.();
      } else {
        alert('添加失败，请重试');
      }
    } catch (error) {
      console.error('Error adding content:', error);
      alert('添加失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>快速添加</CardTitle>
        <CardDescription>添加新的学习内容到知识库</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">内容类型</label>
            <Select
              value={contentType}
              onValueChange={(value) => setContentType(value as ContentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vocabulary">
                  {getContentTypeName('vocabulary')}
                </SelectItem>
                <SelectItem value="grammar">
                  {getContentTypeName('grammar')}
                </SelectItem>
                <SelectItem value="note">
                  {getContentTypeName('note')}
                </SelectItem>
                <SelectItem value="example">
                  {getContentTypeName('example')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">学习内容</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={getPlaceholder(contentType)}
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">标签（用逗号分隔）</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例如：基础, 日常用语"
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={isLoading || !content.trim()} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                添加中...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                添加到知识库
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function getPlaceholder(type: ContentType): string {
  const placeholders: Record<ContentType, string> = {
    vocabulary: '例如：Hello - 你好\n发音：/həˈloʊ/\n例句：Hello, how are you?',
    grammar: '例如：过去式规则：一般动词加 -ed\n例如：walk → walked',
    note: '输入你的学习笔记...',
    example: '例如：How are you? - 你好吗？\n回答：I\'m fine, thank you.',
  };
  return placeholders[type];
}

