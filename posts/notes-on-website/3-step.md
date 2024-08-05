---
layout: post
title: Knowledges about Jekyll.
author: Haowei Guo
tags: website 
---
This is the third step.

## 文件目录结构

```
my-jekyll-site/
├── _config.yml #配置
├── _includes/ #未知
├── _layouts/ #包含模板的html文件，不同的html模板对应不同功能
│  	├── default.html
│   ├── post.html
├── _pages/ #未知
├── _sass/ #未知
├── _site/ #类似缓存不用自己修改
├── posts
│   ├── css/
│   ├── images/
│   └── index.md #注意此处建立md文件不是html
├── assets/ #包含css模板、网站中需要的图片、js还不清楚
│   ├── css/
│   ├── images/
│   └── js/
├── index.md #网站主页的页面，
├	         #会根据md文件中的layout参数值自动生成html文件
└── Gemfile #jekyll中添加plugin的时候向此文件中添加
```

## 如何添加子页
### 添加子页
在文件目录下新建目录，以子页名称命名(posts)。
在此目录下添加index.md才能在其他页面以[“/posts/notes-on-website/3-step.html”](/posts/notes-on-website/3-step.html)链接到此页
  
### 在子页添加页面
在posts目录下添加[示例文件](/posts/HelloWorld.html)HelloWorld.md，即可完成子页面下的页面的添加。

## 调整间距

问题：三级标题的顶部和上一个三级标题下的正文的间距过近
解决：增加三级标题和上一个块的间距,在style.css文件中添加下面的代码即可。
```
h3 {
  margin-top: 1.5em;
}
```

## Add Elements

貌似可以在md文件中直接添加html代码，可以起作用（例如修改无背景png的背景颜色）

## Adding Formula

### Using Jekyll Plugin "Jekyll-spaceship"

add to gemfile
	
	group :jekyll_plugins do
			gem "jekyll-spaceship"
	end

add to _config.yml

```
plugins:
  - jekyll-spaceship
```



in git bash, run 
```
"gem install jekyll-spaceship"
```

Done!


[back](./)