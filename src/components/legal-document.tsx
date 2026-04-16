import Link from "next/link";
import type { ReactNode } from "react";

export function LegalDocument({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-muted/40 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-4 border-b border-border pb-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Back to PrintLoom
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Effective date: {effectiveDate}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link
              href="/privacy"
              className="text-primary underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-primary underline-offset-4 hover:underline"
            >
              Terms &amp; Conditions
            </Link>
          </nav>
        </div>
        <article className="space-y-10 text-sm leading-relaxed text-foreground md:text-[15px] [&_h2]:scroll-mt-20 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-medium [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:text-muted-foreground [&_section]:space-y-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </article>
      </div>
    </div>
  );
}
