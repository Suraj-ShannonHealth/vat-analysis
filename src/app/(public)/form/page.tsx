import FormWizard from "@/components/form/FormWizard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";

export default function FormPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span className="font-semibold">VAT Approval</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Exit
            </Button>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <FormWizard />
      </main>
    </div>
  );
}
