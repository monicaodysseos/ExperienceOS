"use client";

import { useRef, useState } from "react";
import { Plus, Star, Trash2, ImageIcon, Upload, Link2 } from "lucide-react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface ImageItem {
  id?: number;        // set for images already saved to backend
  url: string;
  isCover: boolean;
  displayOrder: number;
}

// ─── Add Image Modal ─────────────────────────────────────────────────────────

function AddImageModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (url: string) => void;
}) {
  const [tab, setTab] = useState<"upload" | "url">("upload");

  // Upload tab state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  // URL tab state
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  const handleClose = () => {
    setTab("upload");
    setUploading(false);
    setUploadError(null);
    setUploadPreview(null);
    setUrl("");
    setPreview(null);
    setPreviewError(false);
    onClose();
  };

  // ── Upload tab ──
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    setUploadPreview(URL.createObjectURL(file));
    setUploadError(null);
    setUploading(true);

    try {
      const result = await api.uploadImageFile(file);
      onAdd(result.url);
      handleClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setUploadPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── URL tab ──
  const handlePreview = () => {
    if (url.trim()) {
      setPreviewError(false);
      setPreview(url.trim());
    }
  };

  const handleAddUrl = () => {
    if (url.trim()) {
      onAdd(url.trim());
      handleClose();
    }
  };

  return (
    <Modal open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <ModalContent title="Add Image" description="Upload a file or paste an image URL.">
        {/* Tabs */}
        <div className="mb-4 flex rounded-lg border border-navy-200 bg-navy-50 p-1">
          {(["upload", "url"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors",
                tab === t
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-navy-500 hover:text-navy-700"
              )}
            >
              {t === "upload" ? <Upload className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
              {t === "upload" ? "Upload file" : "Paste URL"}
            </button>
          ))}
        </div>

        {/* Upload tab */}
        {tab === "upload" && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Drop zone / preview */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                "relative flex aspect-video w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed transition-colors",
                uploading
                  ? "cursor-not-allowed border-teal-300 bg-teal-50"
                  : "border-navy-200 bg-navy-50 hover:border-teal-400 hover:bg-teal-50/50"
              )}
            >
              {uploadPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={uploadPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <>
                  <Upload className={cn("h-8 w-8", uploading ? "text-teal-500 animate-pulse" : "text-navy-300")} />
                  <p className="text-sm font-medium text-navy-500">
                    {uploading ? "Uploading…" : "Click to choose a file"}
                  </p>
                  <p className="text-xs text-navy-400">JPG, PNG, WebP, GIF up to 10 MB</p>
                </>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                </div>
              )}
            </button>

            {uploadError && (
              <p className="text-sm text-red-600">{uploadError}</p>
            )}
          </div>
        )}

        {/* URL tab */}
        {tab === "url" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setPreview(null); setPreviewError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handlePreview(); } }}
                className="flex-1 rounded-xl border border-navy-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
              <Button type="button" variant="outline" onClick={handlePreview}>
                Preview
              </Button>
            </div>

            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-navy-200 bg-navy-50">
              {preview && !previewError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={() => setPreviewError(true)}
                />
              ) : previewError ? (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-navy-300" />
                  <p className="mt-2 text-xs text-red-500">Could not load image — check the URL</p>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-navy-300" />
                  <p className="mt-2 text-xs text-navy-400">Paste a URL and click Preview</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddUrl}
                disabled={!url.trim() || previewError}
              >
                Add Image
              </Button>
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

// ─── Image Manager ────────────────────────────────────────────────────────────

interface ImageManagerProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
}

export function ImageManager({ images, onChange }: ImageManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleAdd = (url: string) => {
    const newImages = [
      ...images,
      { url, isCover: images.length === 0, displayOrder: images.length },
    ];
    onChange(newImages);
  };

  const handleDelete = (index: number) => {
    const filtered = images.filter((_, i) => i !== index);
    if (images[index].isCover && filtered.length > 0) {
      filtered[0] = { ...filtered[0], isCover: true };
    }
    onChange(filtered.map((img, i) => ({ ...img, displayOrder: i })));
  };

  const handleSetCover = (index: number) => {
    onChange(images.map((img, i) => ({ ...img, isCover: i === index })));
  };

  return (
    <div className="space-y-4">
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {images.map((img, i) => (
            <div key={img.id ?? img.url} className="relative overflow-hidden rounded-xl border border-navy-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={`Image ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
              {img.isCover && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-teal-700 px-2 py-0.5 text-xs font-medium text-white">
                  <Star className="h-3 w-3 fill-current" /> Cover
                </span>
              )}
              <div className="absolute right-2 top-2 flex flex-col gap-1">
                {!img.isCover && (
                  <button type="button" onClick={() => handleSetCover(i)} title="Set as cover"
                    className="rounded-full bg-white/90 p-1.5 text-navy-600 shadow-sm hover:bg-teal-50 hover:text-teal-700 transition-colors">
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(i)} title="Delete"
                  className="rounded-full bg-white/90 p-1.5 text-navy-600 shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setModalOpen(true)}
            className="flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed border-navy-200 text-navy-400 hover:border-teal-400 hover:text-teal-600 transition-colors">
            <Plus className="h-6 w-6" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setModalOpen(true)}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy-200 py-10 text-navy-400 hover:border-teal-400 hover:text-teal-600 transition-colors">
          <Plus className="h-8 w-8" />
          <span className="text-sm">Add images</span>
        </button>
      )}

      <p className="text-xs text-navy-500">
        {images.length === 0
          ? "Add at least one image. The first image will be the cover."
          : `${images.length} image${images.length !== 1 ? "s" : ""} — click ★ to set cover`}
      </p>

      <AddImageModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </div>
  );
}
