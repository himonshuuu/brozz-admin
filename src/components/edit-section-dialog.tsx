import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as sectionsApi from "@/lib/api/sections";

type Props = {
  section: sectionsApi.SectionDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function EditSectionDialog({ section, open, onOpenChange, onUpdated }: Props) {
  const [name, setName] = useState(section.name);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(section.name);
    }
  }, [open, section.name]);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await sectionsApi.updateSection(section.id, { name: name.trim() });
      toast.success("Section updated");
      onOpenChange(false);
      onUpdated?.();
    } catch (e: unknown) {
      toast.error("Failed to update section", {
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
          <DialogTitle>Edit Section</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="sectionName">Section name</Label>
          <Input
            id="sectionName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. A"
            disabled={loading}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading || !name.trim()}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
