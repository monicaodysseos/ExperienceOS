"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Mail, Building2, Crown, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api, type OrganisationMember, type Organisation } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

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
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);

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
    Promise.all([api.getOrg(), api.getOrgTeam()])
      .then(([orgData, teamData]) => {
        setOrg(orgData);
        setMembers(teamData.results || []);
      })
      .catch(() => {})
      .finally(() => setLoadingOrg(false));
  }, [user?.org_id]);

  const onInvite = async (data: InviteForm) => {
    setInviting(true);
    try {
      await api.inviteTeamMember(data.email);
      toast.success(`Invitation sent to ${data.email}`);
      resetInvite();
      // Refresh members
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
      // Reload user to get org_id
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create organisation");
    }
  };

  if (loadingOrg) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-2xl" />
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
          Set up your company account to invite your team and manage group bookings.
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
            <p className="mt-1 text-xs text-navy-400">Used to auto-match colleagues when they register</p>
          </div>
          <Button type="submit" loading={orgSubmitting} className="w-full">
            Create Organisation
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-navy-900 ">Team</h1>
          <p className="mt-2 text-lg font-bold text-navy-500 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-500" />
            {org.name}
            <span className="text-navy-300">·</span>
            <span>{members.length} member{members.length !== 1 ? "s" : ""}</span>
          </p>
        </div>
      </div>

      {/* Invite form */}
      <div className="rounded-[2.5rem] bg-yellow-400 p-8 shadow-playful border-4 border-navy-900 mb-8 blob-shape-3 relative">
        <h2 className="font-display text-2xl font-bold text-navy-900 mb-2 ">Invite a team member</h2>
        <p className="text-base font-bold text-navy-900 mb-6">
          They&apos;ll receive an email invitation to join {org.name}.
        </p>
        <form
          onSubmit={handleInviteSubmit(onInvite)}
          className="flex gap-3"
        >
          <Input
            type="email"
            placeholder="colleague@company.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={inviteErrors.email?.message}
            className="flex-1"
            {...registerInvite("email")}
          />
          <Button type="submit" loading={inviting} size="lg" className="rounded-full border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-white text-navy-900 font-bold hover:-translate-y-1 transition-all">
            Send Invite
          </Button>
        </form>
      </div>

      {/* Members list */}
      {members.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No team members yet"
          description="Invite colleagues to start booking team experiences together."
        />
      ) : (
        <div className="rounded-[2.5rem] bg-white border-4 border-navy-900 shadow-playful overflow-hidden">
          <div className="divide-y-2 divide-navy-100">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between px-6 py-5 hover:bg-navy-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-light-green-400 text-navy-900 border-2 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)]">
                    <UserCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-900">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-navy-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "admin" && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                      <Crown className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Org details */}
      <div className="mt-10 rounded-[2.5rem] bg-white p-8 shadow-playful border-4 border-navy-900">
        <h2 className="font-display text-2xl font-bold text-navy-900 mb-6 ">Organisation details</h2>
        <dl className="space-y-4 text-base">
          <div className="flex justify-between">
            <dt className="text-navy-500">Name</dt>
            <dd className="font-medium text-navy-900">{org.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-500">Billing email</dt>
            <dd className="font-medium text-navy-900">{org.billing_email}</dd>
          </div>
          {org.domain && (
            <div className="flex justify-between">
              <dt className="text-navy-500">Domain</dt>
              <dd className="font-medium text-navy-900">{org.domain}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-navy-500">Plan</dt>
            <dd className="font-medium capitalize text-navy-900">{org.subscription_tier}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
