---
title: Summarize Literature Article
summary: 一个用于把期刊论文整理成结构化中文 Word 文献总结报告的 Codex skill，适合论文精读、图表梳理和文献比较。
permalink: /skills/summarize-literature-article/
---

这个 skill 适合在阅读期刊论文时使用，尤其是需要把 PDF 或 Word 论文整理成结构化中文文献总结报告的场景。  
它不是简单压缩摘要，而是按文献阅读的方式拆解论文的引言、方法、数据、结果、图表、讨论、结论、创新点、局限和未来工作。

适用场景：

- 阅读一篇新的期刊论文，希望快速得到可回看的中文结构化报告
- 需要逐图逐表解释论文中的结果，而不是只看 abstract
- 想从期刊编辑或审稿人的角度区分“论文真正证明了什么”和“作者只是声称了什么”
- 需要把多篇相关论文放在一起比较方法、数据、创新点和不足

它会生成的内容通常包括：

- 文献基本信息
- 摘要与全文总述
- 引言中的研究问题和研究目的
- 方法体系、技术路线和创新方法
- 数据集、年限、类型、来源和处理方式
- 结果与图表解读
- 讨论、结论、创新点、局限和未来工作
- 可选的近三年同类研究比较

如果想把它添加到自己的 Codex 或 agent skills 中，可以参考原始仓库：

[summarize-literature-article](https://github.com/yanxiao-dai/yanxiao-dai/tree/main/skills/summarize-literature-article)

安装后可以这样调用：

```text
使用 $summarize-literature-article 总结这篇论文：/path/to/article.pdf
```

或者：

```text
用 $summarize-literature-article 阅读 /path/to/article.pdf，生成中文 Word 文献总结，并加入近三年同类研究比较。
```

如果是 Codex，本地安装完成后通常需要重启一次，新的 skill 才会被自动识别。
