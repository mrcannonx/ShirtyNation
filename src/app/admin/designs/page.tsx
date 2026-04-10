"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Image as ImageIcon, CheckCircle2, Loader2, AlertCircle, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ColorSwatchPicker } from "@/components/admin/color-swatch-picker";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  { value: "unhinged", label: "Unhinged / Chaotic" },
  { value: "dark-humor", label: "Dark Humor / Mental Health" },
  { value: "work-satire", label: "Work Satire / Corporate" },
  { value: "introvert", label: "Introvert / Antisocial" },
  { value: "parenting", label: "Parenting Chaos" },
  { value: "social-commentary", label: "Social Commentary" },
  { value: "gen-z", label: "Gen Z / Internet Culture" },
  { value: "kids", label: "Kids Attitude" },
  { value: "baby", label: "Baby Onesies" },
  { value: "occupation", label: "Occupation Humor" },
  { value: "funny", label: "General Funny" },
];

const AUDIENCES = [
  { value: "adult", label: "Adult", price: "$27.99" },
  { value: "kids", label: "Kids", price: "$24.99" },
  { value: "baby", label: "Baby", price: "$22.99" },
];

type PipelineStep = "idle" | "uploading" | "creating" | "publishing" | "done" | "error";

interface RecentDesign {
  id: string;
  name: string;
  category: string;
  design_url: string;
  mockup_urls: string[];
  status: string;
  created_at: string;
  printify_product_id: string;
}

