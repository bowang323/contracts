import { cn } from "@/lib/utils";

type MarkdownSourceEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  "aria-label": string;
  className?: string;
};

export function MarkdownSourceEditor({
  value,
  onChange,
  readOnly = false,
  "aria-label": ariaLabel,
  className,
}: MarkdownSourceEditorProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        className,
      )}
    >
      <div className="markdown-source-shell">
        <textarea
          value={value}
          onChange={
            onChange
              ? (event) => {
                  onChange(event.target.value);
                }
              : undefined
          }
          readOnly={readOnly}
          spellCheck={false}
          className="markdown-source-input"
          aria-label={ariaLabel}
        />
      </div>
    </div>
  );
}
