"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <AlertTriangle className="mx-auto size-12 text-rose" />
        <h1 className="mt-6 font-display text-2xl font-bold">Something went wrong.</h1>
        <p className="mt-3 text-sm text-slate-400">
          A live provider may be unavailable. Try again — your progress is safe.
        </p>
        <Button className="mt-7" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
