import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Terms & Conditions – PrintLoom",
  description:
    "Terms of use for PrintLoom: ID card printing, datasets, and organizational accounts.",
};

const SUPPORT_EMAIL = "support@printloom.in";
const EFFECTIVE_DATE = "April 17, 2026";

export default function TermsPage() {
  return (
    <LegalDocument title="Terms & Conditions" effectiveDate={EFFECTIVE_DATE}>
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>By using PrintLoom, you agree to these Terms.</p>
        <p>If you do not agree, do not use the platform.</p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>PrintLoom provides:</p>
        <ul>
          <li>Dataset management</li>
          <li>ID card design tools</li>
          <li>Bulk print generation</li>
          <li>Multi-organization support</li>
        </ul>
      </section>

      <section>
        <h2>3. Account Responsibilities</h2>
        <p>You agree to:</p>
        <ul>
          <li>Provide accurate information</li>
          <li>Keep credentials secure</li>
          <li>Not share unauthorized access</li>
        </ul>
      </section>

      <section>
        <h2>4. Data Ownership</h2>
        <p>You retain full ownership of your uploaded data.</p>
        <p>PrintLoom only processes and stores it to provide the service.</p>
      </section>

      <section>
        <h2>5. Acceptable Use</h2>
        <p>You must NOT:</p>
        <ul>
          <li>Upload illegal or unauthorized data</li>
          <li>Violate privacy laws</li>
          <li>Use the platform for harmful or fraudulent purposes</li>
        </ul>
      </section>

      <section>
        <h2>6. Data Compliance</h2>
        <p>You are responsible for:</p>
        <ul>
          <li>Getting consent from individuals (students, employees, etc.)</li>
          <li>Complying with applicable laws (for example GDPR, IT Act)</li>
        </ul>
      </section>

      <section>
        <h2>7. Service Availability</h2>
        <p>We aim for high uptime but:</p>
        <ul>
          <li>We do not guarantee uninterrupted service</li>
          <li>We may perform maintenance</li>
        </ul>
      </section>

      <section>
        <h2>8. Termination</h2>
        <p>We may suspend or terminate accounts if:</p>
        <ul>
          <li>Terms are violated</li>
          <li>Illegal activity is detected</li>
        </ul>
      </section>

      <section>
        <h2>9. Limitation of Liability</h2>
        <p>PrintLoom is not liable for:</p>
        <ul>
          <li>Data loss due to user actions</li>
          <li>Misuse of uploaded data</li>
          <li>Third-party service failures</li>
        </ul>
      </section>

      <section>
        <h2>10. Intellectual Property</h2>
        <p>Platform code and design belong to PrintLoom.</p>
        <p>Users retain ownership of their uploaded data.</p>
      </section>

      <section>
        <h2>11. Changes to Terms</h2>
        <p>
          We may update these Terms at any time. Continued use may constitute
          acceptance of changes; check this page periodically.
        </p>
      </section>

      <section>
        <h2>12. Governing Law</h2>
        <p>These terms are governed by the laws of India.</p>
      </section>

      <section>
        <h2>13. Contact</h2>
        <p>
          Email:{" "}
          <a
            className="text-primary underline underline-offset-4"
            href={`mailto:${SUPPORT_EMAIL}`}
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </LegalDocument>
  );
}
