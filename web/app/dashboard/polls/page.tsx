"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Vote, Plus, Calendar, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { api, type Poll, type Team } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "sonner";

export default function PollsPage() {
  const { user } = useAuth();
  const isDeptHead = user?.role === "dept_head";

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPolls, setLoadingPolls] = useState(false);

  // Create poll form
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"date" | "experience">("experience");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.getMyTeams()
      .then((d) => {
        setTeams(d.results);
        if (d.results.length > 0) setSelectedTeam(d.results[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;
    setLoadingPolls(true);
    api.getTeamPolls(selectedTeam)
      .then((d) => setPolls(d.results))
      .catch(() => {})
      .finally(() => setLoadingPolls(false));
  }, [selectedTeam]);

  const handleCreatePoll = async () => {
    if (!selectedTeam || !newTitle.trim()) return;
    const validOptions = newOptions.filter((o) => o.trim());
    if (validOptions.length < 2) {
      toast.error("Add at least 2 options");
      return;
    }
    setCreating(true);
    try {
      const poll = await api.createPoll(selectedTeam, {
        title: newTitle.trim(),
        type: newType,
        options: validOptions.map((label) => ({ label: label.trim() })),
      });
      setPolls((prev) => [poll, ...prev]);
      setNewTitle("");
      setNewOptions(["", ""]);
      setShowCreate(false);
      toast.success("Poll created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create poll");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <EmptyState
          icon={<Vote className="h-7 w-7" />}
          title="No teams found"
          description="You're not part of any teams yet. Ask your department head to add you."
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="font-display text-5xl font-bold text-navy-900">Polls</h1>
          <p className="text-lg font-bold text-navy-500 mt-2">
            {isDeptHead ? "Create polls for your team to vote on" : "Vote on team activities and dates"}
          </p>
        </div>
        {isDeptHead && (
          <Button onClick={() => setShowCreate(!showCreate)} variant={showCreate ? "ghost" : "primary"}>
            {showCreate ? "Cancel" : <><Plus className="h-4 w-4 mr-1" /> New Poll</>}
          </Button>
        )}
      </div>

      {/* Team selector */}
      {teams.length > 1 && (
        <div className="flex gap-2 mb-8 mt-6 flex-wrap">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTeam(t.id)}
              className={`px-4 py-2 rounded-full font-bold border-2 border-navy-900 transition-all ${
                selectedTeam === t.id
                  ? "bg-purple-400 text-navy-900 shadow-playful"
                  : "bg-white text-navy-700 hover:bg-navy-50"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Create poll form */}
      {showCreate && (
        <div className="rounded-[2rem] bg-purple-100 p-6 border-4 border-navy-900 shadow-playful mb-8 mt-6">
          <h2 className="font-bold text-xl text-navy-900 mb-4">Create New Poll</h2>
          <div className="space-y-4">
            <Input
              label="Question"
              placeholder="What experience should we do next?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <div>
              <label className="block text-sm font-bold text-navy-700 mb-2">Poll Type</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setNewType("experience")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold border-2 border-navy-900 transition-all ${
                    newType === "experience" ? "bg-orange-400 shadow-playful" : "bg-white hover:bg-navy-50"
                  }`}
                >
                  <Sparkles className="h-4 w-4" /> Experience
                </button>
                <button
                  onClick={() => setNewType("date")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold border-2 border-navy-900 transition-all ${
                    newType === "date" ? "bg-blue-400 shadow-playful" : "bg-white hover:bg-navy-50"
                  }`}
                >
                  <Calendar className="h-4 w-4" /> Date
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-navy-700 mb-2">Options</label>
              <div className="space-y-2">
                {newOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...newOptions];
                        updated[i] = e.target.value;
                        setNewOptions(updated);
                      }}
                      className="flex-1"
                    />
                    {newOptions.length > 2 && (
                      <button
                        onClick={() => setNewOptions(newOptions.filter((_, j) => j !== i))}
                        className="text-red-500 text-sm font-bold px-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {newOptions.length < 6 && (
                <button
                  onClick={() => setNewOptions([...newOptions, ""])}
                  className="mt-2 text-sm font-bold text-blue-600 hover:text-blue-800"
                >
                  + Add option
                </button>
              )}
            </div>

            <Button onClick={handleCreatePoll} loading={creating} disabled={!newTitle.trim()}>
              Create Poll
            </Button>
          </div>
        </div>
      )}

      {/* Poll list */}
      {loadingPolls ? (
        <div className="space-y-4 mt-6">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div>
      ) : polls.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Vote className="h-7 w-7" />}
            title="No polls yet"
            description={isDeptHead ? "Create your first poll to get team input!" : "No active polls from your team lead."}
          />
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {polls.map((poll) => (
            <Link
              key={poll.id}
              href={`/dashboard/polls/${poll.id}`}
              className="block rounded-[2rem] bg-white p-6 border-4 border-navy-900 shadow-playful transition-all hover:-translate-y-1 hover:shadow-playful-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {poll.type === "date" ? (
                      <Calendar className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-orange-500" />
                    )}
                    <span className="text-xs font-bold text-navy-500 uppercase">{poll.type} poll</span>
                  </div>
                  <h3 className="font-bold text-xl text-navy-900">{poll.title}</h3>
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

              {/* Mini results preview */}
              <div className="space-y-2">
                {poll.options.slice(0, 3).map((opt) => {
                  const maxVotes = Math.max(...poll.options.map((o) => o.vote_count), 1);
                  const pct = (opt.vote_count / maxVotes) * 100;
                  return (
                    <div key={opt.id} className="flex items-center gap-3">
                      <div className="flex-1 h-6 rounded-full bg-navy-100 overflow-hidden border border-navy-200">
                        <div
                          className={`h-full rounded-full transition-all ${opt.voted_by_me ? "bg-purple-400" : "bg-blue-300"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-navy-700 w-24 truncate">{opt.label}</span>
                      <span className="text-sm font-bold text-navy-500 w-8 text-right">{opt.vote_count}</span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-sm font-medium text-navy-400">
                {poll.total_votes} vote{poll.total_votes !== 1 ? "s" : ""} · by {poll.created_by_name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
