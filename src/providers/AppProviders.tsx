import { ConvexReactClient, ConvexProvider } from "convex/react";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { LanguageProvider } from "@/providers/LanguageProvider";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

const convexClient = convexUrl
  ? new ConvexReactClient(convexUrl)
  : null;

function ConvexUrlGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!convexUrl) {
      toast.error(
        "VITE_CONVEX_URL is missing from .env.local. Add your Cloud URL and restart npm run dev.",
        { duration: 8000 },
      );
    }
  }, []);

  if (!convexClient) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-lg font-medium">
          Set VITE_CONVEX_URL in .env.local, then restart the dev server.
        </p>
      </div>
    );
  }

  return <ConvexProvider client={convexClient}>
    <LanguageProvider>{children}</LanguageProvider>
  </ConvexProvider>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return <ConvexUrlGuard>{children}</ConvexUrlGuard>;
}
