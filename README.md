# Jekyll Personal Website

Also in [https://hwei-esay-github-io.pages.dev](https://hwei-esay-github-io.pages.dev)

一个适合个人长期积累的 Jekyll 站点模板，包含：

- 短博客
- 感悟短句
- 教程沉淀
- 学术报告笔记

## 本地运行

1. 安装 Ruby 3.2+ 和 Bundler
2. 安装依赖

```bash
bundle install
```

3. 启动开发服务

```bash
bundle exec jekyll serve
```

4. 打开浏览器访问

```text
http://127.0.0.1:4000
```

## 结构验证

提交前可以先运行：

```bash
ruby scripts/validate_site_structure.rb
```

这个脚本会检查 `_data/sections.yml`、集合入口页、导航目标和 `collection_key` 是否一致。

## 部署到 GitHub Pages

1. 创建用户名仓库：`Hwei-esay.github.io`
2. 修改 `_config.yml` 里的 `url`、`author`、`social` 等个人信息
3. 提交并 push 到 GitHub

## 内容目录

- `_posts/`：博客
- `_moments/`：短句感悟
- `_tutorials/`：教程笔记
- `_academia/`：学术报告笔记
- `_skills/`：可复用 AI skills 记录
- `_data/sections.yml`：站点 section registry，集中维护导航、集合入口和首页展示数量
- `tools/`：随网站发布的独立研究工具
- `CONTEXT.md`：仓库领域语言，方便后续人工和 AI agent 理解架构
