"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SourceToggles } from "@/features/presets/components/source-toggles";
import { TagInput } from "@/features/presets/components/tag-input";
import {
  coerceSourceWeights,
  type SourceWeights,
} from "@/features/presets/utils/normalize-weights";
import {
  useGetCountriesApiCurriculumCountriesGet,
  useGetFrameworksApiCurriculumFrameworksGet,
  useGetGradesApiCurriculumGradesGet,
  useGetSubjectsApiCurriculumSubjectsGet,
} from "@/lib/api/curriculum/curriculum";
import type { PresetCreate } from "@/lib/api/model";
import {
  useCreatePresetApiPresetsPost,
  useGetPresetApiPresetsPresetIdGet,
  useUpdatePresetApiPresetsPresetIdPut,
} from "@/lib/api/presets/presets";
import { useRouter } from "@/lib/i18n/routing";

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
  const tRoot = useTranslations();
  const t = useTranslations("presets");
  const isEdit = !!presetId;

  const { data: existing } = useGetPresetApiPresetsPresetIdGet(presetId ?? "", {
    query: { enabled: isEdit },
  });

  const createMutation = useCreatePresetApiPresetsPost();
  const updateMutation = useUpdatePresetApiPresetsPresetIdPut();

  // Curriculum cascading dropdown state
  const [countryCode, setCountryCode] = useState("");
  const { data: countries } = useGetCountriesApiCurriculumCountriesGet();
  const { data: subjects } = useGetSubjectsApiCurriculumSubjectsGet(
    { country: countryCode },
    { query: { enabled: !!countryCode } }
  );
  const [form, setForm] = useState<PresetCreate>(() => ({
    name: "",
    curriculum_framework: "",
    subject: "",
    year_level: "",
    country: "",
    state_region: "",
    city: "",
    teaching_language: "en",
    class_size: null,
    eal_d_students: null,
    reading_support_students: null,
    extension_students: null,
    student_interests: [],
    language_backgrounds: [],
    average_reading_level: "",
    source_weights: DEFAULT_WEIGHTS,
    additional_notes: "",
  }));

  const { data: frameworks } = useGetFrameworksApiCurriculumFrameworksGet(
    { country: countryCode, subject: form.subject },
    { query: { enabled: !!countryCode && !!form.subject } }
  );
  const { data: grades } = useGetGradesApiCurriculumGradesGet(
    { country: countryCode, subject: form.subject, framework: form.curriculum_framework ?? "" },
    { query: { enabled: !!countryCode && !!form.subject && !!form.curriculum_framework } }
  );

  // Sync form when existing data loads
  const [synced, setSynced] = useState(false);
  if (existing && !synced) {
    // Resolve country_code from country name
    const match = countries?.find((c) => c.name === existing.country);
    if (match) setCountryCode(match.code);
    setForm({
      name: existing.name,
      curriculum_framework: existing.curriculum_framework ?? "",
      subject: existing.subject,
      year_level: existing.year_level,
      country: existing.country,
      state_region: existing.state_region ?? "",
      city: existing.city ?? "",
      teaching_language: existing.teaching_language ?? "en",
      class_size: existing.class_size ?? null,
      eal_d_students: existing.eal_d_students ?? null,
      reading_support_students: existing.reading_support_students ?? null,
      extension_students: existing.extension_students ?? null,
      student_interests: (existing.student_interests as string[]) ?? [],
      language_backgrounds: (existing.language_backgrounds as string[]) ?? [],
      average_reading_level: existing.average_reading_level ?? "",
      source_weights: coerceSourceWeights(existing.source_weights),
      additional_notes: existing.additional_notes ?? "",
    });
    setSynced(true);
  }

  const set = <K extends keyof PresetCreate>(key: K, val: PresetCreate[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleCountryChange = (code: string) => {
    const country = countries?.find((c) => c.code === code);
    setCountryCode(code);
    setForm((f) => ({
      ...f,
      country: country?.name ?? "",
      subject: "",
      curriculum_framework: "",
      year_level: "",
    }));
  };

  const handleSubjectChange = (subject: string) => {
    setForm((f) => ({
      ...f,
      subject,
      curriculum_framework: "",
      year_level: "",
    }));
  };

  const handleFrameworkChange = (framework: string) => {
    setForm((f) => ({
      ...f,
      curriculum_framework: framework,
      year_level: "",
    }));
  };

  const setInt = (key: keyof PresetCreate, raw: string) => {
    const n = parseInt(raw, 10);
    set(key, raw === "" ? null : Number.isNaN(n) ? null : n);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && presetId) {
      updateMutation.mutate(
        { presetId, data: form },
        { onSuccess: () => router.push("/collections") }
      );
    } else {
      createMutation.mutate({ data: form }, { onSuccess: () => router.push("/collections") });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">{isEdit ? t("editPreset") : t("createPreset")}</h1>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{t("sections.presetName")}</legend>
        <div>
          <Label htmlFor="name">{t("fields.name")}</Label>
          <Input
            id="name"
            value={form.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder={t("placeholders.name")}
            required
          />
        </div>
      </fieldset>

      <Separator />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{t("sections.curriculum")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t("fields.country")} *</Label>
            <Select value={countryCode} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("placeholders.country")} />
              </SelectTrigger>
              <SelectContent>
                {countries?.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("fields.subject")} *</Label>
            <Select
              value={form.subject}
              onValueChange={handleSubjectChange}
              disabled={!countryCode}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("placeholders.subject")} />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("fields.curriculumFramework")}</Label>
            <Select
              value={form.curriculum_framework ?? ""}
              onValueChange={handleFrameworkChange}
              disabled={!form.subject}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("placeholders.curriculumFramework")} />
              </SelectTrigger>
              <SelectContent>
                {frameworks?.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("fields.yearLevel")} *</Label>
            <Select
              value={form.year_level}
              onValueChange={(v) => set("year_level", v)}
              disabled={!form.curriculum_framework}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("placeholders.yearLevel")} />
              </SelectTrigger>
              <SelectContent>
                {grades?.map((g) => (
                  <SelectItem key={g.name} value={g.name}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      <Separator />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{t("sections.location")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="state_region">{t("fields.stateRegion")}</Label>
            <Input
              id="state_region"
              value={form.state_region ?? ""}
              onChange={(e) => set("state_region", e.target.value)}
              placeholder={t("placeholders.stateRegion")}
            />
          </div>
          <div>
            <Label htmlFor="city">{t("fields.city")}</Label>
            <Input
              id="city"
              value={form.city ?? ""}
              onChange={(e) => set("city", e.target.value)}
              placeholder={t("placeholders.city")}
            />
          </div>
          <div>
            <Label htmlFor="teaching_language">{t("fields.teachingLanguage")}</Label>
            <Input
              id="teaching_language"
              value={form.teaching_language ?? ""}
              onChange={(e) => set("teaching_language", e.target.value)}
              placeholder={t("placeholders.teachingLanguage")}
            />
          </div>
        </div>
      </fieldset>

      <Separator />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{t("sections.cohort")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="class_size">{t("fields.classSize")}</Label>
            <Input
              id="class_size"
              type="number"
              min={1}
              value={form.class_size ?? ""}
              onChange={(e) => setInt("class_size", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="eal_d_students">{t("fields.ealdStudents")}</Label>
            <Input
              id="eal_d_students"
              type="number"
              min={0}
              value={form.eal_d_students ?? ""}
              onChange={(e) => setInt("eal_d_students", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="reading_support_students">{t("fields.readingSupportStudents")}</Label>
            <Input
              id="reading_support_students"
              type="number"
              min={0}
              value={form.reading_support_students ?? ""}
              onChange={(e) => setInt("reading_support_students", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="extension_students">{t("fields.extensionStudents")}</Label>
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
          <Label htmlFor="average_reading_level">{t("fields.averageReadingLevel")}</Label>
          <Input
            id="average_reading_level"
            value={form.average_reading_level ?? ""}
            onChange={(e) => set("average_reading_level", e.target.value)}
            placeholder={t("placeholders.averageReadingLevel")}
          />
        </div>
        <div>
          <Label>{t("fields.studentInterests")}</Label>
          <TagInput
            value={form.student_interests ?? []}
            onChange={(tags) => set("student_interests", tags)}
            placeholder={t("placeholders.studentInterests")}
          />
        </div>
        <div>
          <Label>{t("fields.languageBackgrounds")}</Label>
          <TagInput
            value={form.language_backgrounds ?? []}
            onChange={(tags) => set("language_backgrounds", tags)}
            placeholder={t("placeholders.languageBackgrounds")}
          />
        </div>
      </fieldset>

      <Separator />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{t("sections.sourceWeights")}</legend>
        <SourceToggles
          value={coerceSourceWeights(form.source_weights)}
          onChange={(w) => set("source_weights", w)}
        />
      </fieldset>

      <Separator />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{t("sections.notes")}</legend>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={3}
          value={form.additional_notes ?? ""}
          onChange={(e) => set("additional_notes", e.target.value)}
          placeholder={t("placeholders.additionalNotes")}
        />
      </fieldset>

      <p className="text-xs text-muted-foreground">{t("privacyNote")}</p>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? t("saving") : t("savePreset")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/collections")}>
          {tRoot("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
