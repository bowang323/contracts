import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const glassPanelVariants = cva(
  "glass-surface backdrop-blur-xl backdrop-saturate-150 border border-white/20 transition-all duration-300 ease-out shadow-[0_8px_32px_rgba(234,88,12,0.12)] [-webkit-backdrop-filter:blur(24px)_saturate(150%)]",
  {
    variants: {
      variant: {
        sidebar: "rounded-2xl bg-orange-950/20 dark:bg-orange-950/30",
        toolbar: "rounded-xl bg-white/10 dark:bg-white/5",
        card: "rounded-2xl bg-white/10 dark:bg-white/5 hover:bg-white/15",
        floating: "rounded-3xl bg-white/15 dark:bg-white/10",
        notification:
          "rounded-3xl bg-neutral-950/80 dark:bg-neutral-950/85 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        frame: "rounded-2xl bg-white/10 dark:bg-white/5 p-2",
      },
    },
    defaultVariants: {
      variant: "card",
    },
  },
);

const glassDataVariant: Record<
  NonNullable<VariantProps<typeof glassPanelVariants>["variant"]>,
  string
> = {
  sidebar: "sidebar",
  toolbar: "toolbar",
  card: "card",
  floating: "floating",
  notification: "notification",
  frame: "frame",
};

export function GlassPanel({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof glassPanelVariants>) {
  const resolvedVariant = variant ?? "card";
  return (
    <div
      data-glass={glassDataVariant[resolvedVariant]}
      className={cn(glassPanelVariants({ variant }), className)}
      {...props}
    />
  );
}
