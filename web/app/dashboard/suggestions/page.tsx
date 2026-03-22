"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ThumbsUp, Plus, Search, ArrowUpRight } from "lucide-react";
import { api, type Team, type ExperienceSuggestion, type ExperienceListItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "sonner";

export default function SuggestionsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<ExperienceSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Search & suggest
  const [showSuggest, setShowSuggest] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExperienceListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggestMessage, setSuggestMessage] = useState("");

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
    setLoadingSuggestions(true);
    api.getTeamSuggestions(selectedTeam)
      .then((d) => setSuggestions(d.results))
      .catch(() => {})
      .finally(() => setLoadingSuggestions(false));
  }, [selectedTeam]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await api.getExperiences({ q: searchQuery.trim() });
      setSearchResults(data.results || []);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSuggest = async (experienceId: number) => {
    if (!selectedTeam) return;
    try {
      const suggestion = await api.suggestExperience(selectedTeam, experienceId, suggestMessage);
      setSuggestions((prev) => [suggestion, ...prev]);
      setSearchResults([]);
      setSearchQuery("");
      setSuggestMessage("");
      setShowSuggest(false);
      toast.success("Experience suggested to your team!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to suggest");
    }
  };

  const handleUpvote = async (suggestion: ExperienceSuggestion) => {
    try {
      if (suggestion.upvoted_by_me) {
        const updated = await api.removeUpvote(suggestion.id);
        setSuggestions((prev) =>
          prev.map((s) => (s.id === suggestion.id ? updated : s))
        );
      } else {
        const updated = await api.upvoteSuggestion(suggestion.id);
        setSuggestions((prev) =>
          prev.map((s) => (s.id === suggestion.id ? updated : s))
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update vote");
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
          icon={<Sparkles className="h-7 w-7" />}
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
          <h1 className="font-display text-5xl font-bold text-navy-900">Suggestions</h1>
          <p className="text-lg font-bold text-navy-500 mt-2">
            Suggest experiences for your team and upvote your favourites
          </p>
        </div>
        <Button onClick={() => setShowSuggest(!showSuggest)} variant={showSuggest ? "ghost" : "secondary"}>
          {showSuggest ? "Cancel" : <><Plus className="h-4 w-4 mr-1" /> Suggest</>}
        </Button>
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
                  ? "bg-orange-400 text-navy-900 shadow-playful"
                  : "bg-white text-navy-700 hover:bg-navy-50"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Suggest experience panel */}
      {showSuggest && (
        <div className="rounded-[2rem] bg-orange-100 p-6 border-4 border-navy-900 shadow-playful mb-8 mt-6">
          <h2 className="font-bold text-xl text-navy-900 mb-4">Suggest an Experience</h2>

          <div className="flex gap-3 mb-4">
            <Input
              placeholder="Search experiences..."
              leftIcon={<Search className="h-4 w-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} loading={searching}>
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3 mb-4">
              <Input
                placeholder="Add a message (optional) — why should the team try this?"
                value={suggestMessage}
                onChange={(e) => setSuggestMessage(e.target.value)}
              />
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {searchResults.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-navy-200 hover:border-navy-400 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {exp.cover_image && (
                        <img
                          src={exp.cover_image}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover border-2 border-navy-200 flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-navy-900 truncate">{exp.title}</p>
                        <p className="text-sm text-navy-500">
                          {exp.city} · €{parseFloat(exp.price_per_person).toFixed(0)}/person
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSuggest(exp.id)}
                    >
                      Suggest
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searching && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          )}
        </div>
      )}

      {/* Suggestions list */}
      {loadingSuggestions ? (
        <div className="space-y-4 mt-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Sparkles className="h-7 w-7" />}
            title="No suggestions yet"
            description="Be the first to suggest an experience for your team!"
            action={{
              label: "Suggest an Experience",
              onClick: () => setShowSuggest(true),
            }}
          />
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {suggestions
            .sort((a, b) => b.upvote_count - a.upvote_count)
            .map((s) => (
              <div
                key={s.id}
                className="rounded-[2rem] bg-white p-6 border-4 border-navy-900 shadow-playful"
              >
                <div className="flex items-start gap-4">
                  {/* Upvote button */}
                  <button
                    onClick={() => handleUpvote(s)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all ${
                      s.upvoted_by_me
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-navy-200 bg-white text-navy-500 hover:border-navy-400"
                    }`}
                  >
                    <ThumbsUp className={`h-5 w-5 ${s.upvoted_by_me ? "fill-current" : ""}`} />
                    <span className="text-sm font-bold">{s.upvote_count}</span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-bold text-xl text-navy-900 truncate">{s.experience_title}</h3>
                        <p className="text-sm text-navy-500 mt-1">
                          €{parseFloat(s.experience_price).toFixed(0)}/person
                        </p>
                      </div>
                      <Link
                        href={`/experiences/${s.experience_slug}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-navy-50 text-navy-700 text-sm font-bold hover:bg-navy-100 transition-colors flex-shrink-0"
                      >
                        View <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>

                    {s.message && (
                      <p className="mt-3 text-navy-700 bg-navy-50 p-3 rounded-xl text-sm">
                        &ldquo;{s.message}&rdquo;
                      </p>
                    )}

                    <p className="mt-3 text-xs text-navy-400">
                      Suggested by {s.suggested_by_detail.first_name} {s.suggested_by_detail.last_name} · {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Cover image */}
                  {s.experience_cover_image && (
                    <img
                      src={s.experience_cover_image}
                      alt=""
                      className="h-20 w-20 rounded-xl object-cover border-2 border-navy-200 flex-shrink-0 hidden sm:block"
                    />
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
