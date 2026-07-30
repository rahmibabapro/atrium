import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/AuthForms";
import { getServerSession } from "@/lib/atriumid/session";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage() {
  const session = await getServerSession();
  if (session) redirect("/account");

  return (
    <div className="container flex justify-center py-16">
      <RegisterForm />
    </div>
  );
}
