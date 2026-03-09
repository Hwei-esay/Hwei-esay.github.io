import os
import re
from datetime import datetime

def generate_jekyll_post():
    print("=== Jekyll 文章生成器 ===")
    title = input("请输入文章标题 (Title): ")
    if not title:
        print("❌ 标题不能为空！")
        return

    categories = input("请输入分类 (Categories, 用逗号分隔, 可留空): ")
    tags = input("请输入标签 (Tags, 用逗号分隔, 可留空): ")

    # 获取当前时间
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    
    # Jekyll 推荐的时间格式 (包含时区，这里为了方便默认附加 +0800，你可以根据需要修改)
    time_str = now.strftime("%Y-%m-%d %H:%M:%S +0800")

    # 生成对 URL 友好的文件名 (支持中文，将空格和特殊字符替换为连字符)
    safe_title = re.sub(r'[^\w\u4e00-\u9fa5]+', '-', title).strip('-').lower()
    if not safe_title:
        safe_title = "untitled"
    
    filename = f"{date_str}-{safe_title}.md"
    
    # 确保 _posts 目录存在
    posts_dir = "_posts"
    if not os.path.exists(posts_dir):
        os.makedirs(posts_dir)
        
    filepath = os.path.join(posts_dir, filename)

    # 格式化分类和标签
    cat_format = f"[{', '.join([c.strip() for c in categories.split(',') if c.strip()])}]"
    tag_format = f"[{', '.join([t.strip() for t in tags.split(',') if t.strip()])}]"

    # 生成 YAML Front Matter
    front_matter = f"""---
layout: post
title: "{title}"
date: {time_str}
categories: {cat_format if categories else '[]'}
tags: {tag_format if tags else '[]'}
---

在此处开始撰写您的内容...
"""

    # 写入文件
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(front_matter)
        print(f"\n✅ 成功！已生成 Markdown 文件: {filepath}")
        print("现在你可以打开该文件，直接专注于内容的创作了！")
    except Exception as e:
        print(f"\n❌ 写入文件时发生错误: {e}")

if __name__ == "__main__":
    generate_jekyll_post()
