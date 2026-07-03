import { cn } from "@/lib/utils";

const iconSrc = `${import.meta.env.BASE_URL}favicon.svg`;

type AppIconProps = {
  className?: string;
};

export function AppIcon({ className }: AppIconProps) {
  return (
    <img
      src={iconSrc}
      alt=""
      width={32}
      height={32}
      className={cn("size-8 shrink-0 rounded-lg", className)}
      aria-hidden
    />
  );
}
