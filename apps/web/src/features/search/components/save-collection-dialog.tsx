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
import { Textarea } from "@/components/ui/textarea";

export function SaveCollectionDialog({
  isOpen,
  onOpenChange,
  onSave,
  isSaving,
  defaultName = "",
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, isPublic: boolean, description?: string) => void;
  isSaving: boolean;
  defaultName?: string;
}) {
  const t = useTranslations("search");
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showPublicWarning, setShowPublicWarning] = useState(false);

  const handleTogglePrivacy = () => {
    if (!isPublic) {
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
      setDescription("");
      setIsPublic(false);
      setShowPublicWarning(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDisplayChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{t("saveCollection.title")}</DialogTitle>
          <DialogDescription>
            {t("saveCollection.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{t("saveCollection.nameLabel")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("saveCollection.namePlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">{t("saveCollection.descriptionLabel")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("saveCollection.descriptionPlaceholder")}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("saveCollection.privacyLabel")}</Label>

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
                {t("saveCollection.private")}
              </Button>
              <Button
                type="button"
                variant={isPublic ? "default" : "outline"}
                className="flex-1"
                onClick={handleTogglePrivacy}
              >
                <Globe className="mr-2 h-4 w-4" />
                {t("saveCollection.public")}
              </Button>
            </div>

            {showPublicWarning ? (
              <div className="mt-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-500 flex flex-col gap-2">
                <p>
                  {t("saveCollection.publicWarning")}
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
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            disabled={!name.trim() || isSaving || showPublicWarning}
            onClick={() => onSave(name, isPublic, description || undefined)}
          >
            {isSaving ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
