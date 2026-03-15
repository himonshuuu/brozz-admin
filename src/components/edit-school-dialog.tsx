import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as schoolsApi from "@/lib/api/schools";

type Props = {
  school: schoolsApi.SchoolDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function EditSchoolDialog({ school, open, onOpenChange, onUpdated }: Props) {
  const [form, setForm] = useState({
    name: school.name,
    email: school.email,
    mobileNumber: school.mobileNumber,
    address: school.address,
    city: school.city,
    state: school.state,
    zipCode: school.zipCode,
    country: school.country,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: school.name,
        email: school.email,
        mobileNumber: school.mobileNumber,
        address: school.address,
        city: school.city,
        state: school.state,
        zipCode: school.zipCode,
        country: school.country,
      });
    }
  }, [open, school]);

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) return;
    setLoading(true);
    try {
      await schoolsApi.updateSchool(school.id, {
        email: form.email.trim(),
        name: form.name.trim(),
        mobileNumber: form.mobileNumber.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zipCode: form.zipCode.trim(),
        country: form.country.trim(),
      });
      toast.success("School updated");
      onOpenChange(false);
      onUpdated?.();
    } catch (e: unknown) {
      toast.error("Failed to update school", {
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
          <DialogTitle>Edit School</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="schoolNameEdit">Name</Label>
            <Input
              id="schoolNameEdit"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schoolEmailEdit">Email</Label>
            <Input
              id="schoolEmailEdit"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schoolMobileEdit">Mobile number</Label>
            <Input
              id="schoolMobileEdit"
              value={form.mobileNumber}
              onChange={(e) => updateField("mobileNumber", e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schoolAddressEdit">Address</Label>
            <Input
              id="schoolAddressEdit"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="schoolCityEdit">City</Label>
              <Input
                id="schoolCityEdit"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="schoolStateEdit">State</Label>
              <Input
                id="schoolStateEdit"
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="schoolZipEdit">Zip code</Label>
              <Input
                id="schoolZipEdit"
                value={form.zipCode}
                onChange={(e) => updateField("zipCode", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="schoolCountryEdit">Country</Label>
              <Input
                id="schoolCountryEdit"
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
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

