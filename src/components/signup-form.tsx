"use client";

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
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
	InputOTP,
	InputOTPSeparator,
	InputOTPSlot,
	InputOTPGroup,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { login, schoolRegister, schoolResendOtp, schoolVerifyOtp } from "@/lib/api/auth";

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

	async function registerSchool(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const payload = {
			email: String(fd.get("email") || ""),
			password: String(fd.get("password") || ""),
			name: String(fd.get("name") || ""),
			address: String(fd.get("address") || ""),
			city: String(fd.get("city") || ""),
			state: String(fd.get("state") || ""),
			zipCode: String(fd.get("zipCode") || ""),
			country: String(fd.get("country") || ""),
			mobileNumber: String(fd.get("mobileNumber") || ""),
		};

		setLoading(true);
		try {
			await schoolRegister(payload);
			setPendingEmail(payload.email);
			setPendingPassword(payload.password);
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

	async function verifyOtp() {
		if (!pendingEmail) return;
		setLoading(true);
		try {
			await schoolVerifyOtp(pendingEmail, otp);

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
			router.push("/classes");
		} catch (err: unknown) {
			toast.error("Verification failed", {
				description: err instanceof Error ? err.message : "Unknown error",
			});
		} finally {
			setLoading(false);
		}
	}

	async function resendOtp() {
		if (!pendingEmail) return;
		setLoading(true);
		try {
			await schoolResendOtp(pendingEmail);
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
						{step === "register" ? "Create school account" : "Verify OTP"}
					</CardTitle>
					<CardDescription>
						{step === "register"
							? "Register your school and verify email via OTP"
							: `Enter the OTP sent to ${pendingEmail}`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{step === "register" ? (
						<form onSubmit={registerSchool}>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="name">School Name</FieldLabel>
									<Input id="name" name="name" required disabled={loading} />
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
									<FieldLabel htmlFor="mobileNumber">Mobile Number</FieldLabel>
									<Input
										id="mobileNumber"
										name="mobileNumber"
										required
										disabled={loading}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="address">Address</FieldLabel>
									<Input
										id="address"
										name="address"
										required
										disabled={loading}
									/>
								</Field>
								<Field>
									<Field className="grid grid-cols-2 gap-4">
										<Field>
											<FieldLabel htmlFor="city">City</FieldLabel>
											<Input
												id="city"
												name="city"
												required
												disabled={loading}
											/>
										</Field>
										<Field>
											<FieldLabel htmlFor="state">State</FieldLabel>
											<Input
												id="state"
												name="state"
												required
												disabled={loading}
											/>
										</Field>
									</Field>
								</Field>
								<Field>
									<Field className="grid grid-cols-2 gap-4">
										<Field>
											<FieldLabel htmlFor="zipCode">Zip Code</FieldLabel>
											<Input
												id="zipCode"
												name="zipCode"
												required
												disabled={loading}
											/>
										</Field>
										<Field>
											<FieldLabel htmlFor="country">Country</FieldLabel>
											<Input
												id="country"
												name="country"
												required
												disabled={loading}
											/>
										</Field>
									</Field>
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
								</Field>
								<Field>
									<div className="flex gap-2">
										<Button
											onClick={verifyOtp}
											disabled={loading || otp.trim().length === 0}
										>
											{loading ? "Verifying..." : "Verify"}
										</Button>
										<Button
											variant="outline"
											onClick={resendOtp}
											disabled={loading}
										>
											Resend OTP
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
				<a href="/terms-of-service">Terms of Service</a> and{" "}
				<a href="/privacy-policy">Privacy Policy</a>.
			</FieldDescription>
		</div>
	);
}
