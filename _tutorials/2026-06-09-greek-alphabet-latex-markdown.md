---
title: 希腊字母表：读音、LaTeX 与 Markdown 写法
date: 2026-06-09
summary: 希腊字母大小写、常见英语音标、LaTeX 命令与 Markdown 数学公式代码速查表。
---

希腊字母经常出现在数学、物理和工程公式中。下面的音标采用常见英语读法；不同地区的英语发音可能略有差异。

Markdown 数学公式通常是在 LaTeX 代码外加 `$...$`。例如，LaTeX 写作 `\alpha`，Markdown 行内公式写作 `$\alpha$`。

## 希腊字母速查表

| 序号 | 名称 | 希腊字母 | 常见英语音标 | LaTeX 代码（大写 / 小写） | Markdown 代码（大写 / 小写） |
| ---: | --- | :---: | --- | --- | --- |
| 1 | Alpha（阿尔法） | Α α | `/ˈælfə/` | `A` / `\alpha` | `$A$` / `$\alpha$` |
| 2 | Beta（贝塔） | Β β | `/ˈbeɪtə/` | `B` / `\beta` | `$B$` / `$\beta$` |
| 3 | Gamma（伽马） | Γ γ | `/ˈɡæmə/` | `\Gamma` / `\gamma` | `$\Gamma$` / `$\gamma$` |
| 4 | Delta（德尔塔） | Δ δ | `/ˈdeltə/` | `\Delta` / `\delta` | `$\Delta$` / `$\delta$` |
| 5 | Epsilon（艾普西龙） | Ε ε | `/ˈepsɪlɑːn/` | `E` / `\epsilon` | `$E$` / `$\epsilon$` |
| 6 | Zeta（泽塔） | Ζ ζ | `/ˈzeɪtə/` | `Z` / `\zeta` | `$Z$` / `$\zeta$` |
| 7 | Eta（伊塔） | Η η | `/ˈeɪtə/` | `H` / `\eta` | `$H$` / `$\eta$` |
| 8 | Theta（西塔） | Θ θ | `/ˈθeɪtə/` | `\Theta` / `\theta` | `$\Theta$` / `$\theta$` |
| 9 | Iota（约塔） | Ι ι | `/aɪˈoʊtə/` | `I` / `\iota` | `$I$` / `$\iota$` |
| 10 | Kappa（卡帕） | Κ κ | `/ˈkæpə/` | `K` / `\kappa` | `$K$` / `$\kappa$` |
| 11 | Lambda（兰布达） | Λ λ | `/ˈlæmdə/` | `\Lambda` / `\lambda` | `$\Lambda$` / `$\lambda$` |
| 12 | Mu（缪） | Μ μ | `/mjuː/` | `M` / `\mu` | `$M$` / `$\mu$` |
| 13 | Nu（纽） | Ν ν | `/njuː/` | `N` / `\nu` | `$N$` / `$\nu$` |
| 14 | Xi（克西） | Ξ ξ | `/zaɪ/` | `\Xi` / `\xi` | `$\Xi$` / `$\xi$` |
| 15 | Omicron（奥密克戎） | Ο ο | `/ˈɑːmɪkrɑːn/` | `O` / `o` | `$O$` / `$o$` |
| 16 | Pi（派） | Π π | `/paɪ/` | `\Pi` / `\pi` | `$\Pi$` / `$\pi$` |
| 17 | Rho（柔） | Ρ ρ | `/roʊ/` | `P` / `\rho` | `$P$` / `$\rho$` |
| 18 | Sigma（西格马） | Σ σ | `/ˈsɪɡmə/` | `\Sigma` / `\sigma` | `$\Sigma$` / `$\sigma$` |
| 19 | Tau（陶） | Τ τ | `/taʊ/` | `T` / `\tau` | `$T$` / `$\tau$` |
| 20 | Upsilon（宇普西龙） | Υ υ | `/ˈʌpsɪlɑːn/` | `\Upsilon` / `\upsilon` | `$\Upsilon$` / `$\upsilon$` |
| 21 | Phi（斐） | Φ φ | `/faɪ/` | `\Phi` / `\phi` | `$\Phi$` / `$\phi$` |
| 22 | Chi（开） | Χ χ | `/kaɪ/` | `X` / `\chi` | `$X$` / `$\chi$` |
| 23 | Psi（普赛） | Ψ ψ | `/psaɪ/` | `\Psi` / `\psi` | `$\Psi$` / `$\psi$` |
| 24 | Omega（欧米伽） | Ω ω | `/oʊˈmeɪɡə/` | `\Omega` / `\omega` | `$\Omega$` / `$\omega$` |

## 常见字形变体

部分小写希腊字母在公式中有两种常用字形：

| 字母 | LaTeX 代码 | Markdown 代码 |
| --- | --- | --- |
| Epsilon 变体 | `\varepsilon` | `$\varepsilon$` |
| Theta 变体 | `\vartheta` | `$\vartheta$` |
| Pi 变体 | `\varpi` | `$\varpi$` |
| Rho 变体 | `\varrho` | `$\varrho$` |
| Sigma 词尾形式 | `\varsigma` | `$\varsigma$` |
| Phi 变体 | `\varphi` | `$\varphi$` |

## 使用示例

行内公式：

```markdown
角频率记为 $\omega$，相位记为 $\phi$。
```

独立公式：

```markdown
$$
\Delta E = \hbar \omega
$$
```

显示效果：

$$
\Delta E = \hbar \omega
$$

> 标准 LaTeX 没有为所有外形与拉丁字母相同的大写希腊字母提供单独命令。例如 Alpha、Beta 和 Epsilon 的大写形式通常直接写作 `A`、`B` 和 `E`。
