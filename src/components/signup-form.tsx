"use client";

import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  resendOtp as apiResendOtp,
  verifyOtp as apiVerifyOtp,
  login,
  register,
} from "@/lib/api/auth";
import { cn } from "@/lib/utils";

const SIGNUP_OTP_SESSION_KEY = "signup.pendingVerification";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"register" | "verify">("register");
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");

  useEffect(() => {
    const rawState = window.sessionStorage.getItem(SIGNUP_OTP_SESSION_KEY);
    if (!rawState) return;

    try {
      const state = JSON.parse(rawState) as { email?: string };
      if (!state.email) return;
      setPendingEmail(state.email);
      setStep("verify");
    } catch {
      window.sessionStorage.removeItem(SIGNUP_OTP_SESSION_KEY);
    }
  }, []);

  function persistPendingVerification(email: string) {
    window.sessionStorage.setItem(
      SIGNUP_OTP_SESSION_KEY,
      JSON.stringify({ email }),
    );
  }

  function clearPendingVerification() {
    window.sessionStorage.removeItem(SIGNUP_OTP_SESSION_KEY);
    setOtp("");
    setPendingEmail("");
    setPendingPassword("");
    setStep("register");
  }

  async function registerOrganization(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
      name: String(fd.get("name") || ""),
      organizationType: String(fd.get("organizationType") || "") as
        | "organization"
        | "college"
        | "university"
        | "coaching"
        | "company"
        | "ngo"
        | "government"
        | "other",
    };

    setLoading(true);
    try {
      await register(payload);
      setPendingEmail(payload.email);
      setPendingPassword(payload.password);
      persistPendingVerification(payload.email);
      setOtp("");
      setStep("verify");
      toast.success("OTP sent to your email");
    } catch (err: unknown) {
      toast.error("Signup failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!pendingEmail) return;
    setLoading(true);
    try {
      await apiVerifyOtp(pendingEmail, otp);
      window.sessionStorage.removeItem(SIGNUP_OTP_SESSION_KEY);

      if (!pendingPassword) {
        toast.success("Account verified. Please login.");
        router.push("/login");
        return;
      }

      // auto-login after verify
      const loginJson = await login(pendingEmail, pendingPassword);
      if (!loginJson?.success) {
        toast.success("Verified. Please login.");
        router.push("/login");
        return;
      }
      const token = loginJson.data?.token as string | undefined;
      if (token) window.localStorage.setItem("token", token);
      toast.success("Account verified");
      router.push("/datasets");
    } catch (err: unknown) {
      toast.error("Verification failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!pendingEmail) return;
    setLoading(true);
    try {
      await apiResendOtp(pendingEmail);
      toast.success("OTP resent");
    } catch (err: unknown) {
      toast.error("Resend failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {step === "register" ? "Create organization account" : "Verify OTP"}
          </CardTitle>
          <CardDescription>
            {step === "register"
              ? "Register your organization and verify email via OTP"
              : `Enter the OTP sent to ${pendingEmail}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "register" ? (
            <form onSubmit={registerOrganization}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Organization Name</FieldLabel>
                  <Input id="name" name="name" required disabled={loading} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="organizationType">
                    Organization Type
                  </FieldLabel>
                  <Select
                    name="organizationType"
                    required
                    disabled={loading}
                    defaultValue="organization"
                  >
                    <SelectTrigger id="organizationType" className="w-full">
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="organization">Organization</SelectItem>
                      <SelectItem value="college">College</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                      <SelectItem value="coaching">Coaching</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="ngo">NGO</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={loading}
                  />
                  <FieldDescription>
                    Must be at least 8 characters long.
                  </FieldDescription>
                </Field>
                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Account"}
                  </Button>
                  <FieldDescription className="text-center">
                    Already have an account? <a href="/login">Sign in</a>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          ) : (
            <div className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="otp">OTP</FieldLabel>
                  <InputOTP
                    id="otp"
                    name="otp"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    disabled={loading}
                    containerClassName="justify-start sm:justify-center"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <FieldDescription>
                    Reloading this page will keep you on verification, but you
                    still need to enter the OTP again.
                  </FieldDescription>
                </Field>
                <Field>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.trim().length !== 6}
                    >
                      {loading ? "Verifying..." : "Verify"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResendOtp}
                      disabled={loading}
                    >
                      Resend OTP
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={clearPendingVerification}
                      disabled={loading}
                    >
                      Start over
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </div>
          )}
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <a href="/terms">Terms &amp; Conditions</a> and{" "}
        <a href="/privacy">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
