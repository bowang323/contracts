import type { Locale } from "@/lib/i18n";

export type GuideSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  code?: string;
};

const TABLE_EXAMPLE = `| page-format-key | page-format-value |
| --- | --- |
| page.size | letter |
| page.margin-in | 1 |
| page.body-bottom-inset-px | 24 |
| red-title.show | false |
| red-title.text | |
| header.left.show | false |
| header.left.text | |
| header.center.show | false |
| header.center.text | |
| header.right.show | false |
| header.right.text | |
| footer.left.show | false |
| footer.left.text | |
| footer.center.show | true |
| footer.center.mode | page-number |
| footer.center.text | |
| footer.right.show | false |
| footer.right.text | |`;

const guideEn: GuideSection[] = [
  {
    title: "Document structure",
    paragraphs: [
      "Each document is one Markdown file with two parts: a page-format table at the top, then the contract body.",
      "The visual editor and PDF export read this table to lay out every page (paper size, margins, red title, headers, footers). The body uses standard Markdown below the table.",
    ],
    code: TABLE_EXAMPLE,
  },
  {
    title: "Page-format keys",
    paragraphs: ["Boolean values are true or false. Pipe characters in text must be escaped as \\|."],
    bullets: [
      "page.size — letter or a4",
      "page.margin-in — page margin in inches (e.g. 1)",
      "page.body-bottom-inset-px — extra gap between body text and footer (default 24)",
      "red-title.show / red-title.text — red official title (红头) on every page; disables header slots",
      "header.left|center|right.show / .text — three-column header (when red title is off)",
      "footer.left|center|right.show / .text — footer slots",
      "footer.center.mode — text or page-number (page-number ignores center text)",
    ],
  },
  {
    title: "Body Markdown",
    paragraphs: ["Supported in the editor and preview:"],
    bullets: [
      "# Heading 1 — centered on the page",
      "## Heading 2",
      "**bold** and *italic* / _italic_",
      "++underline++ (double plus signs)",
      "Bullet and numbered lists",
      "Tables (GitHub-flavored)",
      "Horizontal rules (---)",
      "Inline code with `backticks` and fenced blocks with ``` — do not use 4-space indented code blocks",
      "Intentional spaces and blank lines are preserved when editing in the visual editor",
      "Paragraph alignment — use heading levels 5 and 6 as alignment blocks (same body font and weight as normal text):",
      "  Left (default) — plain paragraph text",
      "  Center — ##### Your text (Markdown h5)",
      "  Right — ###### Your text (Markdown h6)",
    ],
  },
  {
    title: "Typography (English & Chinese)",
    paragraphs: [
      "Fonts apply in the paginated preview and PDF export. Mixed English and Chinese in one line is supported.",
    ],
    bullets: [
      "Red title — English: Tinos bold. Chinese: 黑体 (Heiti) via Noto Sans CJK SC. Displayed larger with extra vertical emphasis.",
      "Body text — English: Tinos. Chinese: 宋体 (Songti) via Noto Serif CJK SC.",
      "Italic / emphasis (*text*) — English: Tinos italic. Chinese: 仿宋 (Fangsong) via Zhuque Fangsong.",
      "Headers and footers use the same body fonts as above.",
    ],
  },
];

const guideZh: GuideSection[] = [
  {
    title: "文档结构",
    paragraphs: [
      "每份文档是一个 Markdown 文件，分为两部分：顶部的页面格式表格，以及正文。",
      "可视化编辑器和 PDF 导出会读取该表格，用于每一页的排版（纸张、边距、红头、页眉、页脚）。表格下方为标准 Markdown 正文。",
    ],
    code: TABLE_EXAMPLE,
  },
  {
    title: "页面格式键名",
    paragraphs: ["布尔值写 true 或 false。文字中的竖线需转义为 \\|。"],
    bullets: [
      "page.size — letter（美国信纸）或 a4",
      "page.margin-in — 页边距（英寸，如 1）",
      "page.body-bottom-inset-px — 正文与页脚之间的额外间距（默认 24 像素）",
      "red-title.show / red-title.text — 每页红头标题；启用后页眉槽位不可用",
      "header.left|center|right.show / .text — 三列页眉（未启用红头时）",
      "footer.left|center|right.show / .text — 页脚槽位",
      "footer.center.mode — text（自定义文字）或 page-number（页码，忽略居中文字）",
    ],
  },
  {
    title: "正文 Markdown",
    paragraphs: ["编辑器与预览支持："],
    bullets: [
      "# 一级标题 — 页面居中",
      "## 二级标题",
      "**粗体** 与 *斜体* / _斜体_",
      "++下划线++（双加号包裹）",
      "无序与有序列表",
      "表格（GFM）",
      "分隔线（---）",
      "行内代码用 `反引号`，代码块用 ``` 围栏 — 不要用四个空格缩进表示代码",
      "在可视化编辑器中，有意留出的空格与空行会被保留",
      "段落对齐 — 用五级、六级标题作为对齐块（字号与粗细与正文相同）：",
      "  左对齐（默认）— 普通段落",
      "  居中 — ##### 你的文字（Markdown h5）",
      "  右对齐 — ###### 你的文字（Markdown h6）",
    ],
  },
  {
    title: "字体（中英文）",
    paragraphs: [
      "以下字体用于分页预览与 PDF 导出。同一行可混排中英文。",
    ],
    bullets: [
      "红头标题 — 英文：Tinos 粗体。中文：黑体（Noto Sans CJK SC）。字号较大并纵向加高显示。",
      "正文 — 英文：Tinos。中文：宋体（Noto Serif CJK SC）。",
      "斜体 / 强调（*文字*）— 英文：Tinos 斜体。中文：仿宋（朱雀仿宋 Zhuque Fangsong）。",
      "页眉、页脚与正文使用相同正文字体规则。",
    ],
  },
];

