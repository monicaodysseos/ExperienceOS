"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { useState } from "react";

const profileSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  phone: z.string().optional(),
  city: z.string().optional(),
  preferred_language: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loadUser, logout } = useAuth();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      setValue("first_name", user.first_name);
      setValue("last_name", user.last_name);
      setValue("phone", user.phone || "");
      setValue("city", user.city || "");
      setValue("preferred_language", user.preferred_language || "en");
    }
  }, [user, setValue]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      await api.updateProfile(data);
      await loadUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      await logout();
      router.push("/");
      toast.success("Account deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Profile Settings</h1>
      <p className="mt-1 text-navy-500">Manage your account information</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 max-w-lg space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            error={errors.first_name?.message}
            {...register("first_name")}
          />
          <Input
            label="Last name"
            error={errors.last_name?.message}
            {...register("last_name")}
          />
        </div>

        <Input label="Email" value={user?.email || ""} disabled />

        <Input
          label="Phone"
          type="tel"
          placeholder="+357..."
          {...register("phone")}
        />

        <Select
          label="City"
          options={[
            { label: "Nicosia", value: "nicosia" },
            { label: "Limassol", value: "limassol" },
            { label: "Paphos", value: "paphos" },
            { label: "Larnaca", value: "larnaca" },
            { label: "Ayia Napa", value: "ayia-napa" },
          ]}
          value={watch("city") || ""}
          onValueChange={(v) => setValue("city", v)}
        />

        <Select
          label="Language"
          options={[
            { label: "English", value: "en" },
            { label: "Greek", value: "el" },
          ]}
          value={watch("preferred_language") || "en"}
          onValueChange={(v) => setValue("preferred_language", v)}
        />

        <Button type="submit" loading={isSubmitting}>
          Save Changes
        </Button>
      </form>

      {/* Danger Zone */}
      <div className="mt-12 max-w-lg rounded-xl border border-red-200 bg-red-50/50 p-6">
        <h3 className="font-semibold text-red-700">Danger Zone</h3>
        <p className="mt-1 text-sm text-red-600">
          Once you delete your account, there is no going back. All your data
          will be permanently removed.
        </p>
        <Button
          variant="danger"
          size="sm"
          className="mt-4"
          onClick={() => setDeleteOpen(true)}
        >
          Delete Account
        </Button>
      </div>

      <Modal open={deleteOpen} onOpenChange={setDeleteOpen}>
        <ModalContent title="Delete Account" description="This action cannot be undone.">
          <p className="text-sm text-navy-600">
            Are you sure you want to permanently delete your account and all
            associated data?
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete Account
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
