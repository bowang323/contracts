import { useEffect, useRef, useState, type ComponentType } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableWithMarkdown } from "@/lib/tiptap-table-markdown";
import {
  Bold,
  CircleHelp,
  Heading1,
  Heading2,
  Italic,
  LayoutTemplate,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Redo2,
  Sparkles,
  Table as TableIcon,
  Undo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AiSkillDialog } from "@/components/editor/AiSkillDialog";
import { InsertTableDialog } from "@/components/editor/InsertTableDialog";
import { MarkdownGuideDialog } from "@/components/editor/MarkdownGuideDialog";
import { PageFormatDialog } from "@/components/editor/PageFormatDialog";
import { MarkdownSourceEditor } from "@/components/editor/MarkdownSourceEditor";
import { PaginatedDocumentSurface } from "@/components/editor/PaginatedDocumentSurface";
import { type PageFormat } from "@/lib/page-format";
import { EditorShortcuts } from "@/lib/editor-shortcuts";
import { tooltipWithShortcut } from "@/lib/format-shortcut";
import { PageFlowExtension } from "@/lib/tiptap-page-flow-extension";
import { initializeEditorPreviewFromMarkdown } from "@/lib/editor-preview-init";
import { useLanguage } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";

type ContractEditorProps = {
  documentId: string;
  bodyMarkdown: string;
  pageFormat: PageFormat;
  fullMarkdown: string;
  showSourceCode: boolean;
  contentReady: boolean;
  onBodyMarkdownChange: (markdown: string) => void;
  onFullMarkdownChange: (markdown: string) => void;
  onPageFormatChange: (format: PageFormat) => void;
};

type ToolbarTool = {
  key: TranslationKey;
  icon: ComponentType<{ className?: string }>;
  action: () => void;
  active: boolean;
  shortcut?: string;
  disabled?: boolean;
};