export function getMarkdownGuideSections(locale: Locale): GuideSection[] {
  return locale === "zh" ? guideZh : guideEn;
}

function buildAiSkillPromptEn(): string {
  return `# Doc Flow — contract authoring skill

Use this skill when drafting or editing documents for **Doc Flow** (paginated document editor with Markdown source and PDF export).

## Output format

Always produce a **single Markdown file** with:

1. A **page-format table** as the first lines (exact header row required).
2. A blank line after the table.
3. The **contract body** in Markdown.

Required table header (do not change column names):

\`\`\`
| page-format-key | page-format-value |
| --- | --- |
\`\`\`

Then one row per key. Example defaults:

\`\`\`
${TABLE_EXAMPLE}
\`\`\`

### Page-format keys (reference)

| Key | Values | Notes |
| --- | --- | --- |
| page.size | letter \\| a4 | US Letter or A4 |
| page.margin-in | number | Inches, e.g. 1 |
| page.body-bottom-inset-px | number | Pixels; increase if text overlaps footer (default 24) |
| red-title.show | true \\| false | Official red title on each page |
| red-title.text | string | Red title text; when show=true, header slots are ignored |
| header.*.show / .text | bool / string | left, center, right — only when red title is off |
| footer.*.show / .text | bool / string | left, center, right |
| footer.center.mode | text \\| page-number | Use page-number for auto page numbers in center footer |

Escape pipe \\| inside cell values.

## Body Markdown rules

- \`# Title\` — H1, centered in preview
- \`## Section\` — H2
- \`**bold**\`, \`*italic*\` — emphasis
- \`++underline++\` — underline (double plus signs; combine with bold/italic as needed)
- Bullet (\`-\`) and numbered (\`1.\`) lists
- GFM tables
- \`---\` horizontal rule
- Inline code: \`like this\`. Fenced code blocks: \`\`\` ... \`\`\`. **Never** use 4-space indentation for code blocks.

### Paragraph alignment (body text)

Use **h5** and **h6** as alignment blocks. They render with the same font size and weight as normal paragraphs—not as traditional headings.

| Alignment | Markdown | Example |
| --- | --- | --- |
| Left | plain paragraph (no heading prefix) | \`The parties agree as follows.\` |
| Center | \`#####\` (h5) | \`##### CONFIDENTIAL\` |
| Right | \`######\` (h6) | \`###### Page 1 of 3\` |

- Do **not** use h3 or h4 for alignment.
- Each aligned line is its own paragraph block (one \`#####\` or \`######\` line per aligned row).
- In the visual editor, use the align-left / align-center / align-right toolbar buttons (they write the same Markdown).

Do not use raw HTML in the body.

## Typography (must match preview)

When describing formatting to the user, follow these rendering rules:

| Region | English | Chinese |
| --- | --- | --- |
| Red title | Tinos bold | 黑体 (Heiti) — Noto Sans CJK SC |
| Body | Tinos | 宋体 (Songti) — Noto Serif CJK SC |
| Italic / emphasis | Tinos *italic* | 仿宋 (Fangsong) — Zhuque Fangsong |

Mixed English and Chinese in one paragraph is expected.

## Pagination behavior

- Long body text flows across pages automatically.
- Keep sections readable; avoid huge unbroken paragraphs.
- Red title, header, and footer repeat on every page per the table.

## Checklist before returning markdown

- [ ] Table is first, with correct header and separator rows
- [ ] All booleans are lowercase true/false
- [ ] red-title.show=true implies header slots are false/empty
- [ ] footer.center.mode=page-number when center footer should show page numbers
- [ ] Center-aligned body lines use \`#####\` (h5); right-aligned use \`######\` (h6); left uses plain paragraphs
- [ ] Body starts after the table with valid Markdown only
`;
}

