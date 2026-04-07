"use client";

import { AlertCircle, ChevronDown, Loader2, Pen } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import {
  useGetCountriesApiCurriculumCountriesGet,
  useGetFrameworksApiCurriculumFrameworksGet,
  useGetGradesApiCurriculumGradesGet,
  useGetSubjectsApiCurriculumSubjectsGet,
} from "@/lib/api/curriculum/curriculum";
import type { PresetCreate } from "@/lib/api/model";
import { useCreatePresetApiPresetsPost } from "@/lib/api/presets/presets";
import { Link, useRouter } from "@/lib/i18n/routing";

export function CollectionOnboarding() {
  const router = useRouter();
  const createMutation = useCreatePresetApiPresetsPost();

  // --- URL-Synchronized State ---
  const [stepStr, setStepStr] = useQueryState("step", { defaultValue: "1", history: "push" });
  const currentStep = parseInt(stepStr || "1", 10) as 1 | 2 | 3;
  const setCurrentStep = (val: 1 | 2 | 3) => setStepStr(val.toString());

  const [presetNameRaw, setPresetName] = useQueryState("preset", { defaultValue: "Collection 1" });
  const presetName = presetNameRaw || "Collection 1";

  const [isEditingPreset, setIsEditingPreset] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: Cascading curriculum state
  const [countryCodeRaw, setCountryCode] = useQueryState("cc", { defaultValue: "" });
  const countryCode = countryCodeRaw || "";

  const [countryNameRaw, setCountryName] = useQueryState("country", { defaultValue: "" });
  const countryName = countryNameRaw || "";

  const [frameworkRaw, setFramework] = useQueryState("framework", { defaultValue: "" });
  const framework = frameworkRaw || "";

  const [gradeRaw, setGrade] = useQueryState("grade", { defaultValue: "" });
  const grade = gradeRaw || "";

  // Step 2
  const [classSizeRaw, setClassSize] = useQueryState("size", { defaultValue: "" });
  const classSize = classSizeRaw || "";

  const [subjectRaw, setSubject] = useQueryState("subject", { defaultValue: "" });
  const subject = subjectRaw || "";

  // Step 3
  const [additionalNotesRaw, setAdditionalNotes] = useQueryState("notes", { defaultValue: "" });
  const additionalNotes = additionalNotesRaw || "";

  // --- Curriculum API (cascading) ---
  const { data: countries } = useGetCountriesApiCurriculumCountriesGet();

  const { data: frameworks } = useGetFrameworksApiCurriculumFrameworksGet(
    { country: countryCode, subject },
    { query: { enabled: !!countryCode && !!subject } }
  );

  const { data: subjects } = useGetSubjectsApiCurriculumSubjectsGet(
    { country: countryCode },
    { query: { enabled: !!countryCode } }
  );

  const { data: subjects } = useGetSubjectsApiCurriculumSubjectsGet(
    { country: countryCode },
    { query: { enabled: !!countryCode } },
  );

  useEffect(() => {
    if (isEditingPreset && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingPreset]);

  useEffect(() => {
    setErrorMsg("");
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const match = countries?.find((c) => c.code === code);
    setCountryCode(code);
    setCountryName(match?.name ?? "");
    setFramework("");
    setGrade("");
  };

  const handleFrameworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFramework(e.target.value);
    setGrade("");
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!countryCode) {
        setErrorMsg("Please select a country to proceed.");
        return;
      }
      if (!grade) {
        setErrorMsg("Please select a year level to proceed.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const sizeParsed = parseInt(classSize, 10);
      if (!classSize || Number.isNaN(sizeParsed) || sizeParsed <= 0) {
        setErrorMsg("Please enter a valid class size (e.g. 25).");
        return;
      }
      if (!subject) {
        setErrorMsg("Please select a relevant field to proceed.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const payload: PresetCreate = {
        name: presetName,
        subject,
        year_level: grade,
        country: countryName,
        curriculum_framework: framework || null,
        class_size: parseInt(classSize, 10) || null,
        additional_notes: additionalNotes || null,
      };
      createMutation.mutate(
        { data: payload },
        { onSuccess: (data) => router.push(`/search?preset_id=${data.id}`) }
      );
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as 1 | 2 | 3);
  };

  const selectClass =
    "w-full appearance-none bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 text-sm font-semibold text-[#111827] cursor-pointer hover:border-gray-300 focus:outline-none focus:border-[#B7FF70] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-xl shadow-black/[0.03] ring-1 ring-black/5 p-10 md:p-14 transition-all duration-300">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {isEditingPreset ? (
            <input
              ref={inputRef}
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onBlur={() => setIsEditingPreset(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingPreset(false)}
              className="text-2xl font-bold text-[#111827] outline-none border-b-2 border-[#B7FF70] bg-transparent w-40"
              aria-label="Edit collection name"
            />
          ) : (
            <button
              type="button"
              className="text-2xl font-bold text-[#111827] cursor-pointer hover:opacity-80 transition-opacity text-left"
              onClick={() => setIsEditingPreset(true)}
            >
              {presetName}
            </button>
          )}
          {!isEditingPreset && (
            <button
              type="button"
              onClick={() => setIsEditingPreset(true)}
              className="p-2 -ml-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100"
              aria-label="Edit collection name"
            >
              <Pen className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-lg font-semibold text-[#111827] tracking-tight" aria-live="polite">
          Step {currentStep}/3
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="flex w-full h-2 gap-2 mb-12"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={3}
      >
        <div
          className={`h-full w-1/3 rounded-full transition-colors duration-500 ${currentStep >= 1 ? "bg-[#B7FF70]" : "bg-gray-200"}`}
        />
        <div
          className={`h-full w-1/3 rounded-full transition-colors duration-500 ${currentStep >= 2 ? "bg-[#B7FF70]" : "bg-gray-200"}`}
        />
        <div
          className={`h-full w-1/3 rounded-full transition-colors duration-500 ${currentStep >= 3 ? "bg-[#B7FF70]" : "bg-gray-200"}`}
        />
      </div>

      {/* --- STEP 1: Curriculum --- */}
      {currentStep === 1 && (
        <div className="space-y-12 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-2 items-center text-center max-w-2xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold text-[#111827] tracking-tight text-center">
              Tell us about your curriculum
            </h3>
            <p className="text-gray-500 text-sm font-medium text-center w-full max-w-sm mx-auto leading-relaxed">
              Tell us about your educational context so we can tailor your research and resources.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {/* Country */}
            <div className="w-full">
              <label
                htmlFor="country-select"
                className="block text-xl font-bold text-[#111827] mb-3 text-left"
              >
                Country
              </label>
              <div className="relative">
                <select
                  id="country-select"
                  value={countryCode}
                  onChange={handleCountryChange}
                  className={selectClass}
                >
                  <option value="">Select a country...</option>
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
            </div>

            {/* Subject */}
            <div className="w-full">
              <label className="block text-xl font-bold text-[#111827] mb-3 text-left">
                Subject
              </label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={handleSubjectChange}
                  disabled={!countryCode}
                  className={selectClass}
                >
                  <option value="">Select a subject...</option>
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
            </div>
            {/* Curriculum Framework */}
            <div className="w-full">
              <label
                htmlFor="framework-select"
                className="block text-xl font-bold text-[#111827] mb-3 text-left"
              >
                Curriculum Framework
              </label>
              <div className="relative">
                <select
                  id="framework-select"
                  value={framework}
                  onChange={handleFrameworkChange}
                  disabled={!countryCode}
                  className={`${selectClass} text-ellipsis`}
                >
                  <option value="">Select a framework...</option>
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
            </div>

            {/* Grade / Year Level */}
            {grades && grades.length > 0 ? (
              <div className="w-full">
                <label
                  htmlFor="grade-level"
                  className="block text-xl font-bold text-[#111827] mb-4 text-left"
                >
                  Year Level
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {grades.map((g) => {
                    const isSelected = grade === g.name;
                    return (
                      <button
                        key={g.name}
                        type="button"
                        onClick={() => setGrade(g.name)}
                        className={`px-8 py-3 rounded-[2rem] font-semibold text-lg transition-all border-2 flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? "border-[#B7FF70] bg-[#B7FF70] text-[#111827] shadow-md"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 bg-white"
                        }`}
                        aria-pressed={isSelected}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* --- STEP 2: Class Size --- */}
      {currentStep === 2 && (
        <div className="space-y-12 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-2 items-center text-center max-w-2xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold text-[#111827] tracking-tight text-center">
              How large is your class?
            </h3>
            <p className="text-gray-500 text-sm font-medium text-center max-w-md mx-auto leading-relaxed">
              Helps us understand and learn the best outcomes for your curriculum of your class.
            </p>
          </div>

          <div className="flex flex-col gap-8 max-w-xl mx-auto">
            {/* Class Size */}
            <div className="w-full">
              <label
                htmlFor="class-size-input"
                className="block text-xl font-bold text-[#111827] mb-3 text-left"
              >
                Class Size
              </label>
              <input
                id="class-size-input"
                type="number"
                min={1}
                max={150}
                placeholder="e.g. 25"
                value={classSize}
                onChange={(e) => setClassSize(e.target.value)}
                className="w-full appearance-none bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 text-sm font-semibold text-[#111827] hover:border-gray-300 focus:outline-none focus:border-[#B7FF70] transition-colors shadow-sm placeholder:text-gray-400 placeholder:font-normal"
              />
            </div>

            {/* Relevant Field (Subject from DB) */}
            <div className="w-full">
              <label
                htmlFor="subject-select"
                className="block text-xl font-bold text-[#111827] mb-3 text-left"
              >
                Relevant field
              </label>
              <div className="relative">
                <select
                  id="subject-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`${selectClass} text-ellipsis`}
                >
                  <option value="">Select a field...</option>
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
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 3: Notes --- */}
      {currentStep === 3 && (
        <div className="space-y-12 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-2 items-center text-center max-w-2xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold text-[#111827] tracking-tight text-center">
              Any additional notes?
            </h3>
            <p className="text-gray-500 text-sm font-medium text-center max-w-md mx-auto leading-relaxed">
              Helps us improving and personalise your experience on Edcurate.
            </p>
          </div>

          <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g., I focus heavily on divergent thinking and visual learning styles..."
              className="w-full min-h-[220px] resize-y appearance-none bg-white border-2 border-gray-200 rounded-[2rem] p-8 text-base font-medium text-[#111827] hover:border-gray-300 focus:outline-none focus:border-[#B7FF70] transition-colors shadow-sm placeholder:text-gray-400 placeholder:font-normal leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Error */}
      {errorMsg || createMutation.isError ? (
        <div className="mb-4 p-4 rounded-2xl bg-red-50 flex items-center justify-center gap-2 text-red-600 font-medium animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMsg || "Failed to create collection. Please try again."}</span>
        </div>
      ) : null}

      {/* Footer */}
      <div className="flex items-center justify-end gap-4 mt-4 pt-8 border-t border-gray-100">
        {currentStep === 1 ? (
          <Link
            href="/"
            className="px-8 py-3 rounded-[2rem] text-base font-semibold text-[#111827] bg-white border-2 border-[#111827] hover:!bg-[#111827] hover:!text-white transition-all duration-300 shadow-sm inline-flex items-center justify-center cursor-pointer"
          >
            Back
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="px-8 py-3 rounded-[2rem] text-base font-semibold text-[#111827] bg-white border-2 border-[#111827] hover:!bg-[#111827] hover:!text-white transition-all duration-300 shadow-sm cursor-pointer"
          >
            Back
          </button>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={createMutation.isPending}
          className="px-8 py-3 rounded-[2rem] text-base font-semibold text-[#111827] bg-[#B7FF70] border-2 border-[#B7FF70] hover:!bg-[#111827] hover:!text-[#B7FF70] hover:!border-[#111827] transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : currentStep === 3 ? (
            "Complete"
          ) : (
            "Next"
          )}
        </button>
      </div>
    </div>
  );
}
