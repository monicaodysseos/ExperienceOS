"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

const schema = z.object({
  display_name: z.string().min(2, "Display name must be at least 2 characters"),
  tagline: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagram: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const { loadUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.createProviderProfile({
        display_name: data.display_name,
        bio: data.bio,
        tagline: data.tagline,
        website: data.website || undefined,
        instagram: data.instagram,
      });
      await loadUser();
      toast.success("Provider profile created!");
      router.push("/dashboard/provider/experiences/new");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create profile");
    }
  };

  return (
    <div className="mx-auto max-w-lg mt-12 rounded-[2.5rem] bg-white p-10 shadow-playful border-4 border-navy-900 relative blob-shape-3">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-navy-900 bg-coral-400 text-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] -translate-y-16 absolute">
        <Sparkles className="h-10 w-10" />
      </div>

      <h1 className="mt-4 font-display text-4xl font-bold text-navy-900 title-shadow">
        Set up your provider profile
      </h1>
      <p className="mt-4 font-bold text-navy-500">
        Tell potential guests about yourself. You can always update this later.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <Input
          label="Display name"
          placeholder="Your business or personal name"
          error={errors.display_name?.message}
          {...register("display_name")}
        />

        <Input
          label="Tagline"
          placeholder="e.g., Local food expert & cooking instructor"
          {...register("tagline")}
        />

        <Textarea
          label="Bio"
          placeholder="Tell guests about yourself, your expertise, and what makes your experiences special..."
          {...register("bio")}
        />

        <Input
          label="Website (optional)"
          placeholder="https://yoursite.com"
          error={errors.website?.message}
          {...register("website")}
        />

        <Input
          label="Instagram (optional)"
          placeholder="@yourusername"
          {...register("instagram")}
        />

        <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-8 rounded-full border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-light-green-400 text-navy-900 font-bold hover:-translate-y-1 transition-all">
          Create Provider Profile
        </Button>
      </form>
    </div>
  );
}
