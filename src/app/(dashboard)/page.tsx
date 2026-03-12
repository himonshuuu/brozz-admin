import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
					<p className="text-sm text-muted-foreground">Quick overview.</p>
				</div>

				<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card className="@container/card">
						<CardHeader>
							<CardDescription>Total classes</CardDescription>
							<CardTitle className="text-3xl font-semibold tabular-nums">
								12
							</CardTitle>
							<CardAction>
								<Badge variant="outline">This month +2</Badge>
							</CardAction>
						</CardHeader>
					</Card>
					<Card className="@container/card">
						<CardHeader>
							<CardDescription>Total sections</CardDescription>
							<CardTitle className="text-3xl font-semibold tabular-nums">
								48
							</CardTitle>
							<CardAction>
								<Badge variant="outline">This month +6</Badge>
							</CardAction>
						</CardHeader>
					</Card>
					<Card className="@container/card">
						<CardHeader>
							<CardDescription>Total students</CardDescription>
							<CardTitle className="text-3xl font-semibold tabular-nums">
								3,240
							</CardTitle>
							<CardAction>
								<Badge variant="outline">Today +14</Badge>
							</CardAction>
						</CardHeader>
					</Card>
					<Card className="@container/card">
						<CardHeader>
							<CardDescription>Imports</CardDescription>
							<CardTitle className="text-3xl font-semibold tabular-nums">
								5
							</CardTitle>
							<CardAction>
								<Badge variant="outline">2 running</Badge>
							</CardAction>
						</CardHeader>
					</Card>
				</div>
			</div>
		</div>
	);
}
