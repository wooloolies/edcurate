"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryState } from "nuqs";
import { Pen, ChevronDown, AlertCircle, Search, Repeat } from "lucide-react";
import { Link, useRouter } from "@/lib/i18n/routing";

const CURRICULUM_DATA: Record<string, string[]> = {
  "Australia": [
    "Australian Curriculum (ACARA)",
    "New South Wales Syllabus (NESA)",
    "Victorian Curriculum (VCAA)",
    "Queensland Curriculum (QCAA)",
    "Western Australian Curriculum (SCSA)",
    "South Australian Curriculum (SACE)"
  ],
  "United Kingdom": [
    "National Curriculum for England",
    "Curriculum for Wales",
    "Curriculum for Excellence (Scotland)",
    "Northern Ireland Curriculum"
  ],
  "United States": [
    "Common Core State Standards",
    "Next Generation Science Standards (NGSS)",
    "Texas Essential Knowledge and Skills (TEKS)",
    "New York State Learning Standards"
  ],
  "Canada": [
    "Ontario Curriculum",
    "BC Curriculum",
    "Alberta Curriculum"
  ],
  "International": [
    "International Baccalaureate (IB)",
    "Cambridge Assessment International Education (CAIE)"
  ]
};

const FIELD_DATA: string[] = [
  "Mathematics",
  "English",
  "Science",
  "History / Humanities",
  "Geography",
  "Health & Physical Education",
  "Arts",
  "Languages",
  "Technology / IT",
  "Other..."
];

