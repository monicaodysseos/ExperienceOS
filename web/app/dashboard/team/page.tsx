"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Mail, Building2, Crown, UserCircle2, Wallet, Plus, X, Copy, Check, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { api, type OrganisationMember, type Organisation, type Department } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { QRCodeSVG } from "qrcode.react";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type InviteForm = z.infer<typeof inviteSchema>;

const createOrgSchema = z.object({
  name: z.string().min(2, "Organisation name is required"),
  billing_email: z.string().email("Enter a valid billing email"),
  domain: z.string().optional(),
});
type CreateOrgForm = z.infer<typeof createOrgSchema>;

export default function TeamPage() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Organisation | null>(null);
  const [members, setMembers] = useState<OrganisationMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingOrg, setLoadingOrg] = useState(true);
  
  // UI states
  const [inviting, setInviting] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [showCreateDept, setShowCreateDept] = useState(false);
  const [creatingDept, setCreatingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptHead, setNewDeptHead] = useState<number | undefined>(undefined);
  const [newDeptBudget, setNewDeptBudget] = useState("");
  
  const [inviteRole, setInviteRole] = useState<'member' | 'dept_head'>('member');
  const [inviteDeptId, setInviteDeptId] = useState<number | undefined>(undefined);
  const [lastInvite, setLastInvite] = useState<{ short_code: string; invite_url: string; email: string; role: string; dept_name?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register: registerInvite,
    handleSubmit: handleInviteSubmit,
    reset: resetInvite,
    formState: { errors: inviteErrors },
  } = useForm<InviteForm>({ resolver: zodResolver(inviteSchema) });

  const {
    register: registerOrg,
    handleSubmit: handleOrgSubmit,
    formState: { errors: orgErrors, isSubmitting: orgSubmitting },
  } = useForm<CreateOrgForm>({
    defaultValues: { billing_email: user?.email || "" },
  });

  useEffect(() => {
    if (!user?.org_id) {
      setLoadingOrg(false);
      return;
    }
    Promise.all([api.getOrg(), api.getOrgTeam(), api.getDepartments().catch(() => ({ results: [] }))])
      .then(([orgData, teamData, deptData]) => {
        setOrg(orgData);
        setMembers(teamData.results || []);
        setDepartments(deptData.results || []);
      })
      .catch(() => {})
      .finally(() => setLoadingOrg(false));
  }, [user?.org_id]);

  const onInvite = async (data: InviteForm) => {
    setInviting(true);
    try {
      const deptName = inviteRole === 'dept_head' && inviteDeptId
        ? departments.find(d => d.id === inviteDeptId)?.name
        : undefined;
      const response = await api.inviteTeamMember({
        email: data.email,
        target_role: inviteRole,
        target_department_id: inviteRole === 'dept_head' ? inviteDeptId : undefined,
      });
      const roleLabel = inviteRole === 'dept_head' ? 'Department Head' : 'Employee';
      toast.success(`Invited ${data.email} as ${roleLabel}`);
      resetInvite();
      if (response.short_code) {
        setLastInvite({
          short_code: response.short_code,
          invite_url: response.invite_url || '',
          email: data.email,
          role: roleLabel,
          dept_name: deptName,
        });
      }
      setInviteRole('member');
      setInviteDeptId(undefined);
      const teamData = await api.getOrgTeam();
      setMembers(teamData.results || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const onCreateOrg = async (data: CreateOrgForm) => {
    try {
      const newOrg = await api.createOrg({
        name: data.name,
        billing_email: data.billing_email,
        domain: data.domain || undefined,
      });
      setOrg(newOrg);
      toast.success("Organisation created!");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create organisation");
    }
  };

  const onCreateDept = async () => {
    if (!newDeptName.trim()) return;
    setCreatingDept(true);
    try {
      const dept = await api.createDepartment({
        name: newDeptName.trim(),
        head: newDeptHead,
        monthly_budget: newDeptBudget ? parseFloat(newDeptBudget) : undefined,
      });
      setDepartments((prev) => [...prev, dept]);
      setNewDeptName("");
      setNewDeptHead(undefined);
      setNewDeptBudget("");
      setShowCreateDept(false);
      toast.success(`Department "${dept.name}" created!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create department");
    } finally {
      setCreatingDept(false);
    }
  };

  if (loadingOrg) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-4">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
      </div>
    );
  }

  // No org — show create form
  if (!org) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] bg-orange-400 text-navy-900 mb-6">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="font-display text-5xl font-bold text-navy-900 ">
          Create your organisation
        </h1>
        <p className="mt-4 text-lg font-bold text-navy-500">
          Set up your company account to invite your team and manage departments.
        </p>

        <form
          onSubmit={handleOrgSubmit(onCreateOrg)}
          className="mt-8 space-y-5 rounded-[2.5rem] bg-white p-8 shadow-playful border-4 border-navy-900"
        >
          <Input
            label="Company name"
            placeholder="Acme Ltd"
            error={orgErrors.name?.message}
            {...registerOrg("name")}
          />
          <Input
            label="Billing email"
            type="email"
            placeholder="billing@company.com"
            error={orgErrors.billing_email?.message}
            {...registerOrg("billing_email")}
          />
          <div>
            <Input
              label="Company domain (optional)"
              placeholder="company.com"
              {...registerOrg("domain")}
            />
            <p className="mt-1 text-xs font-bold text-navy-400">Used to auto-match colleagues when they register</p>
          </div>
          <Button type="submit" loading={orgSubmitting} size="lg" className="w-full text-lg rounded-full border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-teal-400 hover:bg-teal-300 text-navy-900 font-bold transition-all hover:-translate-y-1">
            Create Organisation
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 pb-20">
      
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="font-display text-5xl font-bold text-navy-900 mb-3">Departments & Budget</h1>
        <p className="text-xl font-bold text-navy-500 max-w-2xl leading-relaxed">
          Structure your organisation by creating departments, assigning verified department heads, and allocating team-building budgets.
        </p>
      </div>

      {/* TWO COLUMN LAYOUT: DEPARTMENTS (LEFT) & INVITES/MEMBERS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        
        {/* LEFT COLUMN: DEPARTMENTS */}
        <div className="lg:col-span-4 space-y-8">
          
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-bold text-navy-900 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-500" />
              Departments
            </h2>
            <button
              onClick={() => setShowCreateDept(!showCreateDept)}
              className="flex items-center gap-2 rounded-full border-4 border-navy-900 bg-pink-400 px-5 py-2.5 text-sm font-bold text-navy-900 shadow-playful hover:-translate-y-1 hover:shadow-playful-hover transition-all"
            >
              {showCreateDept ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {showCreateDept ? "Cancel" : "New Department"}
            </button>
          </div>

          {/* CREATE DEPARTMENT HIGHLIGHT CARD */}
          {showCreateDept && (
            <div className="rounded-[2.5rem] bg-pink-50 border-4 border-navy-900 shadow-playful p-8 animate-in mt-4 slide-in-from-top-4 fade-in duration-300">
              <h3 className="font-display text-2xl font-bold text-navy-900 mb-6">Create New Department</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-extrabold text-navy-900 mb-2 uppercase tracking-wide">Department Name</label>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g. Marketing, Engineering, Sales"
                    className="w-full rounded-2xl border-4 border-navy-900 bg-white px-5 py-4 text-lg font-bold text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-4 focus:ring-pink-200 transition-all shadow-[2px_2px_0_theme(colors.navy.900)]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-extrabold text-navy-900 mb-2 uppercase tracking-wide">Appoint Head</label>
                    <select
                      value={newDeptHead ?? ""}
                      onChange={(e) => setNewDeptHead(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full rounded-2xl border-4 border-navy-900 bg-white px-4 py-4 text-base font-bold text-navy-700 focus:outline-none focus:ring-4 focus:ring-pink-200 transition-all shadow-[2px_2px_0_theme(colors.navy.900)] cursor-pointer"
                    >
                      <option value="">Select an employee...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.user_id}>
                          {m.first_name} {m.last_name} ({m.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-extrabold text-navy-900 mb-2 uppercase tracking-wide">Monthly Budget</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-navy-900">€</span>
                      <input
                        type="number"
                        value={newDeptBudget}
                        onChange={(e) => setNewDeptBudget(e.target.value)}
                        placeholder="5,000"
                        className="w-full rounded-2xl border-4 border-navy-900 bg-white pl-10 pr-5 py-4 text-lg font-bold text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-4 focus:ring-pink-200 transition-all shadow-[2px_2px_0_theme(colors.navy.900)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t-4 border-navy-900/10 flex justify-end">
                  <Button
                    onClick={onCreateDept}
                    loading={creatingDept}
                    disabled={!newDeptName.trim()}
                    size="lg"
                    className="rounded-full px-8 py-6 text-lg border-4 border-navy-900 bg-blue-400 text-navy-900 font-bold shadow-playful hover:-translate-y-1 hover:shadow-playful-hover transition-all"
                  >
                    Launch Department
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* DEPARTMENTS LIST GRID */}
          {departments.length === 0 && !showCreateDept ? (
            <div className="rounded-[3rem] bg-white border-4 border-dashed border-navy-300 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
               <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-navy-50 mb-6 rotate-[-5deg]">
                 <Building2 className="h-10 w-10 text-navy-300" />
               </div>
               <h3 className="font-display text-3xl font-bold text-navy-900 mb-3">No departments yet</h3>
               <p className="text-lg font-bold text-navy-500 mb-8 max-w-sm">
                 Create your first department, assign a leader, and give them a budget to start organizing events.
               </p>
               <button
                 onClick={() => setShowCreateDept(true)}
                 className="inline-flex items-center gap-3 rounded-full border-4 border-navy-900 bg-pink-400 px-8 py-4 font-bold text-navy-900 shadow-playful hover:-translate-y-1 hover:shadow-playful-hover transition-all text-lg"
               >
                 <Plus className="h-6 w-6" />
                 Create First Department
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {departments.map((dept) => {
                const monthlyBudget = parseFloat(dept.monthly_budget);
                const monthlySpent = parseFloat(dept.current_month_spent);
                const monthlyRemaining = parseFloat(dept.monthly_budget_remaining);
                const total = monthlyBudget > 0 ? monthlyBudget : parseFloat(dept.budget_total);
                const spent = monthlyBudget > 0 ? monthlySpent : parseFloat(dept.budget_spent);
                const remaining = monthlyBudget > 0 ? monthlyRemaining : total - spent;
                const pct = total > 0 ? (spent / total) * 100 : 0;
                const isMonthly = monthlyBudget > 0;
                
                return (
                  <div key={dept.id} className="relative rounded-[2.5rem] bg-white border-4 border-navy-900 shadow-playful overflow-hidden hover:-translate-y-1 hover:shadow-playful-hover transition-all group">
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="font-display text-3xl font-bold text-navy-900 mb-2">{dept.name}</h3>
                          <div className="flex items-center gap-2">
                            <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border-2 border-orange-200">
                              DEPT HEAD
                            </div>
                            <span className="font-bold text-navy-700 flex items-center gap-2">
                              {dept.head_detail ? (
                                <>
                                  <UserCircle2 className="h-5 w-5 text-orange-500" />
                                  {dept.head_detail.first_name} {dept.head_detail.last_name}
                                </>
                              ) : (
                                <span className="text-navy-400 italic">Unassigned</span>
                              )}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 border-4 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] group-hover:rotate-12 transition-transform duration-300">
                          <Users className="h-7 w-7 text-teal-600" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t-4 border-navy-50 pt-6">
                        <div>
                          <p className="text-xs font-extrabold text-navy-400 uppercase tracking-widest mb-1">Teams Sub-divided</p>
                          <p className="font-display text-2xl font-bold text-navy-900">{dept.team_count}</p>
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-navy-400 uppercase tracking-widest mb-1">Total Members</p>
                          <p className="font-display text-2xl font-bold text-navy-900">{dept.member_count}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Budget Footer */}
                    <div className="bg-navy-900 p-6 text-white border-t-4 border-navy-900 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">
                            {isMonthly ? "Monthly Budget" : "Department Budget"}
                          </p>
                          {isMonthly && (
                            <span className="text-xs font-bold bg-navy-700 text-navy-200 px-2 py-0.5 rounded-full">
                              Resets in {dept.days_until_reset}d
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-3xl font-bold text-green-300">€{remaining.toFixed(0)}</span>
                          <span className="text-sm font-bold text-navy-400">remaining of €{total.toFixed(0)}</span>
                        </div>
                        {isMonthly && (
                          <p className="text-xs text-navy-400 mt-1">{dept.budget_period_label}</p>
                        )}
                      </div>
                      
                      {total > 0 && (
                        <div className="w-full sm:w-1/2">
                          <div className="flex justify-between text-xs font-bold font-mono text-navy-300 mb-2">
                            <span>0%</span>
                            <span>{Math.round(pct)}% used</span>
                          </div>
                          <div className="h-4 w-full bg-navy-800 rounded-full overflow-hidden border-2 border-navy-700 p-0.5">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${pct > 90 ? "bg-red-400" : pct > 70 ? "bg-yellow-400" : "bg-green-400"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INVITES & MEMBERS */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* INVITE BOX */}
          <div className="rounded-[2.5rem] bg-yellow-400 p-8 shadow-playful border-4 border-navy-900 relative">
            <h2 className="font-display text-3xl font-bold text-navy-900 mb-3">Onboard Staff</h2>
            <p className="text-base font-bold text-navy-800 mb-6 leading-relaxed">
              Add employees to your organisation so Department Heads can assign them to teams.
            </p>
            
            <form onSubmit={handleInviteSubmit(onInvite)} className="flex flex-col gap-4">
              {/* Role selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setInviteRole('member'); setInviteDeptId(undefined); }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-3 transition-all ${
                    inviteRole === 'member'
                      ? 'border-navy-900 bg-white text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)]'
                      : 'border-navy-300 bg-yellow-300/50 text-navy-600'
                  }`}
                >
                  Employee
                </button>
                <button
                  type="button"
                  onClick={() => setInviteRole('dept_head')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-3 transition-all ${
                    inviteRole === 'dept_head'
                      ? 'border-navy-900 bg-white text-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)]'
                      : 'border-navy-300 bg-yellow-300/50 text-navy-600'
                  }`}
                >
                  Dept Head
                </button>
              </div>

              {/* Department picker for dept_head */}
              {inviteRole === 'dept_head' && (
                <select
                  value={inviteDeptId ?? ''}
                  onChange={(e) => setInviteDeptId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-2xl border-4 border-navy-900 bg-white px-4 py-3 text-base font-bold text-navy-700 focus:outline-none focus:ring-4 focus:ring-yellow-200 shadow-[2px_2px_0_theme(colors.navy.900)]"
                >
                  <option value="">Assign to department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}

              <div className="relative">
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full rounded-2xl border-4 border-navy-900 bg-white pl-12 pr-4 py-4 text-lg font-bold text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-4 focus:ring-yellow-200 transition-all shadow-[2px_2px_0_theme(colors.navy.900)] block"
                  {...registerInvite("email")}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-navy-400" />
              </div>
              {inviteErrors.email && (
                <p className="text-sm font-bold text-red-600 mt-[-8px] ml-2">{inviteErrors.email.message}</p>
              )}
              <Button
                type="submit"
                loading={inviting}
                disabled={inviteRole === 'dept_head' && !inviteDeptId}
                size="lg"
                className="w-full py-6 text-lg rounded-2xl border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-white hover:bg-navy-50 text-navy-900 font-bold hover:-translate-y-1 transition-all"
              >
                {inviteRole === 'dept_head' ? 'Invite as Dept Head' : 'Send Invite Link'}
              </Button>
            </form>

            {/* Shareable Code Info */}
            {lastInvite && (
              <div className="mt-6 rounded-2xl bg-white border-4 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] p-5 animate-in slide-in-from-top-2 fade-in">
                <div className="flex gap-4 mb-4 items-center">
                  <div className="bg-white p-2 rounded-xl border-4 border-navy-900 flex-shrink-0">
                    <QRCodeSVG value={lastInvite.invite_url} size={80} bgColor="transparent" fgColor="#1a1a2e" level="M" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-green-600 flex items-center gap-1"><Check className="h-4 w-4"/> Invited as {lastInvite.role}</p>
                    {lastInvite.dept_name && (
                      <p className="text-xs font-bold text-navy-700 mt-0.5">Department: {lastInvite.dept_name}</p>
                    )}
                    <p className="text-xs font-bold text-navy-500 mt-1">They will receive an email shortly.</p>
                  </div>
                </div>
                
                <div className="bg-navy-50 rounded-xl p-4 border-2 border-navy-200 text-center">
                  <p className="text-xs font-bold text-navy-500 uppercase tracking-widest mb-2">Short Code</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="px-4 py-2 bg-white rounded-lg font-mono text-2xl font-bold text-navy-900 tracking-[0.2em] border-2 border-navy-200 inline-block">
                      {lastInvite.short_code}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lastInvite.short_code);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                        toast.success("Code copied!");
                      }}
                      className="p-3 bg-white rounded-lg border-2 border-navy-200 hover:bg-navy-100 transition-colors shadow-sm"
                      title="Copy code"
                    >
                      {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-navy-500" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ALL MEMBERS BOX */}
          <div className="rounded-[2.5rem] bg-white border-4 border-navy-900 shadow-playful overflow-hidden">
            <div className="p-6 border-b-4 border-navy-900 bg-navy-50 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-navy-900">All Employees</h2>
              <span className="bg-navy-900 text-white px-3 py-1 rounded-full text-sm font-bold">{members.length}</span>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto divide-y-2 divide-navy-50">
              {members.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-navy-400 font-bold">No employees added yet.</p>
                </div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="p-5 flex items-center justify-between hover:bg-navy-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-300 to-green-500 text-navy-900 border-2 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)]">
                          <UserCircle2 className="h-6 w-6 text-white" />
                        </div>
                        {member.role === "admin" && (
                          <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-1 border-2 border-navy-900 shadow-sm">
                            <Crown className="h-3 w-3 text-navy-900" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-navy-900 truncate">
                            {member.first_name} {member.last_name}
                          </p>
                          {member.role === 'dept_head' && (
                            <span className="text-[10px] font-extrabold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200 uppercase tracking-wide shrink-0">
                              Dept Head
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-navy-400 truncate">{member.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>

    </div>
  );
}
