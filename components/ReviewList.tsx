'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import {
  getContentTypeName,
  getMasteryLevelText,
  getMasteryLevelColor,
} from '@/lib/utils';
import type { ReviewItem } from '@/types';

interface ReviewListProps {
  userId: string;
}

export default function ReviewList({ userId }: ReviewListProps) {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviewItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/learning/review?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setReviewItems(data.reviewItems);
      }
    } catch (error) {
      console.error('Error fetching review items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewItems();
  }, [userId]);

  const handleMarkReviewed = async (chunkId: string, currentLevel: number) => {
    try {
      const newLevel = Math.min(currentLevel + 1, 5);
      const response = await fetch('/api/learning/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          chunkId,
          masteryLevel: newLevel,
        }),
      });

      if (response.ok) {
        setReviewItems(reviewItems.filter((item) => item.chunkId !== chunkId));
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return '';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高优先级';
      case 'medium':
        return '中优先级';
      case 'low':
        return '低优先级';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reviewItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p className="text-lg font-medium">太棒了！</p>
          <p className="text-sm text-muted-foreground mt-2">
            目前没有需要复习的内容
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          待复习内容 ({reviewItems.length})
        </h3>
      </div>

      <div className="space-y-3">
        {reviewItems.map((item) => (
          <Card key={item.chunkId} className={getPriorityColor(item.priority)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      {getContentTypeName(item.contentType)}
                    </Badge>
                    <Badge variant="outline">{getPriorityLabel(item.priority)}</Badge>
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    掌握程度：
                    <span className={getMasteryLevelColor(item.masteryLevel)}>
                      {getMasteryLevelText(item.masteryLevel)}
                    </span>
                  </p>
                  <p>距上次复习：{item.daysSinceReview} 天</p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    handleMarkReviewed(item.chunkId, item.masteryLevel)
                  }
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  标记已复习
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

