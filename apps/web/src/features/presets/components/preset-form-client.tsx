"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SourceToggles } from "@/features/presets/components/source-toggles";
import { TagInput } from "@/features/presets/components/tag-input";
import {
  coerceSourceWeights,
  type SourceWeights,
} from "@/features/presets/utils/normalize-weights";
import type { PresetCreate } from "@/lib/api/model";
import {
  useCreatePresetApiPresetsPost,
  useGetPresetApiPresetsPresetIdGet,
  useUpdatePresetApiPresetsPresetIdPut,
} from "@/lib/api/presets/presets";

const DEFAULT_WEIGHTS: SourceWeights = {
  ddgs: 0.34,
  youtube: 0.33,
  openalex: 0.33,
};

interface PresetFormClientProps {
  presetId?: string;
}

export function PresetFormClient({ presetId }: PresetFormClientProps) {
  const router = useRouter();
  const isEdit = !!presetId;

  const { data: existing } = useGetPresetApiPresetsPresetIdGet(presetId ?? "", {
    query: { enabled: isEdit },
  });

  const createMutation = useCreatePresetApiPresetsPost();
  const updateMutation = useUpdatePresetApiPresetsPresetIdPut();

  const [form, setForm] = useState<PresetCreate>(() => ({
    name: "",
    subject: "",
    year_level: "",
    country: "",
    teaching_language: "en",
    source_weights: DEFAULT_WEIGHTS,
    student_interests: [],
    language_backgrounds: [],
  }));

  // Sync form when existing data loads
  const [synced, setSynced] = useState(false);
  if (existing && !synced) {
    setForm({
      name: existing.name,
      curriculum_framework: existing.curriculum_framework,
      subject: existing.subject,
      year_level: existing.year_level,
      topic: existing.topic,
      country: existing.country,
      state_region: existing.state_region,
      city: existing.city,
      teaching_language: existing.teaching_language,
      class_size: existing.class_size,
      eal_d_students: existing.eal_d_students,
      reading_support_students: existing.reading_support_students,
      extension_students: existing.extension_students,
      student_interests: (existing.student_interests as string[]) ?? [],
      language_backgrounds: (existing.language_backgrounds as string[]) ?? [],
      average_reading_level: existing.average_reading_level,
      source_weights: coerceSourceWeights(existing.source_weights),
      additional_notes: existing.additional_notes,
    });
    setSynced(true);
  }

  const set = <K extends keyof PresetCreate>(key: K, val: PresetCreate[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const setInt = (key: keyof PresetCreate, raw: string) => {
    const n = parseInt(raw, 10);
    set(key, raw === "" ? undefined : Number.isNaN(n) ? undefined : n);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && presetId) {
      updateMutation.mutate(
        { presetId, data: form },
        { onSuccess: () => router.push("/dashboard/presets") }
      );
    } else {
      createMutation.mutate({ data: form }, { onSuccess: () => router.push("/dashboard/presets") });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">{isEdit ? "Edit Preset" : "Create Preset"}</h1>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Preset Name</legend>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g., Year 9 Geography - Cairns"
            required
          />
        </div>
      </fieldset>

      <Separator />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Curriculum</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="curriculum_framework">Framework</Label>
            <Input
              id="curriculum_framework"
              value={form.curriculum_framework ?? ""}
              onChange={(e) => set("curriculum_framework", e.target.value || undefined)}
              placeholder="e.g., NSW NESA Syllabus"
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="e.g., Geography"
              required
            />
          </div>
          <div>
            <Label htmlFor="year_level">Year Level *</Label>
            <Input
              id="year_level"
              value={form.year_level}
              onChange={(e) => set("year_level", e.target.value)}
              placeholder="e.g., Year 9"
              required
            />
          </div>
          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={form.topic ?? ""}
              onChange={(e) => set("topic", e.target.value || undefined)}
              placeholder="e.g., Coastal erosion"
            />
          </div>
        </div>
      </fieldset>

      <Separator />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Location</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              placeholder="e.g., Australia"
              required
            />
          </div>
          <div>
            <Label htmlFor="state_region">State/Region</Label>
            <Input
              id="state_region"
              value={form.state_region ?? ""}
              onChange={(e) => set("state_region", e.target.value || undefined)}
              placeholder="e.g., Queensland"
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city ?? ""}
              onChange={(e) => set("city", e.target.value || undefined)}
              placeholder="e.g., Cairns"
            />
          </div>
          <div>
            <Label htmlFor="teaching_language">Teaching Language</Label>
            <Input
              id="teaching_language"
              value={form.teaching_language}
              onChange={(e) => set("teaching_language", e.target.value)}
              placeholder="e.g., en"
            />
          </div>
        </div>
      </fieldset>

      <Separator />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Cohort (Anonymised)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="class_size">Class Size</Label>
            <Input
              id="class_size"
              type="number"
              min={1}
              value={form.class_size ?? ""}
              onChange={(e) => setInt("class_size", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="eal_d_students">EAL/D Students</Label>
            <Input
              id="eal_d_students"
              type="number"
              min={0}
              value={form.eal_d_students ?? ""}
              onChange={(e) => setInt("eal_d_students", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="reading_support_students">Reading Support</Label>
            <Input
              id="reading_support_students"
              type="number"
              min={0}
              value={form.reading_support_students ?? ""}
              onChange={(e) => setInt("reading_support_students", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="extension_students">Extension Students</Label>
            <Input
              id="extension_students"
              type="number"
              min={0}
              value={form.extension_students ?? ""}
              onChange={(e) => setInt("extension_students", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="average_reading_level">Average Reading Level</Label>
          <Input
            id="average_reading_level"
            value={form.average_reading_level ?? ""}
            onChange={(e) => set("average_reading_level", e.target.value || undefined)}
            placeholder="e.g., Year 8.5"
          />
        </div>
        <div>
          <Label>Student Interests</Label>
          <TagInput
            value={form.student_interests ?? []}
            onChange={(tags) => set("student_interests", tags)}
            placeholder="Type an interest and press Enter"
          />
        </div>
        <div>
          <Label>Language Backgrounds</Label>
          <TagInput
            value={form.language_backgrounds ?? []}
            onChange={(tags) => set("language_backgrounds", tags)}
            placeholder="Type a language and press Enter"
          />
        </div>
      </fieldset>

      <Separator />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Source Weights</legend>
        <SourceToggles
          value={coerceSourceWeights(form.source_weights)}
          onChange={(w) => set("source_weights", w)}
        />
      </fieldset>

      <Separator />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Notes</legend>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={3}
          value={form.additional_notes ?? ""}
          onChange={(e) => set("additional_notes", e.target.value || undefined)}
          placeholder="Additional context about your classroom..."
        />
      </fieldset>

      <p className="text-xs text-muted-foreground">
        No student PII is stored or sent to AI models.
      </p>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Preset"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/presets")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
