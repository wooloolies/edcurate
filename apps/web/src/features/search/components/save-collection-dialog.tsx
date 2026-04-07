"use client";

import { Globe, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SaveCollectionDialog({
  isOpen,
  onOpenChange,
  onSave,
  isSaving,
  defaultName = "",
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, isPublic: boolean) => void;
  isSaving: boolean;
  defaultName?: string;
}) {
  const t = useTranslations("search");
  const [name, setName] = useState(defaultName);
  const [isPublic, setIsPublic] = useState(false);
  const [showPublicWarning, setShowPublicWarning] = useState(false);

  const handleTogglePrivacy = () => {
    if (!isPublic) {
      // Trying to make it public - show warning
      setShowPublicWarning(true);
    } else {
      setIsPublic(false);
      setShowPublicWarning(false);
    }
  };

  const handleConfirmPublic = () => {
    setIsPublic(true);
    setShowPublicWarning(false);
  };

  const handleDisplayChange = (open: boolean) => {
    if (open && !isOpen) {
      setName(defaultName);
      setIsPublic(false);
      setShowPublicWarning(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDisplayChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{t("saveCollection.title", { fallback: "Save to Collection" })}</DialogTitle>
          <DialogDescription>
            {t("saveCollection.description", {
              fallback: "Group your selected resources into a named collection.",
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              {t("saveCollection.nameLabel", { fallback: "Collection Name" })}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("saveCollection.namePlaceholder", { fallback: "e.g., Physics 101" })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("saveCollection.privacyLabel", { fallback: "Privacy" })}</Label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={!isPublic ? "default" : "outline"}
                className="flex-1"
                onClick={() => {
                  setIsPublic(false);
                  setShowPublicWarning(false);
                }}
              >
                <Lock className="mr-2 h-4 w-4" />
                {t("saveCollection.private", { fallback: "Private" })}
              </Button>
              <Button
                type="button"
                variant={isPublic ? "default" : "outline"}
                className="flex-1"
                onClick={handleTogglePrivacy}
              >
                <Globe className="mr-2 h-4 w-4" />
                {t("saveCollection.public", { fallback: "Public" })}
              </Button>
            </div>

            {showPublicWarning && (
              <div className="mt-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-500 flex flex-col gap-2">
                <p>
                  {t("saveCollection.publicWarning", {
                    fallback:
                      "Are you sure you want to make this public? Anyone will be able to discover these resources in suggested collections.",
                  })}
                </p>
                <div className="flex gap-2 justify-end mt-1">
                  <Button size="sm" variant="outline" onClick={() => setShowPublicWarning(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleConfirmPublic}>
                    Confirm Public
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel", { fallback: "Cancel" })}
          </Button>
          <Button
            disabled={!name.trim() || isSaving || showPublicWarning}
            onClick={() => onSave(name, isPublic)}
          >
            {isSaving ? t("saving", { fallback: "Saving..." }) : t("save", { fallback: "Save" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
