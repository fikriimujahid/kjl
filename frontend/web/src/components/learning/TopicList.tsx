"use client";

import { useState } from "react";
import Link from "next/link";
import type { Topic, Session } from "@/lib/types";
import { mockSessions } from "@/lib/mock-data";

interface TopicListProps {
  topics: Topic[];
  productId: string;
}

interface TopicItemProps {
  topic: Topic;
  sessions: Session[];
  productId: string;
}

function TopicItem({ topic, sessions, productId }: TopicItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{topic.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sessions.length} sesi</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {sessions.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400">Belum ada sesi tersedia.</p>
          ) : (
            sessions.map((session, idx) => (
              <Link
                key={session.id}
                href={`/my-learning/${productId}/${topic.id}/${session.id}`}
                className="flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-primary-50 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-500 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700 group-hover:text-primary-700 font-medium">
                    {session.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">{session.questionCount} soal</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function TopicList({ topics, productId }: TopicListProps) {
  return (
    <div className="flex flex-col gap-3">
      {topics.map((topic) => {
        const sessions = mockSessions.filter((s) => s.topicId === topic.id);
        return (
          <TopicItem
            key={topic.id}
            topic={topic}
            sessions={sessions}
            productId={productId}
          />
        );
      })}
    </div>
  );
}
