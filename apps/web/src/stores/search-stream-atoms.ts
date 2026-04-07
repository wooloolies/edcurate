import { atom } from "jotai";

import type { SearchStreamState } from "@/features/search/types/search-stream";

export const searchStreamAtom = atom<SearchStreamState>({
  stages: {},
  activeStage: null,
  resourceProgress: new Map(),
  result: null,
  isCached: false,
  isStreaming: false,
  error: null,
});

searchStreamAtom.debugLabel = "searchStream";
