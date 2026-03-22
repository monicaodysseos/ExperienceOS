"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { api, type Category, type ExperienceDetail, type ExperienceImage } from "@/lib/api";
import { ProviderGuard } from "@/components/ProviderGuard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { LocationPickerMap } from "@/components/LocationPickerMap";
import { ImageManager, type ImageItem } from "@/components/ImageAddModal";
import { cn } from "@/lib/utils";

const CITIES = [
  { label: "Nicosia", value: "Nicosia" },
  { label: "Limassol", value: "Limassol" },
  { label: "Paphos", value: "Paphos" },
  { label: "Larnaca", value: "Larnaca" },
  { label: "Ayia Napa", value: "Ayia Napa" },
];

const LANGUAGES = ["English", "Greek", "Russian", "German", "French"];
const STEPS = ["Basic Info", "Details", "Images", "Review"];

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  category_id: z.string().min(1, "Select a category"),
  city: z.string().min(1, "Select a city"),
  duration_minutes: z.string().min(1, "Required"),
  price_per_person: z.string().min(1, "Required"),
  min_participants: z.string().optional(),
  max_participants: z.string().optional(),
  description: z.string().min(20, "Description must be at least 20 characters"),
  what_included: z.string().optional(),
  what_to_bring: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function EditExperienceContent() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["English"]);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [meetingAddress, setMeetingAddress] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [existingImages, setExistingImages] = useState<ExperienceImage[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const values = watch();

  useEffect(() => {
    Promise.all([
      api.getExperienceForEdit(slug),
      api.getCategories(),
    ])
      .then(([exp, cats]) => {
        setCategories(cats);

        setValue("title", exp.title);
        setValue("category_id", exp.category.id.toString());
        setValue("city", exp.city);
        setValue("duration_minutes", exp.duration_minutes.toString());
        setValue("price_per_person", exp.price_per_person);
        setValue("description", exp.description);
        setValue("what_included", exp.what_included || "");
        setValue("what_to_bring", exp.what_to_bring || "");
        setValue("min_participants", exp.min_participants.toString());
        setValue("max_participants", exp.max_participants.toString());

        if (exp.languages?.length) setSelectedLangs(exp.languages);
        setMeetingAddress(exp.meeting_point || "");
        if (exp.latitude && exp.longitude) {
          setLocation({
            lat: parseFloat(exp.latitude),
            lng: parseFloat(exp.longitude),
            address: exp.meeting_point || "",
          });
        }

        // Seed image manager from existing images
        const imgs: ImageItem[] = (exp.images || []).map((img) => ({
          id: img.id,
          url: img.image_url,
          isCover: img.is_cover,
          displayOrder: img.display_order,
        }));
        setImages(imgs);
        setExistingImages(exp.images || []);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load experience";
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [slug, setValue]);

  const nextStep = async () => {
    if (step === 0) {
      const valid = await trigger(["title", "category_id", "city", "duration_minutes", "price_per_person"]);
      if (!valid) return;
    } else if (step === 1) {
      const valid = await trigger(["description"]);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = async (data: FormData) => {
    try {
      // 1. Update core experience fields
      await api.updateExperience(slug, {
        title: data.title,
        description: data.description,
        what_included: data.what_included,
        what_to_bring: data.what_to_bring,
        meeting_point: meetingAddress,
        city: data.city,
        duration_minutes: parseInt(data.duration_minutes),
        price_per_person: parseFloat(data.price_per_person),
        min_participants: parseInt(data.min_participants || "1"),
        max_participants: parseInt(data.max_participants || "10"),
        languages: selectedLangs,
        category_id: parseInt(data.category_id),
        latitude: location ? parseFloat(location.lat.toFixed(6)) : undefined,
        longitude: location ? parseFloat(location.lng.toFixed(6)) : undefined,
      });

      // 2. Sync images: delete removed, add new, update covers
      const existingIds = existingImages.map((img) => img.id);
      const keptIds = images.filter((img) => img.id != null).map((img) => img.id!);

      // Delete images that were removed
      for (const id of existingIds) {
        if (!keptIds.includes(id)) {
          await api.deleteExperienceImage(slug, id).catch(() => {});
        }
      }

      // Add new images (those without an id)
      const newImages = images.filter((img) => img.id == null);
      let nextOrder = keptIds.length;
      for (const img of newImages) {
        await api.uploadExperienceImage(slug, {
          image_url: img.url,
          is_cover: img.isCover,
          display_order: nextOrder++,
        });
      }

      // Update cover on existing images if it changed
      for (const img of images) {
        if (img.id != null) {
          const original = existingImages.find((e) => e.id === img.id);
          if (original && original.is_cover !== img.isCover) {
            // Backend may support PATCH on individual image — if not, skip silently
            await api.uploadExperienceImage(slug, {
              image_url: img.url,
              is_cover: img.isCover,
              display_order: img.displayOrder,
            }).catch(() => {});
          }
        }
      }

      toast.success("Experience updated!");
      router.push("/dashboard/provider/experiences");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard/provider/experiences" className="mb-8 flex items-center gap-2 text-base font-black text-navy-900 hover:-translate-x-1 transition-transform">
          <ArrowLeft className="h-5 w-5" /> Back to experiences
        </Link>
        <div className="rounded-[2.5rem] border-4 border-red-500 bg-red-100 p-10 text-center shadow-playful blob-shape-2">
          <h2 className="font-display text-3xl font-black text-red-900 title-shadow">Failed to Load Experience</h2>
          <p className="mt-3 text-base font-bold text-red-700">{loadError}</p>
          <Button className="mt-8 rounded-full border-4 border-navy-900 bg-white text-navy-900 font-black shadow-[4px_4px_0_theme(colors.navy.900)] hover:-translate-y-1 transition-all" size="lg" onClick={() => router.push("/dashboard/provider/experiences")}>
            Back to Experiences
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/provider/experiences" className="mb-8 flex items-center gap-2 text-base font-black text-navy-900 hover:-translate-x-1 transition-transform">
        <ArrowLeft className="h-5 w-5" /> Back to experiences
      </Link>

      <h1 className="font-display text-4xl font-black text-navy-900 title-shadow">Edit Experience</h1>

      {/* Progress */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < step
                  ? "bg-teal-700 text-white cursor-pointer hover:bg-teal-800"
                  : i === step
                    ? "bg-teal-100 text-teal-700 ring-2 ring-teal-700"
                    : "bg-navy-100 text-navy-400"
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            <span className={cn("hidden text-sm sm:block", i === step ? "font-medium text-navy-900" : "text-navy-400")}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className="mx-2 h-px w-8 bg-navy-200" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
        {/* Step 1: Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <Input label="Title" error={errors.title?.message} {...register("title")} />
            <Select
              label="Category"
              options={categories.map((c) => ({ label: c.name, value: c.id.toString() }))}
              value={values.category_id || ""}
              onValueChange={(v) => setValue("category_id", v)}
              error={errors.category_id?.message}
            />
            <Select
              label="City"
              options={CITIES}
              value={values.city || ""}
              onValueChange={(v) => setValue("city", v)}
              error={errors.city?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Duration (minutes)" type="number" error={errors.duration_minutes?.message} {...register("duration_minutes")} />
              <Input label="Price per person (EUR)" type="number" step="0.01" error={errors.price_per_person?.message} {...register("price_per_person")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Min participants" type="number" {...register("min_participants")} />
              <Input label="Max participants" type="number" {...register("max_participants")} />
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 1 && (
          <div className="space-y-5">
            <Textarea label="Description" error={errors.description?.message} {...register("description")} />
            <Textarea label="What's included (one item per line)" {...register("what_included")} />
            <Textarea label="What to bring" {...register("what_to_bring")} />

            <LocationPickerMap
              value={location ?? undefined}
              onChange={(val) => setLocation(val)}
              addressValue={meetingAddress}
              onAddressChange={setMeetingAddress}
            />

            <div>
              <p className="mb-2 text-sm font-medium text-navy-700">Languages</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() =>
                      setSelectedLangs((prev) =>
                        prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      selectedLangs.includes(lang)
                        ? "border-teal-700 bg-teal-50 text-teal-700"
                        : "border-navy-200 text-navy-600 hover:border-navy-300"
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Images */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-sm text-navy-500">
              Manage your experience images. Click ★ on any image to set it as the cover photo.
            </p>
            <ImageManager images={images} onChange={setImages} />
          </div>
        )}

        {/* Step 4: Review */}
        {step === 3 && (
          <div className="space-y-4 rounded-xl border border-navy-200 p-6">
            <h3 className="font-semibold text-navy-900">Review your changes</h3>
            <div className="space-y-2 text-sm text-navy-600">
              <p><strong>Title:</strong> {values.title}</p>
              <p><strong>City:</strong> {values.city}</p>
              <p><strong>Duration:</strong> {values.duration_minutes} min</p>
              <p><strong>Price:</strong> &euro;{values.price_per_person}/person</p>
              <p><strong>Participants:</strong> {values.min_participants}–{values.max_participants}</p>
              <p><strong>Languages:</strong> {selectedLangs.join(", ")}</p>
              <p><strong>Images:</strong> {images.length}</p>
              {meetingAddress && <p><strong>Meeting point:</strong> {meetingAddress}</p>}
              {location && <p><strong>Pin:</strong> {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>}
            </div>
            <p className="mt-2 text-sm text-navy-600 line-clamp-3">{values.description}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 flex justify-between items-center bg-white p-6 rounded-[2.5rem] border-4 border-navy-900 shadow-[8px_8px_0_theme(colors.navy.900)] blob-shape-2">
          {step > 0 ? (
            <Button type="button" size="lg" className="rounded-full border-4 border-navy-900 shadow-[2px_2px_0_theme(colors.navy.900)] bg-white text-navy-900 font-black hover:-translate-y-1 transition-all" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-5 w-5 mr-1" /> Back
            </Button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" size="lg" className="rounded-full border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-yellow-400 text-navy-900 font-black hover:-translate-y-1 transition-all" onClick={nextStep}>
              Next <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
          ) : (
            <Button type="submit" size="lg" loading={isSubmitting} className="rounded-full border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] bg-light-green-400 text-navy-900 font-black hover:-translate-y-1 transition-all">
              Save Changes
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function EditExperiencePage() {
  return (
    <ProviderGuard>
      <EditExperienceContent />
    </ProviderGuard>
  );
}
