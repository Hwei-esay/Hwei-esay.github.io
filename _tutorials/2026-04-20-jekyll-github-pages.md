---
title: Jekyll 站点部署到 GitHub Pages
summary: 从本地创建到推送到 GitHub 用户名仓库的一套最小流程。
---

## 适用场景

适合把个人站点部署到 `用户名.github.io` 这样的用户主页仓库。

## 基本步骤

1. 新建仓库，仓库名必须是 `你的用户名.github.io`。
2. 把本地 Jekyll 站点内容推到该仓库默认分支。
3. 在仓库设置里确认 Pages 来源为默认分支根目录。
4. 等待 GitHub 完成构建后访问站点域名。

## 本地调试

安装依赖后执行：

```bash
bundle exec jekyll serve
```

默认访问 `http://127.0.0.1:4000`。

## 这份模板要注意的配置

- `_config.yml` 中的 `url` 改成你的真实域名。
- 如果是用户名仓库，`baseurl` 保持空字符串。
- `author`、`social`、`email` 等字段改成你自己的信息。
