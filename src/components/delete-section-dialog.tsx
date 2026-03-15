import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import * as sectionsApi from "@/lib/api/sections";

type Props = {
  section: sectionsApi.SectionDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteSectionDialog({ section, open, onOpenChange, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await sectionsApi.deleteSection(section.id);
      toast.success("Section deleted");
      onOpenChange(false);
      onDeleted?.();
    } catch (e: unknown) {
      toast.error("Failed to delete section", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Section</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Are you sure you want to delete the section "{section.name}"? This action cannot be undone.
          </div>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
