import { atom } from "jotai";

import type { ResourceCard } from "@/lib/api/model";

/** Active preset ID — shared across search page components */
export const searchPresetIdAtom = atom<string | null>(null);
searchPresetIdAtom.debugLabel = "searchPresetId";

/** Selected resources for batch save */
export const selectedResourcesAtom = atom<Map<string, ResourceCard>>(new Map());
selectedResourcesAtom.debugLabel = "selectedResources";

/** Derived: toggle a resource's checked state */
export const toggleResourceAtom = atom(
  null,
  (_get, set, { resource, checked }: { resource: ResourceCard; checked: boolean }) => {
    set(selectedResourcesAtom, (prev) => {
      const next = new Map(prev);
      if (checked) {
        next.set(resource.url, resource);
      } else {
        next.delete(resource.url);
      }
      return next;
    });
  }
);
toggleResourceAtom.debugLabel = "toggleResource";

/** Derived: clear all selected resources */
export const clearSelectionAtom = atom(null, (_get, set) => {
  set(selectedResourcesAtom, new Map());
});
clearSelectionAtom.debugLabel = "clearSelection";
