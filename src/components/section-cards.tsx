"use client";

import { User02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const datasetCards = [
  {
    name: "Employee IDs",
    records: 320,
    fields: 14,
  },
  {
    name: "Visitor Badges",
    records: 280,
    fields: 8,
  },
  {
    name: "Contractor Cards",
    records: 250,
    fields: 11,
  },
  {
    name: "Event Passes",
    records: 120,
    fields: 6,
  },
];

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {datasetCards.map((dataset) => (
        <Card key={dataset.name} className="@container/card">
          <CardHeader>
            <CardDescription>Total Records</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {dataset.records}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <HugeiconsIcon icon={User02Icon} strokeWidth={2} />
                {dataset.fields}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {dataset.name}
            </div>
            <div className="text-muted-foreground">{dataset.records} records</div>
            <div className="text-muted-foreground">{dataset.fields} mapped fields</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
