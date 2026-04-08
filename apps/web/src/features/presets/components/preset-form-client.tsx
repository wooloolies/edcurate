"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

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
  getListPresetsApiPresetsGetQueryKey,
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

const selectClass =
  "w-full appearance-none bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 text-sm font-semibold text-brand-ink cursor-pointer hover:border-gray-300 focus:outline-none focus:border-brand-green transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";

const inputClass =
  "w-full appearance-none bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 text-sm font-semibold text-brand-ink hover:border-gray-300 focus:outline-none focus:border-brand-green transition-colors shadow-sm placeholder:text-gray-400 placeholder:font-normal";

interface PresetFormClientProps {
  presetId?: string;
}

export function PresetFormClient({ presetId }: PresetFormClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
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

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((f) => ({
      ...f,
      subject: e.target.value,
      curriculum_framework: "",
      year_level: "",
    }));
  };

  const handleFrameworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((f) => ({
      ...f,
      curriculum_framework: e.target.value,
      year_level: "",
    }));
  };

  const setInt = (key: keyof PresetCreate, raw: string) => {
    const n = parseInt(raw, 10);
    set(key, raw === "" ? null : Number.isNaN(n) ? null : n);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && presetId) {
      await updateMutation.mutateAsync({ presetId, data: form });
      await queryClient.invalidateQueries({ queryKey: getListPresetsApiPresetsGetQueryKey() });
      router.push("/collections");
    } else {
      await createMutation.mutateAsync({ data: form });
      await queryClient.invalidateQueries({ queryKey: getListPresetsApiPresetsGetQueryKey() });
      router.push("/collections");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-xl shadow-black/[0.03] ring-1 ring-black/5 p-10 md:p-14 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-brand-ink tracking-tight mb-12">
          {isEdit ? t("editPreset") : t("createPreset")}
        </h1>

        {/* Preset Name */}
        <div className="mb-12">
          <label className="block text-xl font-bold text-brand-ink mb-3">
            {t("sections.presetName")}
            <input
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t("placeholders.name")}
              required
              className={`${inputClass} mt-3`}
            />
          </label>
        </div>

        <div className="border-t border-gray-100 my-12" />

        {/* Curriculum */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-brand-ink mb-6">{t("sections.curriculum")}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-brand-ink">
              {t("fields.country")} *
              <div className="relative mt-2">
                <select value={countryCode} onChange={handleCountryChange} className={selectClass}>
                  <option value="">{t("placeholders.country")}</option>
                  {countries?.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </label>

            <label className="block text-sm font-semibold text-brand-ink">
              {t("fields.subject")} *
              <div className="relative mt-2">
                <select
                  value={form.subject}
                  onChange={handleSubjectChange}
                  disabled={!countryCode}
                  className={selectClass}
                >
                  <option value="">{t("placeholders.subject")}</option>
                  {subjects?.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </label>

            <label className="block text-sm font-semibold text-brand-ink">
              {t("fields.curriculumFramework")}
              <div className="relative mt-2">
                <select
                  value={form.curriculum_framework ?? ""}
                  onChange={handleFrameworkChange}
                  disabled={!form.subject}
                  className={`${selectClass} text-ellipsis`}
                >
                  <option value="">{t("placeholders.curriculumFramework")}</option>
                  {frameworks?.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </label>

            <label className="block text-sm font-semibold text-brand-ink">
              {t("fields.yearLevel")} *
              <div className="relative mt-2">
                <select
                  value={form.year_level}
                  onChange={(e) => set("year_level", e.target.value)}
                  disabled={!form.curriculum_framework}
                  className={selectClass}
                >
                  <option value="">{t("placeholders.yearLevel")}</option>
                  {grades?.map((g) => (
                    <option key={g.name} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t border-gray-100 my-12" />

        {/* Location */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-brand-ink mb-6">{t("sections.location")}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-brand-ink">
              {t("fields.stateRegion")}
              <input
                value={form.state_region ?? ""}
                onChange={(e) => set("state_region", e.target.value)}
                placeholder={t("placeholders.stateRegion")}
                className={`${inputClass} mt-2`}
              />
            </label>
            <label className="block text-sm font-semibold text-brand-ink">
              {t("fields.city")}
              <input
                value={form.city ?? ""}
                onChange={(e) => set("city", e.target.value)}
                placeholder={t("placeholders.city")}
                className={`${inputClass} mt-2`}
              />
            </label>
            <label className="block text-sm font-semibold text-brand-ink">
              {t("fields.teachingLanguage")}
              <input
                value={form.teaching_language ?? ""}
                onChange={(e) => set("teaching_language", e.target.value)}
                placeholder={t("placeholders.teachingLanguage")}
                className={`${inputClass} mt-2`}
              />
            </label>
          </div>
        </div>

        <div className="border-t border-gray-100 my-12" />

        {/* Cohort */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-brand-ink mb-6">{t("sections.cohort")}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-brand-ink">
              {t("fields.classSize")}
              <input
                type="number"
                min={1}
                value={form.class_size ?? ""}
                onChange={(e) => setInt("class_size", e.target.value)}
                className={`${inputClass} mt-2`}
              />
            </label>
            <label className="block text-sm font-semibold text-brand-ink">
              {t("fields.ealdStudents")}
              <input
                type="number"
                min={0}
                value={form.eal_d_students ?? ""}
                onChange={(e) => setInt("eal_d_students", e.target.value)}
                className={`${inputClass} mt-2`}
              />
            </label>
            <label className="block text-sm font-semibold text-brand-ink">
              {t("fields.readingSupportStudents")}
              <input
                type="number"
                min={0}
                value={form.reading_support_students ?? ""}
                onChange={(e) => setInt("reading_support_students", e.target.value)}
                className={`${inputClass} mt-2`}
              />
            </label>
            <label className="block text-sm font-semibold text-brand-ink">
              {t("fields.extensionStudents")}
              <input
                type="number"
                min={0}
                value={form.extension_students ?? ""}
                onChange={(e) => setInt("extension_students", e.target.value)}
                className={`${inputClass} mt-2`}
              />
            </label>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-brand-ink">
              {t("fields.averageReadingLevel")}
              <input
                value={form.average_reading_level ?? ""}
                onChange={(e) => set("average_reading_level", e.target.value)}
                placeholder={t("placeholders.averageReadingLevel")}
                className={`${inputClass} mt-2`}
              />
            </label>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <span className="block text-sm font-semibold text-brand-ink mb-2">
                {t("fields.studentInterests")}
              </span>
              <TagInput
                value={form.student_interests ?? []}
                onChange={(tags) => set("student_interests", tags)}
                placeholder={t("placeholders.studentInterests")}
              />
            </div>
            <div>
              <span className="block text-sm font-semibold text-brand-ink mb-2">
                {t("fields.languageBackgrounds")}
              </span>
              <TagInput
                value={form.language_backgrounds ?? []}
                onChange={(tags) => set("language_backgrounds", tags)}
                placeholder={t("placeholders.languageBackgrounds")}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 my-12" />

        {/* Source Weights */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-brand-ink mb-6">{t("sections.sourceWeights")}</h2>
          <SourceToggles
            value={coerceSourceWeights(form.source_weights)}
            onChange={(w) => set("source_weights", w)}
          />
        </div>

        <div className="border-t border-gray-100 my-12" />

        {/* Notes */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-brand-ink mb-6">{t("sections.notes")}</h2>
          <textarea
            value={form.additional_notes ?? ""}
            onChange={(e) => set("additional_notes", e.target.value)}
            placeholder={t("placeholders.additionalNotes")}
            rows={4}
            className="w-full min-h-[140px] resize-y appearance-none bg-white border-2 border-gray-200 rounded-2xl p-6 text-sm font-medium text-brand-ink hover:border-gray-300 focus:outline-none focus:border-brand-green transition-colors shadow-sm placeholder:text-gray-400 placeholder:font-normal leading-relaxed"
          />
        </div>

        <p className="text-xs text-gray-400 font-medium mb-8">{t("privacyNote")}</p>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push("/collections")}
            className="px-8 py-3 rounded-[2rem] text-base font-semibold text-brand-ink bg-white border-2 border-brand-ink hover:!bg-brand-ink hover:!text-white transition-all duration-300 shadow-sm cursor-pointer"
          >
            {tRoot("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-8 py-3 rounded-[2rem] text-base font-semibold text-brand-ink bg-brand-green border-2 border-brand-green hover:!bg-brand-ink hover:!text-brand-green hover:!border-brand-ink transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : t("savePreset")}
          </button>
        </div>
      </form>
    </div>
  );
}
