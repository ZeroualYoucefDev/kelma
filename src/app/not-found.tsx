import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <Compass className="mx-auto size-14 text-accent" />
        <p className="mt-6 font-display text-6xl font-extrabold">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold">This path is off the map.</h1>
        <p className="mt-3 text-sm text-slate-400">The lesson or page you asked for does not exist.</p>
        <Button asChild className="mt-7">
          <Link href="/learn">
            <ArrowLeft className="size-4" /> Back to learning
          </Link>
        </Button>
      </div>
    </main>
  );
}
