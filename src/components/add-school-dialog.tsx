import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as schoolsApi from "@/lib/api/schools";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function AddSchoolDialog({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) return;
    setLoading(true);
    try {
      await schoolsApi.createSchool({
        email: form.email.trim(),
        name: form.name.trim(),
        mobileNumber: form.mobileNumber.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zipCode: form.zipCode.trim(),
        country: form.country.trim(),
      });
      toast.success("School created");
      setForm({
        name: "",
        email: "",
        mobileNumber: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      });
      onOpenChange(false);
      onCreated?.();
    } catch (e: unknown) {
      toast.error("Failed to create school", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add School</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="schoolName">Name</Label>
            <Input
              id="schoolName"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schoolEmail">Email</Label>
            <Input
              id="schoolEmail"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schoolMobile">Mobile number</Label>
            <Input
              id="schoolMobile"
              value={form.mobileNumber}
              onChange={(e) => updateField("mobileNumber", e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schoolAddress">Address</Label>
            <Input
              id="schoolAddress"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="schoolCity">City</Label>
              <Input
                id="schoolCity"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="schoolState">State</Label>
              <Input
                id="schoolState"
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="schoolZip">Zip code</Label>
              <Input
                id="schoolZip"
                value={form.zipCode}
                onChange={(e) => updateField("zipCode", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="schoolCountry">Country</Label>
              <Input
                id="schoolCountry"
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading || !form.name.trim() || !form.email.trim()}>
            {loading ? "Saving..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

