"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { api, type Message } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const convId = Number(id);

  const loadMessages = useCallback(() => {
    if (isNaN(convId)) return;
    api
      .getMessages(convId)
      .then((d) => setMessages(d.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [convId]);

  useEffect(() => {
    if (isNaN(convId)) return;
    loadMessages();
    api.markConversationRead(convId).catch(() => {});
  }, [convId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const msg = await api.sendMessage(convId, input.trim());
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-navy-200 pb-4">
        <Link
          href="/dashboard/messages"
          className="rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-600 lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="font-semibold text-navy-900">Conversation</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="text-teal-600" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-navy-400">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.is_mine ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.is_mine
                    ? "bg-teal-700 text-white rounded-br-md"
                    : "bg-navy-100 text-navy-800 rounded-bl-md"
                )}
              >
                <p>{msg.content}</p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    msg.is_mine ? "text-teal-200" : "text-navy-400"
                  )}
                >
                  {new Date(msg.created_at).toLocaleTimeString("en-CY", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 border-t border-navy-200 pt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder-navy-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
