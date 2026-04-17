import { AccountsPage } from "@/components/accounts-page";

export default function AdminsPage() {
  return <AccountsPage role="ADMIN" title="Admin Accounts" canCreate />;
}
