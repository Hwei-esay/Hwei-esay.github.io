---
title: Fix PDF OCR Markdown
summary: 用于修复从 PDF、OCR 或网页导出的学术论文 Markdown，核心是对照原始 PDF 清理噪声、恢复公式、图表、标题和引用结构。
permalink: /skills/fix-pdf-ocr-markdown/
---

这个 skill 适合处理“论文 PDF 已经有了，但导出的 Markdown 或 TXT 很乱”的场景。  
它的重点不是总结论文内容，而是把损坏的文本恢复成可继续阅读、整理和引用的干净 Markdown。

适用场景：

- 用户同时提供论文 PDF 和损坏的 `.md` 或 `.txt`
- 需要修复 OCR 错误、公式、图注、表格、参考文献或双栏阅读顺序
- 需要保留原文内容，而不是重写、翻译或概括

下面先放完整的 `SKILL.md` 内容：

```fix_pdf_ocr_markdown_skill
---
name: fix-pdf-ocr-markdown
description: Repair Markdown or plain-text academic papers produced from PDF export, OCR, or web conversion by checking them against the source PDF. Use when the user provides a paper PDF together with a damaged `.md` or `.txt` file and asks to fix formatting, formulas, captions, tables, references, headers/footers, or reading order without summarizing, translating, rewriting, or deleting the paper's main content.
---

# Fix PDF/OCR Markdown

Repair the converted Markdown against the PDF, treating the PDF as the source of truth for layout, equations, captions, tables, references, and section order.

Preserve the paper's original content. Correct extraction errors and formatting only; do not summarize, translate, paraphrase, or shorten the body text.

## Workflow

1. Read the converted `.md` or `.txt` file first as the editable base text.
2. Inspect the source PDF to verify the title, authors, affiliations, abstract, keywords, section order, equations, figure captions, tables, references, and repeating page noise.
3. Prefer page rendering or screenshots when PDF text extraction is unreliable for equations, tables, or multi-column ordering.
4. Create a new output file such as `paper_fixed.md` unless the user explicitly asks to overwrite the source file.

## Non-Negotiable Rules

- Keep the original paper content and argument flow.
- Remove only extraction noise, duplicated fragments, and obvious OCR errors.
- Reorder text only when the PDF clearly shows that columns or paragraphs were merged in the wrong order.
- Preserve formulas and numbering from the PDF.
- Keep the final Markdown readable and reusable for later note-taking or literature review work.

## What To Fix

- Delete repeated headers, footers, page numbers, journal bars, download notices, DOI footer noise, and similar publishing artifacts that are not part of the paper body.
- Repair broken words, hard line breaks inside paragraphs, and paragraph splits caused by OCR or PDF extraction.
- Normalize the paper front matter into clean Markdown headings and labeled sections.
- Convert equations into renderable LaTeX inline math or display math, keeping equation numbers.
- Format figure captions as standalone paragraphs and tables as readable Markdown tables when practical.
- Clean up author information, acknowledgments, associated content, and references without inventing missing bibliographic data.

## Output Structure

- Use `#` for the paper title.
- Use `##` for major sections such as `Abstract`, body sections, `Acknowledgments`, and `References`.
- Keep one blank line between paragraphs.
- Use display math blocks with `$$ ... $$` and `\tag{n}` for numbered equations.
- Avoid code fences for equations, captions, tables, or normal prose.

## Reference Guide

Read [references/repair-rules.md](./references/repair-rules.md) before editing. It contains:

- noise-removal patterns
- front-matter normalization rules
- equation reconstruction guidance
- figure and table formatting rules
- references and back-matter cleanup guidance
- a pre-delivery quality checklist
- a response template for reporting completion or uncertainty

## Delivery

State briefly what was fixed and point to the new Markdown file. If any equation, table, or caption could not be restored with high confidence from the PDF, say so explicitly and identify the affected page or section.
```

下面是配套的 `repair-rules.md` 内容：

```repair_rules
# Repair Rules For PDF/OCR Markdown Papers

Use this guide when repairing a paper converted from PDF, OCR, or web export.

## Core Goal

Produce a clean Markdown file that preserves the paper's original wording while fixing conversion damage by checking everything against the source PDF.

## Preserve Content

Allow these changes:

- correct obvious OCR mistakes
- rejoin broken words
- merge hard-wrapped lines into natural paragraphs
- restore paragraph order when the PDF clearly proves a multi-column mix-up
- remove headers, footers, page numbers, and duplicated extraction debris
- repair headings, equations, captions, tables, references, and metadata formatting

Do not:

- summarize the paper
- translate the body
- rewrite the authors' phrasing
- shorten the argument
- delete body sentences unless they are clearly duplicated OCR fragments or non-body page noise
- reorder sections without PDF evidence

## Inputs To Check

Verify the following against the PDF:

- title
- author names and affiliations
- abstract
- keywords
- section titles
- paragraph order
- equation text and numbering
- figure captions
- tables
- author information and acknowledgments
- references

