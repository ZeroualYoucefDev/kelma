import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "@fontsource-variable/manrope";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
import { appConfig } from "@/lib/config";
import { clerkConfigured } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: `${appConfig.name} — ${appConfig.tagline}`,
    template: `%s · ${appConfig.name}`,
  },
  description: appConfig.description,
  applicationName: appConfig.name,
  openGraph: {
    title: `${appConfig.name} — ${appConfig.tagline}`,
    description: appConfig.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tree = (
    <html lang="en">
      <body className="min-h-screen bg-ink text-slate-100">
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: "!border-line !bg-surface-2 !text-white",
            },
          }}
        />
      </body>
    </html>
  );

  // ClerkProvider requires live keys; local UI preview runs without them.
  return clerkConfigured ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
