# Font attribution

Doc Flow bundles the following open-source fonts for document preview and PDF export. UI chrome uses [Inter](https://rsms.me/inter/) via npm.

## English — Tinos

- **Files:** `src/assets/fonts/tinos/*.ttf`
- **Designer:** Steve Matteson
- **License:** [SIL Open Font License 1.1](https://scripts.sil.org/OFL) — see `src/assets/fonts/tinos/OFL.txt`
- **Source:** [Google Fonts — Tinos](https://fonts.google.com/specimen/Tinos)

## Chinese — Noto CJK SC

From [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk) (also known as Source Han / 思源):

| Role | Chinese name | Font family | File |
| --- | --- | --- | --- |
| Red title | 黑体 (Heiti) | Noto Sans CJK SC | `src/assets/fonts/noto-cjk/NotoSansSC-VF.ttf` |
| Body | 宋体 (Songti) | Noto Serif CJK SC | `src/assets/fonts/noto-cjk/NotoSerifSC-VF.ttf` |
| Emphasis | 楷体 (Kaiti) | Noto Serif CJK SC (medium weight) | `src/assets/fonts/noto-cjk/NotoSerifSC-VF.ttf` |

- **License:** [SIL Open Font License 1.1](https://scripts.sil.org/OFL) — see `src/assets/fonts/noto-cjk/LICENSE`
- **Project:** https://github.com/notofonts/noto-cjk

Noto CJK is developed by Adobe, Google, and partners. The 楷体 (Kaiti) emphasis style uses the bundled Noto Serif CJK SC variable font at medium weight; Noto CJK does not ship a separate Kaiti face.

## Reserved font names

Per the OFL, the reserved names **Tinos**, **Noto**, **Source Han**, and **思源** must not be used in derivative font names without permission.