If extracted PDF text is unreliable, inspect rendered pages or screenshots before deciding.

## Remove Noise Carefully

Delete recurring page artifacts such as:

```text
Received: ...
Revised: ...
Published: ...
Downloaded via ...
See https://pubs.acs.org/sharingguidelines ...
Nano Letters Letter
Letter
Cite This: ...
DOI: ...
4424
4425
4426
```

Keep DOI or journal details only when they belong in a real metadata or reference section rather than a repeated page banner.

## Normalize Front Matter

Use a clean structure such as:

```markdown
# Paper Title

**Authors:** Author A, Author B, and Author C

**Affiliations:**

- Affiliation 1
- Affiliation 2

## Abstract

ABSTRACT: ...

**KEYWORDS:** keyword 1, keyword 2, keyword 3
```

Merge stray author footnote markers into the author or affiliation lines when possible. Remove isolated OCR debris such as lone daggers or broken superscript fragments if they no longer carry meaning.

## Repair Paragraphs

Fix common extraction errors such as:

- `first- principles` -> `first-principles`
- `left- handed` -> `left-handed`
- `h- BN` -> `h-BN`
- forced line breaks inside a normal paragraph
- broken citation punctuation such as `[1][,][2]`

Keep one blank line between natural paragraphs. Do not leave every PDF line as a separate Markdown line.

For multi-column PDFs, restore the correct reading order only when the PDF clearly supports it.

## Normalize Section Titles

Convert obvious section-like lines into Markdown headings:

```text
Structure and Method.
Monolayers of Graphene and h-BN.
Vertical Stress Effect.
```

becomes:

```markdown
## Structure and Method

## Monolayers of Graphene and h-BN

## Vertical Stress Effect
```

Do not invent numbering if the original paper has none.

## Repair Equations

Treat equation repair as high priority.

Rules:

- rebuild equations from the PDF, not from OCR fragments
- use LaTeX for inline and display math
- keep equation numbers
- never wrap equations in code fences
- delete duplicated OCR shards after reconstruction

Inline examples:

```markdown
$\epsilon$
$S_{\mathrm{ph}}^z$
$\mathcal{R}(2\pi/3,z)$
```

Display example:

```markdown
$$
S_{\mathrm{ph}}^z
=
\epsilon^\dagger \hat{S}_z \epsilon \hbar
\tag{3}
$$
```

Delete OCR fragments like:

```text
_Rα_ _α_ _Lα_ _α_
=1
1 (1)
```

These fragments should be replaced with a clean equation reconstructed from the PDF.

## Repair Figure Captions

Write captions as standalone paragraphs, for example:

```markdown
**Figure 1.** (a, b) Top view and side view ...
```

Use LaTeX for scientific subscripts when helpful, such as `$ZO_1(K)$`.

## Repair Tables

Rebuild tables from the PDF when practical and use Markdown tables when the structure remains readable.

Example:

```markdown
**Table 1.** Chiral Phonons at the K Valley of G/h-BN Heterostructure and h-BN

| System / Mode | E | $S_B^z$ | $S_N^z$ | $l_{\mathrm{ph}}$ |
|---|---:|---:|---:|---:|
| G/h-BN TA(K) | 855.57 | -0.57 | 0.43 | 0 |
```

Keep signs and placeholder symbols consistent across the table. Remove repeated table-header scraps left by OCR.

## Repair Back Matter

Normalize sections such as:

- `## Associated Content`
- `## Author Information`
- `## Acknowledgments`
- `## References`

Possible subheadings include:

- `### Supporting Information`
- `### Corresponding Authors`
- `### ORCID`
- `### Notes`

For references:

- preserve the original citation data
- fix broken line wraps
- do not fabricate missing fields
- do not switch citation style unless the user explicitly requests it

## Quality Checklist

Check all of the following before finishing:

- all repeating headers, footers, page numbers, DOI footers, and journal bars are removed
- body content is preserved without summarizing
- obvious broken words are repaired
- title, authors, affiliations, abstract, and keywords are cleaned up
- equations are renderable LaTeX and numbered consistently with the PDF
- figure captions are isolated and readable
- tables are legible and aligned as well as Markdown allows
- references are complete to the extent visible in the PDF
- duplicated OCR equation shards and repeated lines are removed
- output is written to a new `.md` file unless the user requested overwrite

## Completion Template

Use a brief completion note such as:

```text
Repaired the Markdown against the PDF and mainly:

- removed OCR headers, footers, page numbers, journal bars, and DOI footer noise
- repaired equations into renderable LaTeX
- cleaned captions, tables, author metadata, abstract, keywords, and references
- preserved the original paper content without summarizing or rewriting
```

If any part is uncertain, say so plainly, for example:

```text
The equation on page X was reconstructed as carefully as possible from the page image, but the PDF extraction quality was poor and it should be checked manually once more.
```
```
