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
import { useState } from "react";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
	requestPasswordReset,
	resetPassword,
} from "@/lib/api/auth";

export function ForgotPasswordForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [loading, setLoading] = useState(false);
	const [step, setStep] = useState<"request" | "reset">("request");
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");

	async function handleRequest(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const value = String(fd.get("email") || "").trim();
		if (!value) return;
		setLoading(true);
		try {
			const res = await requestPasswordReset(value);
			setEmail(value);
			toast.success("Check your email", {
				description: res.message,
			});
			setStep("reset");
		} catch {
			// For security, still show generic message.
			toast.success("If an account exists, a reset code has been sent.");
		} finally {
			setLoading(false);
		}
	}

	async function handleReset(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const password = String(fd.get("password") || "");
		if (!email || !otp || !password) return;
		setLoading(true);
		try {
			const res = await resetPassword(email, otp, password);
			toast.success("Password reset", {
				description: res.message,
			});
		} catch (err: unknown) {
			toast.error("Reset failed", {
				description: err instanceof Error ? err.message : "Invalid or expired link",
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
					{step === "request" ? "Forgot password" : "Reset password"}
					</CardTitle>
					<CardDescription>
						{step === "request"
							? "Enter your email to receive a reset code."
							: `Enter the reset code from your email and choose a new password.`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{step === "request" ? (
						<form onSubmit={handleRequest}>
							<FieldGroup>
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
									<Button type="submit" disabled={loading}>
										{loading ? "Sending..." : "Send reset link"}
									</Button>
								</Field>
							</FieldGroup>
						</form>
					) : (
						<form onSubmit={handleReset}>
							<FieldGroup>
								<Field>
									<FieldLabel>Email</FieldLabel>
									<Input value={email} disabled />
								</Field>
								<Field>
									<FieldLabel htmlFor="otp">Reset code</FieldLabel>
									<InputOTP
										id="otp"
										name="otp"
										maxLength={6}
										pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
										value={otp}
										onChange={setOtp}
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
									<FieldDescription>
										Or paste the code from the reset link.
									</FieldDescription>
								</Field>
								<Field>
									<FieldLabel htmlFor="password">New password</FieldLabel>
									<Input
										id="password"
										name="password"
										type="password"
										minLength={8}
										required
										disabled={loading}
									/>
									<FieldDescription>
										Must be at least 8 characters long.
									</FieldDescription>
								</Field>
								<Field>
									<Button type="submit" disabled={loading || otp.length === 0}>
										{loading ? "Resetting..." : "Reset password"}
									</Button>
								</Field>
							</FieldGroup>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

