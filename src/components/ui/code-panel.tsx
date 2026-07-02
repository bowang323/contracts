import { cn } from "@/lib/utils";

type CodePanelProps = {
  value: string;
  id?: string;
  "aria-label"?: string;
  className?: string;
};

/** Read-only monospace block for copyable prompts and examples. */
export function CodePanel({
  value,
  id,
  "aria-label": ariaLabel,
  className,
}: CodePanelProps) {
  return (
    <pre
      id={id}
      aria-label={ariaLabel}
      className={cn("code-panel", className)}
    >
      <code className="code-panel__code">{value}</code>
    </pre>
  );
}
