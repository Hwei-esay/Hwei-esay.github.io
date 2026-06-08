---
title: "MkDocs、LaTeX 与终端问题记录"
date: 2024-12-22
summary: "整理 MkDocs 公式、图片、提示框、摘要与 LaTeX 排版中的常见问题。"
source_repository: "https://github.com/Hwei-esay/Physics"
source_commit: "ab02139"
---

![](https://plus.unsplash.com/premium_photo-1733230683076-da46320fb8a2?q=80&w=2575&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

## 1. 在 MkDocs 中显示公式

[cnblogs 教程](https://www.cnblogs.com/searchstar/p/18303613)：向 `mkdocs.yml` 中添加：

```
markdown_extensions:
  - pymdownx.arithmatex

extra_javascript:
  - https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js
```

## 2.在Mkdocs中显示删除线

在Mkdocs中使用`~~哈哈哈~~`格式没有效果： ~~哈哈哈~~

但是可以使用`<del>哈哈哈</del>`可以显示删除线：~~哈哈哈~~

## 3.在Mkdocs中显示图片

```
![image](https://images.unsplash.com/photo-1554310603-d39d43033735?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)
```

![image](https://images.unsplash.com/photo-1554310603-d39d43033735?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

### 本地图源：

在原 MkDocs 项目中，资源路径相对于 `docs` 目录：

```
![](assets/nn456.png)
```

![](/assets/physics/nn456.png)

> **Tip** 使用本地图源时，文件需要放在 `docs/assets/` 中。目录示例如下：
>
> ```text
> physics/
> ├── docs/
> │   └── assets/
> │       └── nn456.png
> └── mkdocs.yml
> ```

### Unsplash图源：

![image](https://images.unsplash.com/photo-1646194314870-6e25f74e6e60?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

### 知乎图源：

![](https://pic1.zhimg.com/v2-e4264a18b37a78221ced72dc01539d98_1440w.jpg)

### bilibili图源： (无法显示)

```
![]https://i0.hdslb.com/bfs/new_dyn/3f19aa1b7649f33711acb3af89a93d311036847356.png@560w_560h_1e_1c.avif
```

![](https://i0.hdslb.com/bfs/new_dyn/3f19aa1b7649f33711acb3af89a93d311036847356.png@560w_560h_1e_1c.avif)

> **提示**
>
> 为什么在typora中可以显示？？？

#### 解决方案：

使用图床（目前使用chrome上的[bilibili图床插件](https://chromewebstore.google.com/detail/bilibili%E5%9B%BE%E5%BA%8A/aofnmlfiomopkmgdngoehlndjcinbhfb)），将图片下载到本地再上传到图床就有图片的url可用。

但是bilibili的图片很大部分使用的是`.webp`或`.avif`格式，还需要多一步将这些格式转换为`.jpg`或`.png`文件

## 4.报错“found character '\t' that cannot start any token”

原因是在`.yaml`文件中不能使用`tab`键进行缩进。

## 5.latex公式无法显示

原因可能是在mkdocs中，<>中的反括号前需要加\\且每一个都要加。

## 6.如何显示Tips、Note、Warning等**块**

参考链接：<https://squidfunk.github.io/mkdocs-material/reference/admonitions/?h=tip#admonition-icons>

这个官方叫做"Admonitions"

具体的规则是：`!!!`+`space`+`Tip`或`Note`或`Warning`。内容文字需要在下一行与`Tip`等缩进相同的位置开始书写。

例如：

```
!!! Tip

    这是一个Tip。
```

> **提示**
>
> 这是一个Tip。

需要在`mkdocs.yml`中添加以下代码：

```
markdown_extensions:
  - admonition
  - pymdownx.details
  - pymdownx.superfences
```

在上方贴出的链接中包含了更多的options，甚至可以自定义新的图标和颜色

## 7.Latex图片并列显示

```
\begin{figure}[htbp]
\begin{minipage}[t]{0.5\linewidth}
\centering
\includegraphics[width=0.95\textwidth]{haldane-no-t2.jpg}
\caption{没有t2项的能带}
\end{minipage}%
\begin{minipage}[t]{0.5\linewidth}
\centering
\includegraphics[width=0.95\textwidth]{haldane-with-t2.jpg}
\caption{有t2项的能带}
\end{minipage}
```

## 8.自定义mkdocs的material主题：

<https://juejin.cn/post/7066641709198737416>
官方参考文档：<https://squidfunk.github.io/mkdocs-material/reference/annotations/>

## 9.解决Latex图片移动到下一页的问题

参考：[Latex控制图片位置](https://qiyuan-z.github.io/2020/07/18/Latex%E6%8E%A7%E5%88%B6%E5%9B%BE%E7%89%87%E4%BD%8D%E7%BD%AE/)

使用float包并在图片语句后使用`H`选项

```
\usepackage{float}
% ...
\begin{figure}[H]
foo
\end{figure}
```

## 10.Latex分页符

使用`\clearpage`而不是`\newpage`

## 11.md中`\\`换行符失效

解决方法：一对不行再来一对，使用`\\\\`成功进行换行。

## 12.emoji在mkdocs上的使用

不知道为什么index中的emoji不能显示了。在`mkdocs.yml`文件中添加以下代码

```
markdown_extensions:
  - attr_list
  - pymdownx.emoji:
      emoji_index: !!python/name:material.extensions.emoji.twemoji
      emoji_generator: !!python/name:material.extensions.emoji.to_svg
```

## homebrew的安装

在安装homebrew的过程中，使用命令行安装失败，遂使用pkg安装包安装。成功之后在cmd也无法调用，需要向path中添加brew的路径。

```
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

## 13.博客中的摘要停止符号不起作用

问题： 在博客的主页中显示全文，没有仅显示摘要，导致找其他文章很费劲，但是我明明在文章中使用了停止符号`<!--more-->`。

解决方案：

- 在`mkdocs.yml`文件中声明你要用的停止符号（如`<!-- more -->`）。
  ```
plugins:
    - blog:
        post_excerpt_separator: <!-- more -->
```
- 在博客中的摘要之后，正文之前使用上一步中定义的停止符号`<!-- more -->`

## 14. 在终端里无法连接 GitHub

先区分 DNS、代理、证书和 Git 配置问题：

```bash
nslookup github.com
curl -I https://github.com
git ls-remote https://github.com/Hwei-esay/Physics.git
```

不建议把查询到的 GitHub IP 固定写入 `hosts`：GitHub 使用的地址可能变化，旧地址会造成新的连接故障。应优先检查当前网络、DNS、代理设置和 GitHub 状态页。
