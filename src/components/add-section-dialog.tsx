import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as sectionsApi from "@/lib/api/sections";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string | null;
  onCreated?: () => void;
};

export function AddSectionDialog({ open, onOpenChange, classId, onCreated }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  async function submit() {
    if (!classId) {
      toast.error("Select a class first");
      return;
    }
    if (!name.trim()) return;
    setLoading(true);
    try {
      await sectionsApi.createSection({ classId, name: name.trim() });
      toast.success("Section created");
      onOpenChange(false);
      onCreated?.();
    } catch (e: unknown) {
      toast.error("Failed to create section", {
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
          <DialogTitle>Add Section</DialogTitle>
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
          <Button onClick={submit} disabled={loading || !name.trim() || !classId}>
            {loading ? "Saving..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

