import { atom } from "jotai";

import type { SearchStreamState } from "@/features/search/types/search-stream";

export const INITIAL_STREAM_STATE: SearchStreamState = {
  stages: {},
  activeStage: null,
  resourceProgress: new Map(),
  result: null,
  isCached: false,
  isStreaming: false,
  error: null,
  partialResults: null,
  partialJudgments: new Map(),
  evaluationIds: new Map(),
};

export const searchStreamAtom = atom<SearchStreamState>(INITIAL_STREAM_STATE);

searchStreamAtom.debugLabel = "searchStream";
