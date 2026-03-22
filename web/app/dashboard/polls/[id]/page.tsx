"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Vote, Calendar, Sparkles, CheckCircle2, Clock, ArrowLeft, Lock } from "lucide-react";
import { api, type Poll } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";

export default function PollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pollId = Number(params.id);
  const isDeptHead = user?.role === "dept_head";

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.getPoll(pollId)
      .then((p) => {
        setPoll(p);
        // Pre-select options the user already voted for
        const voted = new Set<number>();
        p.options.forEach((opt) => {
          if (opt.voted_by_me) voted.add(opt.id);
        });
        setSelectedOptions(voted);
      })
      .catch(() => toast.error("Failed to load poll"))
      .finally(() => setLoading(false));
  }, [pollId]);

  const toggleOption = (optionId: number) => {
    if (poll?.status !== "open") return;
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  };

  const handleVote = async () => {
    if (selectedOptions.size === 0) {
      toast.error("Select at least one option");
      return;
    }
    setVoting(true);
    try {
      const updated = await api.votePoll(pollId, Array.from(selectedOptions));
      setPoll(updated);
      toast.success("Vote recorded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      const updated = await api.closePoll(pollId);
      setPoll(updated);
      toast.success("Poll closed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to close poll");
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-3xl mx-auto py-8 text-center">
        <p className="text-xl font-bold text-navy-500">Poll not found</p>
        <Button onClick={() => router.push("/dashboard/polls")} variant="ghost" className="mt-4">
          Back to Polls
        </Button>
      </div>
    );
  }

  const totalVotes = poll.options.reduce((sum, o) => sum + o.vote_count, 0);
  const hasVoted = poll.options.some((o) => o.voted_by_me);
  const sortedOptions = [...poll.options].sort((a, b) => b.vote_count - a.vote_count);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <button
        onClick={() => router.push("/dashboard/polls")}
        className="flex items-center gap-2 text-navy-500 hover:text-navy-700 font-bold mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Polls
      </button>

      {/* Poll header */}
      <div className="rounded-[2rem] bg-white p-8 border-4 border-navy-900 shadow-playful mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {poll.type === "date" ? (
              <Calendar className="h-5 w-5 text-blue-500" />
            ) : (
              <Sparkles className="h-5 w-5 text-orange-500" />
            )}
            <span className="text-sm font-bold text-navy-500 uppercase">{poll.type} poll</span>
          </div>
          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 ${
            poll.status === "open"
              ? "border-green-600 bg-green-50 text-green-700"
              : "border-navy-300 bg-navy-50 text-navy-500"
          }`}>
            {poll.status === "open" ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {poll.status === "open" ? "Open" : "Closed"}
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold text-navy-900 mb-2">{poll.title}</h1>
        <p className="text-sm text-navy-500">
          Created by {poll.created_by_name} · {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
          {poll.closes_at && ` · Closes ${new Date(poll.closes_at).toLocaleDateString()}`}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {sortedOptions.map((opt) => {
          const pct = totalVotes > 0 ? (opt.vote_count / totalVotes) * 100 : 0;
          const isSelected = selectedOptions.has(opt.id);
          const isWinning = sortedOptions[0].id === opt.id && totalVotes > 0;

          return (
            <button
              key={opt.id}
              onClick={() => toggleOption(opt.id)}
              disabled={poll.status !== "open"}
              className={`w-full text-left rounded-[1.5rem] p-5 border-4 transition-all ${
                isSelected
                  ? "border-purple-500 bg-purple-50 shadow-playful"
                  : "border-navy-200 bg-white hover:border-navy-400"
              } ${poll.status !== "open" ? "cursor-default" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-purple-500 bg-purple-500" : "border-navy-300"
                  }`}>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </div>
                  <span className="font-bold text-navy-900">{opt.label}</span>
                  {isWinning && poll.status === "closed" && (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Winner</span>
                  )}
                </div>
                <span className="font-bold text-navy-700">
                  {opt.vote_count} vote{opt.vote_count !== 1 ? "s" : ""}
                  {totalVotes > 0 && <span className="text-navy-400 ml-1">({pct.toFixed(0)}%)</span>}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-3 rounded-full bg-navy-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isSelected ? "bg-purple-400" : isWinning ? "bg-green-400" : "bg-blue-300"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {poll.status === "open" && (
          <Button onClick={handleVote} loading={voting} size="lg" disabled={selectedOptions.size === 0}>
            {hasVoted ? "Update Vote" : "Cast Vote"}
          </Button>
        )}

        {poll.status === "open" && isDeptHead && (
          <Button onClick={handleClose} loading={closing} variant="outline" size="lg">
            <Lock className="h-4 w-4 mr-1" /> Close Poll
          </Button>
        )}

        {poll.status === "closed" && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-navy-100 text-navy-500 font-bold">
            <Lock className="h-4 w-4" /> This poll is closed
          </div>
        )}
      </div>
    </div>
  );
}
