import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as studentsApi from "@/lib/api/students";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string | null;
  onCreated?: () => void;
};

export function AddStudentDialog({ open, onOpenChange, sectionId, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    roll: "",
    admissionNumber: "",
    name: "",
    fatherName: "",
    dob: "",
    phone: "",
    bloodGroup: "",
    address: "",
  });

  useEffect(() => {
    if (!open) {
      setForm({
        roll: "",
        admissionNumber: "",
        name: "",
        fatherName: "",
        dob: "",
        phone: "",
        bloodGroup: "",
        address: "",
      });
    }
  }, [open]);

  async function submit() {
    if (!sectionId) {
      toast.error("Select a section first");
      return;
    }
    setLoading(true);
    try {
      await studentsApi.createStudent({
        sectionId,
        roll: form.roll.trim(),
        admissionNumber: form.admissionNumber.trim(),
        name: form.name.trim(),
        fatherName: form.fatherName.trim(),
        dob: form.dob.trim(),
        phone: form.phone.trim(),
        bloodGroup: form.bloodGroup.trim(),
        address: form.address.trim(),
      });
      toast.success("Student created");
      onOpenChange(false);
      onCreated?.();
    } catch (e: unknown) {
      toast.error("Failed to create student", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  const disabled =
    loading ||
    !sectionId ||
    !form.roll.trim() ||
    !form.admissionNumber.trim() ||
    !form.name.trim() ||
    !form.fatherName.trim() ||
    !form.dob.trim() ||
    !form.phone.trim() ||
    !form.bloodGroup.trim() ||
    !form.address.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="roll">Roll</Label>
            <Input id="roll" value={form.roll} disabled={loading} onChange={(e) => setForm((p) => ({ ...p, roll: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admissionNumber">Admission #</Label>
            <Input id="admissionNumber" value={form.admissionNumber} disabled={loading} onChange={(e) => setForm((p) => ({ ...p, admissionNumber: e.target.value }))} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} disabled={loading} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="fatherName">Father name</Label>
            <Input id="fatherName" value={form.fatherName} disabled={loading} onChange={(e) => setForm((p) => ({ ...p, fatherName: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">DOB</Label>
            <Input id="dob" type="date" value={form.dob} disabled={loading} onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} disabled={loading} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodGroup">Blood group</Label>
            <Input id="bloodGroup" value={form.bloodGroup} disabled={loading} onChange={(e) => setForm((p) => ({ ...p, bloodGroup: e.target.value }))} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} disabled={loading} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={disabled}>
            {loading ? "Saving..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