function ToolbarIconButton({
  label,
  onClick,
  active,
  disabled,
  icon: Icon,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size="icon-sm"
            variant={active ? "default" : "ghost"}
            onClick={onClick}
            disabled={disabled}
            className={cn(active && "bg-primary text-primary-foreground")}
          >
            <Icon className="size-4" />
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarTextButton({
  label,
  onClick,
  disabled,
  icon: Icon,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClick}
            disabled={disabled}
          >
            <Icon className="size-4" />
            {label}
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ContractEditor({
  documentId,
  bodyMarkdown,
  pageFormat,
  fullMarkdown,
  showSourceCode,
  contentReady,
  onBodyMarkdownChange,
  onFullMarkdownChange,
  onPageFormatChange,
}: ContractEditorProps) {
  const { t } = useLanguage();
  const [showPageFormat, setShowPageFormat] = useState(false);
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false);
  const [showAiSkill, setShowAiSkill] = useState(false);
  const [showInsertTable, setShowInsertTable] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [visualLoadKey, setVisualLoadKey] = useState(0);
  const [, setToolbarRevision] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const isInitializingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 5, 6] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      TableWithMarkdown.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      PageFlowExtension,
      EditorShortcuts,
    ],
    content: "",
    editable: false,
    editorProps: {
      attributes: {
        class: cn(
          "contract-prose contract-prose-editor min-h-0 focus:outline-none",
        ),
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      if (isInitializingRef.current) return;
      const storage = currentEditor.storage as unknown as {
        markdown: { getMarkdown: () => string };
      };
      onBodyMarkdownChange(storage.markdown.getMarkdown());
    },
  });

  useEffect(() => {
    if (!showSourceCode && contentReady) {
      setVisualLoadKey((key) => key + 1);
    }
  }, [documentId, showSourceCode, contentReady]);

  useEffect(() => {
    if (!editor || showSourceCode || !contentReady) {
      setIsPreviewReady(showSourceCode);
      return;
    }

    let cancelled = false;
    setIsPreviewReady(false);
    editor.setEditable(false);

    void (async () => {
      isInitializingRef.current = true;
      const snapshotBody = bodyMarkdown;
      try {
        await initializeEditorPreviewFromMarkdown(editor, snapshotBody);
        if (!cancelled) {
          setIsPreviewReady(true);
          editor.setEditable(true);
        }
      } catch {
        if (!cancelled) {
          setIsPreviewReady(true);
          editor.setEditable(true);
        }
      } finally {
        isInitializingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
      editor.setEditable(false);
    };
  }, [editor, showSourceCode, visualLoadKey, contentReady]);

  useEffect(() => {
    if (!editor || showSourceCode) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: cn(
            "contract-prose contract-prose-editor min-h-0 focus:outline-none",
            !isPreviewReady && "pointer-events-none select-none",
          ),
        },
      },
    });
  }, [editor, isPreviewReady, pageFormat, showSourceCode]);

  useEffect(() => {
    if (!editor || showSourceCode) return;
    const refreshToolbar = () => setToolbarRevision((n) => n + 1);
    editor.on("transaction", refreshToolbar);
    editor.on("selectionUpdate", refreshToolbar);
    return () => {
      editor.off("transaction", refreshToolbar);
      editor.off("selectionUpdate", refreshToolbar);
    };
  }, [editor, showSourceCode]);

  if (!editor && !showSourceCode) {
    return null;
  }

  const editingEnabled = isPreviewReady && !showSourceCode;

  const tools: ToolbarTool[] = editor
    ? [
        {
          key: "toolHeading1",
          icon: Heading1,
          action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          active: editor.isActive("heading", { level: 1 }),
          shortcut: "Mod-Alt-1",
        },
        {
          key: "toolHeading2",
          icon: Heading2,
          action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          active: editor.isActive("heading", { level: 2 }),
          shortcut: "Mod-Alt-2",
        },
        {
          key: "toolBold",
          icon: Bold,
          action: () => editor.chain().focus().toggleBold().run(),
          active: editor.isActive("bold"),
          shortcut: "Mod-B",
        },
        {
          key: "toolItalic",
          icon: Italic,
          action: () => editor.chain().focus().toggleItalic().run(),
          active: editor.isActive("italic"),
          shortcut: "Mod-I",
        },
        {
          key: "toolBulletList",
          icon: List,
          action: () => editor.chain().focus().toggleBulletList().run(),
          active: editor.isActive("bulletList"),
        },
        {
          key: "toolNumberedList",
          icon: ListOrdered,
          action: () => editor.chain().focus().toggleOrderedList().run(),
          active: editor.isActive("orderedList"),
        },
        {
          key: "toolHorizontalRule",
          icon: Minus,
          action: () => editor.chain().focus().setHorizontalRule().run(),
          active: false,
        },
        {
          key: "toolAlignLeft",
          icon: AlignLeft,
          action: () => editor.chain().focus().setParagraph().run(),
          active:
            editor.isActive("paragraph") &&
            !editor.isActive("heading", { level: 5 }) &&
            !editor.isActive("heading", { level: 6 }),
        },
        {
          key: "toolAlignCenter",
          icon: AlignCenter,
          action: () => editor.chain().focus().setHeading({ level: 5 }).run(),
          active: editor.isActive("heading", { level: 5 }),
        },
        {
          key: "toolAlignRight",
          icon: AlignRight,
          action: () => editor.chain().focus().setHeading({ level: 6 }).run(),
          active: editor.isActive("heading", { level: 6 }),
        },
      ]
    : [];

  return (
    <>
      <GlassPanel
        variant="frame"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <GlassPanel
          variant="toolbar"
          className="no-print mb-2 flex shrink-0 flex-wrap items-center gap-1 p-2"
        >
          {!showSourceCode && (
            <div className="flex flex-wrap items-center gap-1">
              {tools.map((tool) => (
                <ToolbarIconButton
                  key={tool.key}
                  label={tooltipWithShortcut(t(tool.key), tool.shortcut)}
                  onClick={tool.action}
                  active={tool.active}
                  disabled={!editingEnabled || tool.disabled}
                  icon={tool.icon}
                />
              ))}
              {editor && (
                <ToolbarIconButton
                  label={t("toolTable")}
                  onClick={() => setShowInsertTable(true)}
                  active={editor.isActive("table")}
                  disabled={!editingEnabled}
                  icon={TableIcon}
                />
              )}
            </div>
          )}

          {showSourceCode && (
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowMarkdownGuide(true)}
              >
                <CircleHelp className="size-4" />
                {t("markdownGuide")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowAiSkill(true)}
              >
                <Sparkles className="size-4" />
                {t("aiSkill")}
              </Button>
            </div>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-1">
            {!showSourceCode && editor && (
              <>
                <ToolbarIconButton
                  label={tooltipWithShortcut(t("toolUndo"), "Mod-Z")}
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editingEnabled || !editor.can().undo()}
                  icon={Undo2}
                />
                <ToolbarIconButton
                  label={tooltipWithShortcut(t("toolRedo"), "Mod-Shift-Z")}
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editingEnabled || !editor.can().redo()}
                  icon={Redo2}
                />
              </>
            )}
            {!showSourceCode ? (
              <ToolbarTextButton
                label={t("modifyPageFormatting")}
                onClick={() => setShowPageFormat(true)}
                disabled={!editingEnabled}
                icon={LayoutTemplate}
              />
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowPageFormat(true)}
              >
                <LayoutTemplate className="size-4" />
                {t("modifyPageFormatting")}
              </Button>
            )}
          </div>
        </GlassPanel>
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {!showSourceCode && !isPreviewReady && (
            <div
              className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-neutral-950/55 backdrop-blur-sm"
              aria-busy="true"
              aria-live="polite"
            >
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                {t("loadingPreview")}
              </p>
            </div>
          )}
          {showSourceCode ? (
            <MarkdownSourceEditor
              key={documentId}
              value={fullMarkdown}
              onChange={onFullMarkdownChange}
              aria-label={t("markdownSourceAria")}
            />
          ) : (
            <PaginatedDocumentSurface
              pageFormat={pageFormat}
              contentRef={contentRef}
              className="h-full min-h-0"
            >
              <EditorContent editor={editor} />
            </PaginatedDocumentSurface>
          )}
        </div>
      </GlassPanel>

      <PageFormatDialog
        open={showPageFormat}
        onOpenChange={setShowPageFormat}
        format={pageFormat}
        onSave={onPageFormatChange}
      />

      <MarkdownGuideDialog
        open={showMarkdownGuide}
        onOpenChange={setShowMarkdownGuide}
      />

      <AiSkillDialog open={showAiSkill} onOpenChange={setShowAiSkill} />

      {editor && (
        <InsertTableDialog
          open={showInsertTable}
          onOpenChange={setShowInsertTable}
          onInsert={({ rows, cols }) => {
            editor
              .chain()
              .focus()
              .insertTable({ rows, cols, withHeaderRow: false })
              .run();
          }}
        />
      )}
    </>
  );
}
