import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as classesApi from "@/lib/api/classes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function AddClassDialog({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await classesApi.createClass({ name: name.trim() });
      toast.success("Class created");
      setName("");
      onOpenChange(false);
      onCreated?.();
    } catch (e: unknown) {
      toast.error("Failed to create class", {
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
          <DialogTitle>Add Class</DialogTitle>
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
            {loading ? "Saving..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

