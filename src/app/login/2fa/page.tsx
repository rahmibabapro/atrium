import type { Metadata } from "next";
import { TwoFactorForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Two-factor" };

export default function TwoFactorPage() {
  return (
    <div className="container flex justify-center py-16">
      <TwoFactorForm />
    </div>
  );
}
