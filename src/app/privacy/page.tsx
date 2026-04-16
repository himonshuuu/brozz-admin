import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy – PrintLoom",
  description:
    "How PrintLoom collects, uses, and protects your data for ID card printing and organization data management.",
};

const SUPPORT_EMAIL = "printloomofficial@gmail.com";
const EFFECTIVE_DATE = "April 17, 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument title="Privacy Policy" effectiveDate={EFFECTIVE_DATE}>
      <section>
        <h2>1. Introduction</h2>
        <p>
          Welcome to PrintLoom (“we”, “our”, “us”). PrintLoom is a smart ID card
          printing and data management platform built for organizations such as
          schools, businesses, and institutions.
        </p>
        <p>
          We are committed to protecting your privacy and ensuring transparency
          about how your data is handled.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <h3>A. Account information</h3>
        <p>When you register, we collect:</p>
        <ul>
          <li>Full name</li>
          <li>Email address</li>
          <li>Password (securely hashed)</li>
          <li>OTP for verification</li>
        </ul>

        <h3>B. Organization information</h3>
        <ul>
          <li>Organization name</li>
          <li>Organization type</li>
          <li>Organization ID</li>
        </ul>

        <h3>C. User-uploaded data</h3>
        <p>Organizations may upload and manage datasets, including:</p>
        <ul>
          <li>Names, IDs, roll numbers</li>
          <li>Photos or images</li>
          <li>QR codes and barcodes</li>
          <li>Custom fields</li>
        </ul>
        <p>
          <strong className="text-foreground">Important:</strong> This data is
          fully controlled and uploaded by the organization using PrintLoom.
        </p>

        <h3>D. Device and technical data</h3>
        <ul>
          <li>
            Authentication tokens (stored securely using Expo SecureStore where
            applicable)
          </li>
          <li>Cached data (AsyncStorage)</li>
          <li>App version and device type</li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Data</h2>
        <p>We use collected data to:</p>
        <ul>
          <li>Provide login and authentication</li>
          <li>Manage datasets and records</li>
          <li>Process file imports (Excel and CSV)</li>
          <li>Generate ID cards and downloadable files</li>
          <li>Send OTP and security-related messages</li>
        </ul>
      </section>

      <section>
        <h2>4. Data Sharing</h2>
        <p>We do not sell user data.</p>
        <p>Data may be shared only:</p>
        <ul>
          <li>With your organization (as part of platform usage)</li>
          <li>With backend infrastructure services (secure APIs)</li>
          <li>When required by law</li>
        </ul>
      </section>

      <section>
        <h2>5. Data Security</h2>
        <p>We implement:</p>
        <ul>
          <li>HTTPS (TLS encryption)</li>
          <li>Secure token storage (SecureStore)</li>
          <li>Encrypted authentication systems</li>
        </ul>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>We retain data:</p>
        <ul>
          <li>As long as your account is active</li>
          <li>Until you delete datasets or your account</li>
        </ul>
      </section>

      <section>
        <h2>7. Account &amp; Data Deletion</h2>
        <p>
          You can delete your organization account using an authenticated
          request to:
        </p>
        <p className="font-mono text-foreground">
          https://api.printloom.in/auth/me
        </p>
        <p>
          Use the HTTP DELETE method with a valid bearer token (as provided when
          you sign in).
        </p>
        <p>Upon deletion:</p>
        <ul>
          <li>
            Your account data will be removed or marked deleted as designed
          </li>
          <li>Associated datasets may be permanently deleted</li>
        </ul>
      </section>

      <section>
        <h2>8. User Responsibility</h2>
        <p>Organizations using PrintLoom must:</p>
        <ul>
          <li>Have proper consent to upload personal data</li>
          <li>Ensure compliance with applicable privacy laws</li>
          <li>Protect sensitive information</li>
        </ul>
      </section>

      <section>
        <h2>9. Third-Party Services</h2>
        <p>We may use:</p>
        <ul>
          <li>Expo (EAS, updates, push services)</li>
          <li>Backend APIs</li>
        </ul>
        <p>These services follow their own privacy policies.</p>
      </section>

      <section>
        <h2>10. Children&apos;s Privacy</h2>
        <p>
          PrintLoom is intended for organizational use only, not direct use by
          children.
        </p>
      </section>

      <section>
        <h2>11. Changes to Policy</h2>
        <p>
          We may update this policy. Continued use of the platform after changes
          constitutes acceptance of the updated policy.
        </p>
      </section>

      <section>
        <h2>12. Contact</h2>
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