export default function DesignsPage() {
  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("unhinged");
  const [audience, setAudience] = useState("adult");
  const [selectedColors, setSelectedColors] = useState<string[]>(["black", "dark-grey", "navy"]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pipeline state
  const [step, setStep] = useState<PipelineStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    productId: string;
    seoTitle: string;
    etsyPublished: boolean;
    variantCount: number;
    colorCount: number;
  } | null>(null);

  // Recent uploads
  const [recentDesigns, setRecentDesigns] = useState<RecentDesign[]>([]);

  // Load recent designs (wait for auth session)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadRecentDesigns();
    });
  }, []);

  async function loadRecentDesigns() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, design_url, mockup_urls, status, created_at, printify_product_id")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setRecentDesigns(data);
    if (error) console.warn("Failed to load recent designs:", error.message);
  }

  // File handling
  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
    setError(null);
    setResult(null);
    setStep("idle");
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  }

  // Push to Etsy
  async function handleSubmit() {
    if (!file || !title || selectedColors.length === 0) return;

    setStep("uploading");
    setError(null);
    setResult(null);

    try {
      // Step 1: Upload image to Supabase Storage (handles large files)
      const supabase = createClient();
      const fileExt = file.name.split(".").pop() || "png";
      const fileName = `${Date.now()}-${generateSlug(title)}.${fileExt}`;
      const filePath = `designs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("designs")
        .upload(filePath, file, { contentType: file.type, upsert: true });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("designs").getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      setStep("creating");

      // Step 2: Send URL + metadata to API route (tiny request, no 413)
      const res = await fetch("/api/admin/upload-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          fileName,
          title,
          category,
          audience,
          colors: selectedColors,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Pipeline failed");
      }

      setStep("publishing");
      await new Promise((r) => setTimeout(r, 800));

      setResult(data);
      setStep("done");

      // Refresh recent designs
      loadRecentDesigns();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStep("error");
    }
  }

  function generateSlug(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
  }

  function resetForm() {
    setFile(null);
    setPreview(null);
    setTitle("");
    setCategory("unhinged");
    setAudience("adult");
    setSelectedColors(["black", "dark-grey", "navy"]);
    setStep("idle");
    setError(null);
    setResult(null);
  }

  const isSubmitting = step !== "idle" && step !== "done" && step !== "error";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Design Upload</h1>
        <p className="text-sm text-[#737373] mt-1">Upload a design, pick colors, push to Etsy in one click.</p>
      </div>

      {/* Upload Form */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6 space-y-6">
        {/* Drop Zone */}
        <div>
          <Label className="text-[#A3A3A3] text-sm mb-2 block">Design File</Label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-[#E8630A] bg-[#E8630A]/5"
                : preview
                ? "border-[#262626] bg-[#0A0A0A]"
                : "border-[#333] hover:border-[#525252] bg-[#0A0A0A]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileInput}
            />

            {preview ? (
              <div className="flex items-center gap-6">
                <img src={preview} alt="Preview" className="w-40 h-40 object-contain rounded-lg bg-[#1C1C1C]" />
                <div className="text-left">
                  <p className="text-white font-medium">{file?.name}</p>
                  <p className="text-sm text-[#525252] mt-1">
                    {file && (file.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="text-xs text-red-400 hover:text-red-300 mt-2 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#1C1C1C] flex items-center justify-center">
                  {dragOver ? (
                    <ImageIcon className="w-6 h-6 text-[#E8630A]" />
                  ) : (
                    <Upload className="w-6 h-6 text-[#525252]" />
                  )}
                </div>
                <div>
                  <p className="text-[#A3A3A3]">Drop your design here or click to browse</p>
                  <p className="text-xs text-[#525252] mt-1">PNG, JPG, or WebP</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-[#A3A3A3] text-sm">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="I Was Normal Three Kids Ago"
            className="bg-[#0A0A0A] border-[#262626] text-white placeholder:text-[#525252] mt-1.5"
          />
          <p className="text-xs text-[#525252] mt-1">Etsy SEO title, description, and tags will be auto-generated from this.</p>
        </div>

        {/* Category + Audience row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-[#A3A3A3] text-sm">Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-1.5 bg-[#0A0A0A] border border-[#262626] text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#E8630A] focus:border-[#E8630A] outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-[#A3A3A3] text-sm">Audience</Label>
            <div className="flex gap-2 mt-1.5">
              {AUDIENCES.map((aud) => (
                <button
                  key={aud.value}
                  type="button"
                  onClick={() => setAudience(aud.value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                    audience === aud.value
                      ? "bg-[#E8630A]/10 border-[#E8630A] text-[#E8630A]"
                      : "bg-[#0A0A0A] border-[#262626] text-[#737373] hover:text-white hover:border-[#525252]"
                  }`}
                >
                  {aud.label}
                  <span className="block text-[10px] mt-0.5 opacity-60">{aud.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <Label className="text-[#A3A3A3] text-sm mb-2 block">Shirt Colors</Label>
          <ColorSwatchPicker selected={selectedColors} onChange={setSelectedColors} />
        </div>

        {/* Pipeline Progress */}
        {step !== "idle" && (
          <div className="bg-[#0A0A0A] rounded-lg border border-[#262626] p-4 space-y-3">
            <PipelineStepRow
              label="Uploading design to Printify"
              status={step === "uploading" ? "active" : "done"}
            />
            <PipelineStepRow
              label="Creating product with variants"
              status={step === "creating" ? "active" : step === "uploading" ? "pending" : "done"}
            />
            <PipelineStepRow
              label="Publishing to Etsy"
              status={step === "publishing" ? "active" : (step === "uploading" || step === "creating") ? "pending" : step === "error" ? "error" : "done"}
            />
            {step === "done" && result && (
              <div className="mt-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Live on Etsy!
                </p>
                <p className="text-xs text-[#737373] mt-1">
                  {result.colorCount} colors &middot; {result.variantCount} variants &middot; {result.etsyPublished ? "Published" : "Publishing..."}
                </p>
                <a
                  href="https://www.etsy.com/shop/AudacityTees"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#E8630A] hover:underline mt-2 inline-flex items-center gap-1"
                >
                  View on Etsy <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {step === "error" && error && (
              <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Pipeline Failed
                </p>
                <p className="text-xs text-[#737373] mt-1">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!file || !title || selectedColors.length === 0 || isSubmitting}
            className="bg-[#E8630A] hover:bg-[#C2410C] text-white font-medium px-6 disabled:opacity-40"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : step === "done" ? (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Pushed to Etsy</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Push to Etsy</>
            )}
          </Button>

          {(step === "done" || step === "error") && (
            <Button
              onClick={resetForm}
              variant="outline"
              className="border-[#262626] text-[#A3A3A3] hover:text-white hover:bg-[#1C1C1C]"
            >
              Upload Another
            </Button>
          )}
        </div>
      </div>

      {/* Recent Uploads */}
      {recentDesigns.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Recent Uploads</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentDesigns.map((design) => (
              <div
                key={design.id}
                className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden hover:border-[#333] transition-colors"
              >
                <div className="aspect-square bg-[#0A0A0A] flex items-center justify-center p-4">
                  {design.design_url ? (
                    <img
                      src={design.design_url}
                      alt={design.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : design.mockup_urls?.[0] ? (
                    <img
                      src={design.mockup_urls[0]}
                      alt={design.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-[#333]" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm text-white font-medium truncate">{design.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] border-[#262626] text-[#737373]"
                    >
                      {design.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        design.status === "active"
                          ? "border-green-500/30 text-green-400"
                          : "border-[#262626] text-[#525252]"
                      }`}
                    >
                      {design.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-[#525252] mt-1.5">
                    {new Date(design.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Pipeline Step Indicator ---

function PipelineStepRow({ label, status }: { label: string; status: "pending" | "active" | "done" | "error" }) {
  return (
    <div className="flex items-center gap-3">
      {status === "pending" && <div className="w-5 h-5 rounded-full border-2 border-[#333]" />}
      {status === "active" && <Loader2 className="w-5 h-5 text-[#E8630A] animate-spin" />}
      {status === "done" && <CheckCircle2 className="w-5 h-5 text-green-400" />}
      {status === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
      <span className={`text-sm ${
        status === "active" ? "text-white" :
        status === "done" ? "text-green-400" :
        status === "error" ? "text-red-400" :
        "text-[#525252]"
      }`}>
        {label}
      </span>
    </div>
  );
}
