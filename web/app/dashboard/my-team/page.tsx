"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Vote, Sparkles, UserCircle2, ArrowRight } from "lucide-react";
import { api, type Team, type Poll, type ExperienceSuggestion } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function MyTeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [suggestions, setSuggestions] = useState<ExperienceSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyTeams()
      .then(async (d) => {
        setTeams(d.results);
        // Load polls and suggestions for all teams
        const allPolls: Poll[] = [];
        const allSuggestions: ExperienceSuggestion[] = [];
        await Promise.all(
          d.results.map(async (team) => {
            const [p, s] = await Promise.all([
              api.getTeamPolls(team.id).catch(() => ({ results: [] })),
              api.getTeamSuggestions(team.id).catch(() => ({ results: [] })),
            ]);
            allPolls.push(...p.results);
            allSuggestions.push(...s.results);
          })
        );
        setPolls(allPolls.filter((p) => p.status === "open"));
        setSuggestions(allSuggestions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No team yet"
          description="You haven't been added to a team. Ask your department head to add you."
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="font-display text-5xl font-bold text-navy-900 mb-2">My Team</h1>
      <p className="text-lg font-bold text-navy-500 mb-8">See your teammates and team activity</p>

      {/* Teams and members */}
      {teams.map((team) => (
        <div key={team.id} className="rounded-[2rem] bg-white p-6 border-4 border-navy-900 shadow-playful mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-2xl text-navy-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              {team.name}
            </h2>
            <span className="text-sm font-bold text-navy-500 bg-navy-100 px-3 py-1 rounded-full">
              {team.member_count} member{team.member_count !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {team.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-navy-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-200 border-2 border-navy-900 text-navy-900">
                  {m.user_detail.avatar_url ? (
                    <img src={m.user_detail.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <UserCircle2 className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-navy-900">
                    {m.user_detail.first_name} {m.user_detail.last_name}
                  </p>
                  <p className="text-xs text-navy-500">{m.user_detail.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Active Polls */}
      {polls.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-3xl font-bold text-navy-900">Active Polls</h2>
            <Link
              href="/dashboard/polls"
              className="flex items-center gap-1 text-sm font-bold text-navy-600 hover:text-navy-900 transition-colors"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {polls.slice(0, 3).map((poll) => (
              <Link
                key={poll.id}
                href={`/dashboard/polls/${poll.id}`}
                className="flex items-center justify-between rounded-[2rem] bg-purple-50 p-5 border-4 border-navy-900 shadow-playful transition-all hover:-translate-y-1 hover:shadow-playful-hover"
              >
                <div className="flex items-center gap-3">
                  <Vote className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-bold text-navy-900">{poll.title}</p>
                    <p className="text-sm text-navy-500">
                      {poll.total_votes} vote{poll.total_votes !== 1 ? "s" : ""} · {poll.options.length} options
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-navy-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-3xl font-bold text-navy-900">Recent Suggestions</h2>
            <Link
              href="/dashboard/suggestions"
              className="flex items-center gap-1 text-sm font-bold text-navy-600 hover:text-navy-900 transition-colors"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {suggestions.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-[2rem] bg-orange-50 p-5 border-4 border-navy-900 shadow-playful"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-bold text-navy-900">{s.experience_title}</p>
                    <p className="text-sm text-navy-500">
                      by {s.suggested_by_detail.first_name} · {s.upvote_count} upvote{s.upvote_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/dashboard/suggestions"
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-orange-400 text-navy-900 font-bold border-4 border-navy-900 shadow-playful hover:-translate-y-1 transition-all hover:shadow-playful-hover"
        >
          <Sparkles className="h-4 w-4" /> Suggest an Experience
        </Link>
        <Link
          href="/dashboard/polls"
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-purple-400 text-navy-900 font-bold border-4 border-navy-900 shadow-playful hover:-translate-y-1 transition-all hover:shadow-playful-hover"
        >
          <Vote className="h-4 w-4" /> Vote on Polls
        </Link>
      </div>
    </div>
  );
}
