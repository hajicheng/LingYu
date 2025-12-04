'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Loader2 } from 'lucide-react';
import { getContentTypeName, formatRelativeTime } from '@/lib/utils';
import type { LearningChunk, ContentType } from '@/types';

interface ContentListProps {
  userId: string;
  refresh?: number;
}

export default function ContentList({ userId, refresh = 0 }: ContentListProps) {
  const [contents, setContents] = useState<LearningChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');

  const fetchContents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ userId, limit: '50' });
      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      const response = await fetch(`/api/learning/content?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContents(data.contents);
      }
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [userId, filterType, refresh]);

  const handleDelete = async (chunkId: string) => {
    if (!confirm('确定要删除这个学习内容吗？')) return;

    try {
      const params = new URLSearchParams({ userId, chunkId });
      const response = await fetch(`/api/learning/content?${params}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setContents(contents.filter((c) => c.id !== chunkId));
      } else {
        alert('删除失败，请重试');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('删除失败，请重试');
    }
  };

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">类型筛选：</label>
        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as ContentType | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="vocabulary">{getContentTypeName('vocabulary')}</SelectItem>
            <SelectItem value="grammar">{getContentTypeName('grammar')}</SelectItem>
            <SelectItem value="note">{getContentTypeName('note')}</SelectItem>
            <SelectItem value="example">{getContentTypeName('example')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 内容列表 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : contents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>暂无学习内容</p>
            <p className="text-sm mt-2">开始添加你的第一个学习内容吧！</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contents.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        {getContentTypeName(item.content_type)}
                      </Badge>
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-base">
                      <p className="whitespace-pre-wrap">{item.content}</p>
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  添加于 {formatRelativeTime(item.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