export function ResearchOnboarding() {
  const router = useRouter();

  // --- URL-Synchronized State (Preserves data on Language Switch & supports Browser Back Button) ---
  const [stepStr, setStepStr] = useQueryState("step", { defaultValue: "1", history: "push" });
  const currentStep = parseInt(stepStr || "1") as 1 | 2 | 3;
  const setCurrentStep = (val: 1|2|3) => setStepStr(val.toString());

  const [completeStr, setCompleteStr] = useQueryState("complete", { defaultValue: "false", history: "push" });
  const isComplete = completeStr === "true";
  const setIsComplete = (val: boolean) => setCompleteStr(val.toString());

  const [searchTextRaw, setSearchText] = useQueryState("search", { defaultValue: "" });
  const searchText = searchTextRaw || "";

  const [presetNameRaw, setPresetName] = useQueryState("preset", { defaultValue: "Preset 1" });
  const presetName = presetNameRaw || "Preset 1";

  const [isEditingPreset, setIsEditingPreset] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // UX Evaluation Error State
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Step 1 State
  const [yearStr, setYearStr] = useQueryState("year", { defaultValue: "" });
  const selectedYear = yearStr ? parseInt(yearStr) : null;
  const setSelectedYear = (val: number | null) => setYearStr(val ? val.toString() : "");

  const [selectedCountryRaw, setSelectedCountry] = useQueryState("country", { defaultValue: "Australia" });
  const selectedCountry = selectedCountryRaw || "Australia";

  const [selectedCurriculumRaw, setSelectedCurriculum] = useQueryState("curriculum", { defaultValue: CURRICULUM_DATA["Australia"][0] });
  const selectedCurriculum = selectedCurriculumRaw || CURRICULUM_DATA["Australia"][0];

  // Step 2 State
  const [classSizeRaw, setClassSize] = useQueryState("size", { defaultValue: "" });
  const classSize = classSizeRaw || "";

  const [selectedFieldRaw, setSelectedField] = useQueryState("field", { defaultValue: FIELD_DATA[0] });
  const selectedField = selectedFieldRaw || FIELD_DATA[0];

  const [otherFieldRaw, setOtherField] = useQueryState("other", { defaultValue: "" });
  const otherField = otherFieldRaw || "";

  // Step 3 State
  const [additionalNotesRaw, setAdditionalNotes] = useQueryState("notes", { defaultValue: "" });
  const additionalNotes = additionalNotesRaw || "";

  const years = [7, 8, 9, 10, 11, 12];
  const countries = Object.keys(CURRICULUM_DATA);

  useEffect(() => {
    if (isEditingPreset && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingPreset]);
  
  // Clear error whenever primary inputs change
  useEffect(() => {
    setErrorMsg("");
  }, [selectedYear, classSize, selectedField, otherField, additionalNotes, currentStep]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setSelectedCurriculum(CURRICULUM_DATA[country][0]);
  };

  const handleNext = () => {
    // Nielsen Heuristics #5 & #9: Error Prevention and Recovery
    if (currentStep === 1) {
      if (!selectedYear) {
        setErrorMsg("Please select a year level to proceed.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const sizeParsed = parseInt(classSize);
      if (!classSize || isNaN(sizeParsed) || sizeParsed <= 0) {
        setErrorMsg("Please enter a valid class size (e.g. 25).");
        return;
      }
      if (selectedField === "Other..." && !otherField.trim()) {
        setErrorMsg("Please specify your relevant field.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // End of Onboarding flow - Submission Logic
      setIsComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as 1 | 2 | 3);
  };

  if (isComplete) {
    const finalSubject = selectedField === "Other..." ? otherField : selectedField;
    return (
      <div className="w-full max-w-4xl flex flex-col items-start animate-in zoom-in-95 fade-in duration-700">
        
        {/* Preset Swap Header */}
        <div className="flex flex-col mb-2 pl-2">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <h2 className="text-3xl font-bold text-[#111827] leading-none mb-1">{presetName}</h2>
            <div className="p-2 border-2 border-white/40 rounded-xl bg-white/30 backdrop-blur-md shadow-sm flex items-center justify-center shrink-0 hover:bg-white transition-all transform hover:scale-105">
              <Repeat className="w-5 h-5 text-[#111827] stroke-[2.5]" />
            </div>
          </div>
          <p className="text-lg font-medium text-[#111827]/60 mt-1 pl-1">
            Your research was supported by...
          </p>
        </div>

        {/* Transparent Glassy Bounding Box */}
        <div className="w-full bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.1)] border border-white/60 p-6 md:p-8 flex flex-col gap-6">
          
          {/* Search Input Unit - Redesigned for Clarity and Cognitive Load Reduction */}
          <div className="w-full flex items-center bg-white/60 border-2 border-white/60 hover:bg-white/80 focus-within:bg-white focus-within:border-[#B7FF70] rounded-[2.5rem] p-2 transition-all shadow-md">
            <div className="pl-6 pr-4 text-[#111827]">
              <Search className="w-6 h-6" />
            </div>
            <input 
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search or curate across the web..."
              className="flex-1 bg-transparent py-4 text-xl font-bold text-[#111827] placeholder:text-gray-500 outline-none w-full"
            />
            <div className="flex items-center gap-2 pr-2">
              {searchText && (
                <button 
                  onClick={() => setSearchText("")} 
                  className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-black transition-colors rounded-full hover:bg-gray-200/50 hidden md:block"
                >
                  Clear
                </button>
              )}
              <button 
                onClick={() => {
                  if (searchText.trim() !== "") {
                    router.push(`/dashboard/search?q=${encodeURIComponent(searchText)}`);
                  }
                }}
                className="px-8 py-4 bg-[#111827] text-[#B7FF70] hover:scale-105 active:scale-95 transition-all rounded-[2rem] font-bold text-lg shadow-md whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </div>

          {/* Secondary Controls: Applied Tags */}
          <div className="flex flex-wrap items-start justify-between gap-4 px-2 -mt-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-5 py-2.5 bg-white border border-[#111827]/10 rounded-xl text-sm font-bold text-[#111827] shadow-sm cursor-default">
                {finalSubject || "Subject"}
              </div>
              <div className="px-5 py-2.5 bg-white border border-[#111827]/10 rounded-xl text-sm font-bold text-[#111827] shadow-sm cursor-default">
                Year {selectedYear || "Level"}
              </div>
              <div className="px-5 py-2.5 bg-white border border-[#111827]/10 rounded-xl text-sm font-bold text-[#111827] shadow-sm cursor-default">
                {classSize || "0"} people
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-xl shadow-black/[0.03] ring-1 ring-black/5 p-10 md:p-14 transition-all duration-300">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-8">
        {/* Editable Preset Title - Nielsen Heuristics #3: User control */}
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
              aria-label="Edit preset name"
            />
          ) : (
            <h2 className="text-2xl font-bold text-[#111827] cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsEditingPreset(true)}>
              {presetName}
            </h2>
          )}
          {!isEditingPreset && (
            <button onClick={() => setIsEditingPreset(true)} className="p-2 -ml-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100" aria-label="Edit preset title">
              <Pen className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Step Indicator - Nielsen Heuristics #1: System status */}
        <div className="text-lg font-semibold text-[#111827] tracking-tight" aria-live="polite">
          Step {currentStep}/3
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="flex w-full h-2 gap-2 mb-12" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={3}>
        <div className={`h-full w-1/3 rounded-full transition-colors duration-500 ${currentStep >= 1 ? "bg-[#B7FF70]" : "bg-gray-200"}`} />
        <div className={`h-full w-1/3 rounded-full transition-colors duration-500 ${currentStep >= 2 ? "bg-[#B7FF70]" : "bg-gray-200"}`} />
        <div className={`h-full w-1/3 rounded-full transition-colors duration-500 ${currentStep >= 3 ? "bg-[#B7FF70]" : "bg-gray-200"}`} />
      </div>

      {/* --- STEP 1 --- */}
      {currentStep === 1 && (
        <div className="space-y-12 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-2 items-center text-center max-w-2xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold text-[#111827] tracking-tight text-center">
              Tell us about what subject and year level you are curriculum to?
            </h3>
            <p className="text-gray-500 text-sm font-medium text-center w-full max-w-sm mx-auto leading-relaxed">
              Tell us about your educational context so we can tailor your research and resources.
            </p>
          </div>

          {/* Year Level Pills */}
          <div className="w-full">
            <label className="block text-xl font-bold text-[#111827] mb-4 text-left">Year</label>
            <div className="grid grid-cols-3 gap-4">
              {years.map((year) => {
                const isSelected = selectedYear === year;
                return (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-8 py-3 rounded-[2rem] font-semibold text-lg transition-all border-2 flex items-center justify-center ${
                      isSelected 
                        ? "border-[#B7FF70] bg-[#B7FF70] text-[#111827] shadow-md" 
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 bg-white"
                    }`}
                    aria-pressed={isSelected}
                  >
                    Year {year}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {/* Country Select */}
            <div className="w-full">
              <label className="block text-xl font-bold text-[#111827] mb-3 text-left">Country</label>
              <div className="relative">
                <select
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  className="w-full appearance-none bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 text-sm font-semibold text-[#111827] cursor-pointer hover:border-gray-300 focus:outline-none focus:border-[#B7FF70] transition-colors shadow-sm"
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Curriculum Select */}
            <div className="w-full">
              <label className="block text-xl font-bold text-[#111827] mb-3 text-left">Curriculum Framework</label>
              <div className="relative">
                <select
                  value={selectedCurriculum}
                  onChange={(e) => setSelectedCurriculum(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 text-sm font-semibold text-[#111827] cursor-pointer hover:border-gray-300 focus:outline-none focus:border-[#B7FF70] transition-colors shadow-sm text-ellipsis"
                >
                  {CURRICULUM_DATA[selectedCountry].map((curriculum) => (
                    <option key={curriculum} value={curriculum}>{curriculum}</option>
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

      {/* --- STEP 2 --- */}
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
            {/* Class Size Input */}
            <div className="w-full">
              <label className="block text-xl font-bold text-[#111827] mb-3 text-left">Class Size</label>
              <input
                type="number"
                min={1}
                max={150}
                placeholder="e.g. 25"
                value={classSize}
                onChange={(e) => setClassSize(e.target.value)}
                className="w-full appearance-none bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 text-sm font-semibold text-[#111827] hover:border-gray-300 focus:outline-none focus:border-[#B7FF70] transition-colors shadow-sm placeholder:text-gray-400 placeholder:font-normal"
              />
            </div>

            {/* Relevant Field Select */}
            <div className="w-full">
              <label className="block text-xl font-bold text-[#111827] mb-3 text-left">Relevant field</label>
              <div className="relative">
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 text-sm font-semibold text-[#111827] cursor-pointer hover:border-gray-300 focus:outline-none focus:border-[#B7FF70] transition-colors shadow-sm text-ellipsis"
                >
                  {FIELD_DATA.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* User Freedom: "Other" Input field drops down smoothly */}
            {selectedField === "Other..." && (
              <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-gray-500 mb-2 text-left">Specify your field</label>
                <input
                  type="text"
                  placeholder="e.g. Robotics, Advanced Philosophy..."
                  value={otherField}
                  onChange={(e) => setOtherField(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-2xl px-6 py-4 text-sm font-semibold text-[#111827] hover:border-gray-300 focus:outline-none focus:border-[#B7FF70] transition-colors shadow-sm placeholder:text-gray-400 placeholder:font-normal"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- STEP 3 --- */}
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
            ></textarea>
          </div>
        </div>
      )}

      {/* UX: Error Display Boundary */}
      {errorMsg && (
        <div className="mb-4 p-4 rounded-2xl bg-red-50 flex items-center justify-center gap-2 text-red-600 font-medium animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-end gap-4 mt-4 pt-8 border-t border-gray-100">
        {currentStep === 1 ? (
          <Link 
            href="/" 
            className="px-8 py-3 rounded-[2rem] text-base font-semibold text-[#111827] bg-white border-2 border-[#111827] hover:!bg-[#111827] hover:!text-white transition-all duration-300 shadow-sm inline-flex items-center justify-center"
          >
            Back
          </Link>
        ) : (
          <button 
            onClick={handleBack}
            className="px-8 py-3 rounded-[2rem] text-base font-semibold text-[#111827] bg-white border-2 border-[#111827] hover:!bg-[#111827] hover:!text-white transition-all duration-300 shadow-sm"
          >
            Back
          </button>
        )}
        
        <button 
          onClick={handleNext}
          className="px-8 py-3 rounded-[2rem] text-base font-semibold text-[#111827] bg-[#B7FF70] border-2 border-[#B7FF70] hover:!bg-[#111827] hover:!text-[#B7FF70] hover:!border-[#111827] transition-all duration-300 shadow-sm"
        >
          {currentStep === 3 ? "Complete" : "Next"}
        </button>
      </div>
    </div>
  );
}
