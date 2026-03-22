"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Trash2, UserPlus } from "lucide-react";
import { api, type Department, type Team, type OrganisationMember } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";

export default function TeamsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [members, setMembers] = useState<OrganisationMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getDepartments().then((d) => {
        setDepartments(d.results);
        if (d.results.length > 0) setSelectedDept(d.results[0].id);
      }),
      api.getOrgTeam().then((d) => setMembers(d.results)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDept) return;
    setLoadingTeams(true);
    api.getTeams(selectedDept)
      .then((d) => setTeams(d.results))
      .catch(() => {})
      .finally(() => setLoadingTeams(false));
  }, [selectedDept]);

  const handleCreateTeam = async () => {
    if (!selectedDept || !newTeamName.trim()) return;
    try {
      const team = await api.createTeam(selectedDept, newTeamName.trim());
      setTeams((prev) => [...prev, team]);
      setNewTeamName("");
      toast.success("Team created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create team");
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!selectedDept) return;
    try {
      await api.deleteTeam(selectedDept, teamId);
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      toast.success("Team deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete team");
    }
  };

  const handleAddMember = async (teamId: number, userId: number) => {
    if (!selectedDept) return;
    try {
      await api.addTeamMember(selectedDept, teamId, userId);
      // Refresh teams
      const d = await api.getTeams(selectedDept);
      setTeams(d.results);
      toast.success("Member added!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    }
  };

  const handleRemoveMember = async (teamId: number, userId: number) => {
    if (!selectedDept) return;
    try {
      await api.removeTeamMember(selectedDept, teamId, userId);
      const d = await api.getTeams(selectedDept);
      setTeams(d.results);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !selectedDept) return;
    setInviting(true);
    try {
      // Find a team to assign to (first team) or just invite to dept
      const targetTeam = teams.length > 0 ? teams[0].id : undefined;
      await api.inviteTeamMember({
        email: inviteEmail.trim(),
        target_role: "member",
        target_department_id: selectedDept,
        target_team_id: targetTeam,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite");
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="font-display text-5xl font-bold text-navy-900 mb-2">My Teams</h1>
      <p className="text-lg font-bold text-navy-500 mb-8">Create teams and manage members within your department</p>

      {/* Department selector */}
      {departments.length > 1 && (
        <div className="flex gap-2 mb-8 flex-wrap">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-4 py-2 rounded-full font-bold border-2 border-navy-900 transition-all ${
                selectedDept === dept.id
                  ? "bg-blue-400 text-navy-900 shadow-playful"
                  : "bg-white text-navy-700 hover:bg-navy-50"
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      )}

      {/* Invite member */}
      <div className="rounded-[2rem] bg-white p-6 border-4 border-navy-900 shadow-playful mb-8">
        <h2 className="font-bold text-xl text-navy-900 mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5" /> Invite Team Member
        </h2>
        <div className="flex gap-3">
          <Input
            placeholder="email@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleInvite} loading={inviting} disabled={!inviteEmail.trim()}>
            Send Invite
          </Button>
        </div>
      </div>

      {/* Create team */}
      <div className="rounded-[2rem] bg-light-green-100 p-6 border-4 border-navy-900 shadow-playful mb-8">
        <h2 className="font-bold text-xl text-navy-900 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" /> Create New Team
        </h2>
        <div className="flex gap-3">
          <Input
            placeholder="Team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
          />
          <Button onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
            Create
          </Button>
        </div>
      </div>

      {/* Teams list */}
      {loadingTeams ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-[2rem] bg-navy-50 p-12 text-center border-4 border-navy-200">
          <Users className="h-12 w-12 text-navy-300 mx-auto mb-4" />
          <p className="text-xl font-bold text-navy-400">No teams yet</p>
          <p className="text-navy-400 mt-2">Create your first team above</p>
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map((team) => (
            <div key={team.id} className="rounded-[2rem] bg-white p-6 border-4 border-navy-900 shadow-playful">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-2xl text-navy-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  {team.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-navy-500">{team.member_count} members</span>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Members */}
              <div className="space-y-2">
                {team.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-navy-50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center font-bold text-sm text-navy-900">
                        {m.user_detail.first_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-navy-900">{m.user_detail.first_name} {m.user_detail.last_name}</p>
                        <p className="text-xs text-navy-500">{m.user_detail.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(team.id, m.user_detail.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Add existing org member */}
              {members.filter((m) => !team.members.some((tm) => tm.user_detail.id === m.user_id)).length > 0 && (
                <div className="mt-4 pt-4 border-t border-navy-200">
                  <p className="text-sm font-bold text-navy-500 mb-2">Add from organisation:</p>
                  <div className="flex flex-wrap gap-2">
                    {members
                      .filter((m) => !team.members.some((tm) => tm.user_detail.id === m.user_id))
                      .slice(0, 5)
                      .map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleAddMember(team.id, m.user_id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 border border-blue-200"
                        >
                          <Plus className="h-3 w-3" />
                          {m.first_name} {m.last_name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
