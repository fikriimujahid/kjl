'use client';

import { RequireAuth } from '@/components/RequireAuth';

export default function Course() {
  return (
    <RequireAuth>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Course Page</h1>
        <p>Welcome to the course page! Here you can find all your courses and materials.</p>
      </div>
    </RequireAuth>
  );
}