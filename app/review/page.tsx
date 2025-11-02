'use client';

import ReviewList from '@/components/ReviewList';

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID || '00000000-0000-0000-0000-000000000001';

export default function ReviewPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">复习中心</h1>
        <p className="text-muted-foreground">
          基于遗忘曲线，为你推荐需要复习的学习内容
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <ReviewList userId={DEMO_USER_ID} />
      </div>
    </div>
  );
}

