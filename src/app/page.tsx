import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">VAT Approval</span>
          </div>
          <Link href="/admin/login">
            <Button variant="ghost" size="sm">
              <Shield className="h-4 w-4 mr-1" />
              Admin
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl md:text-3xl">
              VAT Approval Form
            </CardTitle>
            <CardDescription className="text-base">
              Thank you for your interest in submitting a new product for VAT
              approval. Our goal is to thoroughly evaluate the clinical and
              cost-effectiveness of each request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
              <p className="font-medium mb-1">Important</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Submissions must be received at least{" "}
                  <strong>seven business days</strong> before the scheduled VAT
                  meeting.
                </li>
                <li>
                  Requests submitted after this deadline will be added to the
                  agenda for the following month.
                </li>
                <li>
                  All questions must be fully answered. Incomplete responses such
                  as “N/A,” “TBD,” or similar will not be accepted and may result
                  in delays.
                </li>
              </ul>
            </div>

            <div className="flex justify-center pt-2">
              <Link href="/form">
                <Button size="lg" className="px-8">
                  Start Submission
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        VAT Approval System
      </footer>
    </div>
  );
}
