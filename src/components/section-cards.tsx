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

const classesData = [
  {
    name: "Class 1",
    students: 320,
    sections: 4,
  },
  {
    name: "Class 2",
    students: 280,
    sections: 5,
  },
  {
    name: "Class 3",
    students: 250,
    sections: 4,
  },
  {
    name: "Class 4",
    students: 120,
    sections: 3,
  },
];

// ROLL	CLASS SECTION	ADM	NAME	FATHER	DOB	PHONE	BLOOD	ADDRESS
// 1	VI A	777	ABHISEK GOUDA	AJIT KUMAR GOUDA	15.10.2014	9861585384	O+	Rama Laxmi Nagar, Chatrapur
// 2	VI A	801	ALISHA PATRA	DILIP KUMAR PATRA	12.12.2014	9692241644	B+	RAJAPUR RAGHUNATH TEMPLE, CHATRAPUR
// 3	VI A	762	ANJALI GOUDA	SANTOS KUMAR GOUDA	21.08.2014	7894908066	O+	CIRCUIT HOUSE, CHATRAPUR
// 4	VI A	784	ANUSHKA BISHOYI	MAGUNI BISHOYI	05.03.2015	7894588682	O+	KARAPALLI, CHATRAPUR
// 5	VI A	809	ARIYAN PRADHAN	ABINASH KUMAR PRADHAN	15.07.2014	6370069225	AB+	SRI KRISHNA VIHAR 5TH LANE, AMBPUA
// 6	VI A	815	ARPITA KUMARI SETHY	BINOD KUMAR SETHY	24.05.2014	9776649953	B+	RAM LAXMI NAGAR, CHATRAPUR
// 7	VI A	816	ASLESH KUMAR GOUDA	SUSANTA KUMAR GOUDA	10.08.2013	7894582883	A+	NEW NAGULPETA, CHATRAPUR
// 8	VI A	834	AYUSHMAN DAS	PRAKASH KUMAR  DAS	27.06.2014	9583600565	AB+	AGASTINUAGAON, CHATRAPUR
// 9	VI A	786	BINAYA BISHOYI	SATYA NARAYANA BISHOYI	04.04.2014	7854966048	B+	SUNDARPUR, CHATRAPUR

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {classesData.map((cls) => (
        <Card key={cls.name} className="@container/card">
          <CardHeader>
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {cls.students}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <HugeiconsIcon icon={User02Icon} strokeWidth={2} />
                {cls.sections}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {cls.name}
            </div>
            <div className="text-muted-foreground">{cls.students} students</div>
            <div className="text-muted-foreground">{cls.sections} sections</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
