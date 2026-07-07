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

- **License:** [SIL Open Font License 1.1](https://scripts.sil.org/OFL) — see `src/assets/fonts/noto-cjk/LICENSE`
- **Project:** https://github.com/notofonts/noto-cjk

## Chinese emphasis — Zhuque Fangsong

From [TrionesType/zhuque](https://github.com/TrionesType/zhuque) (璇玑造字):

| Role | Chinese name | Font family | File |
| --- | --- | --- | --- |
| Emphasis | 仿宋 (Fangsong) | Zhuque Fangsong | `src/assets/fonts/zhuque/ZhuqueFangsong-Regular.ttf` |

- **License:** [SIL Open Font License 1.1](https://scripts.sil.org/OFL) — see `src/assets/fonts/zhuque/OFL.txt`
- **Project:** https://github.com/TrionesType/zhuque
- **Version bundled:** v0.212

English emphasis in `*italic*` / `em` uses **Tinos Italic**; Chinese emphasis uses **Zhuque Fangsong** (upright 仿宋, not slanted).

## Reserved font names

Per the OFL, reserved names (**Tinos**, **Noto**, **Source Han**, **思源**, **朱雀**, **Zhuque**, etc.) must not be used in derivative font names without permission.
