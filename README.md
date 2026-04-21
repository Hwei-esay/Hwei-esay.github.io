# Jekyll Personal Website

一个适合个人长期积累的 Jekyll 站点模板，包含：

- 短博客
- 感悟短句
- 教程沉淀
- 学术报告笔记

## 本地运行

1. 安装 Ruby 和 Bundler
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

## 部署到 GitHub Pages

1. 创建用户名仓库：`yourusername.github.io`
2. 修改 `_config.yml` 里的 `url`、`author`、`social` 等个人信息
3. 提交并 push 到 GitHub

## 内容目录

- `_posts/`：博客
- `_moments/`：短句感悟
- `_tutorials/`：教程笔记
- `_academia/`：学术报告笔记
