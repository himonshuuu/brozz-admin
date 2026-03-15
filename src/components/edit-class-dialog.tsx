import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as classesApi from "@/lib/api/classes";

type Props = {
  cls: classesApi.ClassDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function EditClassDialog({ cls, open, onOpenChange, onUpdated }: Props) {
  const [name, setName] = useState(cls.name);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(cls.name);
    }
  }, [open, cls.name]);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await classesApi.updateClass(cls.id, { name: name.trim() });
      toast.success("Class updated");
      onOpenChange(false);
      onUpdated?.();
    } catch (e: unknown) {
      toast.error("Failed to update class", {
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
          <DialogTitle>Edit Class</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="className">Class name</Label>
          <Input
            id="className"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 10"
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
