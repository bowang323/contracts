import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProviders } from "@/providers/AppProviders";
import { App } from "./App";
import { isSafariBrowser } from "@/lib/is-safari";
import "./index.css";
import "./styles/safari-compat.css";

document.documentElement.classList.add("dark");

if (isSafariBrowser()) {
  document.documentElement.classList.add("is-safari");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <TooltipProvider>
        <App />
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </AppProviders>
  </StrictMode>,
);