function buildAiSkillPromptZh(): string {
  return `# 流式文档 — 合同文档撰写技能

在为用户撰写或修改 **流式文档（Doc Flow）** 时使用本技能（支持 Markdown 源码与分页 PDF 导出）。

## 输出格式

始终输出 **一个 Markdown 文件**，包含：

1. 文件开头的 **页面格式表格**（表头行必须完全一致）。
2. 表格后空一行。
3. **正文**（标准 Markdown）。

必需的表头（列名不可更改）：

\`\`\`
| page-format-key | page-format-value |
| --- | --- |
\`\`\`

每个键一行。示例默认值：

\`\`\`
${TABLE_EXAMPLE}
\`\`\`

### 页面格式键（参考）

| 键名 | 取值 | 说明 |
| --- | --- | --- |
| page.size | letter \\| a4 | 美国信纸或 A4 |
| page.margin-in | 数字 | 边距（英寸），如 1 |
| page.body-bottom-inset-px | 数字 | 正文与页脚间距（像素）；重叠时增大（默认 24） |
| red-title.show | true \\| false | 每页红头标题 |
| red-title.text | 字符串 | 红头文字；show=true 时页眉不可用 |
| header.*.show / .text | 布尔 / 字符串 | left、center、right；仅红头关闭时有效 |
| footer.*.show / .text | 布尔 / 字符串 | 页脚三列 |
| footer.center.mode | text \\| page-number | page-number 为居中页码 |

单元格内的竖线写作 \\|。

## 正文 Markdown 规则

- \`# 标题\` — 一级标题，预览居中
- \`## 小节\` — 二级标题
- \`**粗体**\`、\`*斜体*\` — 强调
- \`++下划线++\` — 下划线（双加号；可与粗体/斜体组合）
- 无序（\`-\`）与有序（\`1.\`）列表
- GFM 表格
- \`---\` 分隔线
- 行内代码：\`反引号\`。围栏代码块：\`\`\` ... \`\`\`。**不要**用四个空格缩进表示代码块。

### 段落对齐（正文）

用 **五级、六级标题** 表示对齐块。显示效果与正文相同字号与粗细，不是传统大标题。

| 对齐 | Markdown | 示例 |
| --- | --- | --- |
| 左对齐 | 普通段落（无前缀） | \`双方约定如下。\` |
| 居中 | \`#####\`（h5） | \`##### 机密文件\` |
| 右对齐 | \`######\`（h6） | \`###### 第 1 页\` |

- 不要用 h3、h4 做对齐。
- 每一行对齐单独占一行（一行一个 \`#####\` 或 \`######\`）。
- 可视化编辑器中可用左/中/右对齐工具栏按钮（写入相同 Markdown）。

正文不要使用原始 HTML。

## 字体（须与预览一致）

| 区域 | 英文 | 中文 |
| --- | --- | --- |
| 红头标题 | Tinos 粗体 | 黑体 — Noto Sans CJK SC |
| 正文 | Tinos | 宋体 — Noto Serif CJK SC |
| 斜体 / 强调 | Tinos 斜体 | 仿宋 — 朱雀仿宋 Zhuque Fangsong |

同一段落可混排中英文。

## 分页说明

- 正文过长时自动分页。
- 红头、页眉、页脚按表格设置在每页重复显示。

## 交付前检查

- [ ] 表格在最前，表头与分隔行正确
- [ ] 布尔值为小写 true/false
- [ ] red-title.show=true 时页眉应为 false/空
- [ ] 居中页码使用 footer.center.mode=page-number
- [ ] 正文居中行用 \`#####\`（h5），右对齐用 \`######\`（h6），左对齐用普通段落
- [ ] 表格后仅为合法 Markdown 正文
`;
}

export function buildAiSkillPrompt(locale: Locale): string {
  return locale === "zh" ? buildAiSkillPromptZh() : buildAiSkillPromptEn();
}

export const AI_PLATFORM_HINTS: Record<Locale, string[]> = {
  en: ["ChatGPT", "Claude", "Gemini", "Cursor"],
  zh: ["DeepSeek", "豆包", "元宝", "千问"],
};
