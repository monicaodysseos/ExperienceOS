"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { api, type Conversation } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getConversations()
      .then((d) => setConversations(d.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl font-bold text-navy-900 title-shadow">Messages</h1>
      <p className="mt-2 text-lg font-bold text-navy-500">Your conversations</p>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-7 w-7" />}
          title="No messages yet"
          description="When you contact a host or receive a message, it will appear here."
          className="mt-8"
        />
      ) : (
        <div className="mt-8 space-y-4">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/dashboard/messages/${conv.id}`}
              className="flex items-center gap-4 rounded-[2.5rem] border-4 border-navy-900 bg-white p-6 transition-all shadow-playful hover:shadow-playful-hover hover:-translate-y-1"
            >
              <Avatar name={conv.other_user_name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-navy-900">
                    {conv.other_user_name}
                  </h3>
                  <span className="text-sm font-bold text-navy-400">
                    {getRelativeTime(conv.last_message_at)}
                  </span>
                </div>
                {conv.experience_title && (
                  <p className="text-sm font-bold text-blue-500 mt-1">
                    {conv.experience_title}
                  </p>
                )}
                <p className="mt-2 text-base font-bold text-navy-500 truncate">
                  {conv.last_message || "No messages yet"}
                </p>
              </div>
              {conv.unread_count > 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400 text-navy-900 font-bold border-2 border-navy-900 shadow-sm">
                  {conv.unread_count}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
