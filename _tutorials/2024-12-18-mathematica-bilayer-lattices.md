---
title: "使用 Mathematica 构建双层晶格"
date: 2024-12-18
summary: "从元胞、基矢和平移出发构建双层石墨烯与双层 Kagome 晶格。"
source_repository: "https://github.com/Hwei-esay/Physics"
source_commit: "ab02139"
---

![](https://images.unsplash.com/photo-1734014937757-f39209af0579?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

## 双层石墨烯晶格

石墨烯晶格是一个元胞中包含**两**个原子的晶格，整个晶格可以由一个元胞在基矢方向上的平移得到。因此在mathematica中也可以从**构建元胞，构建基矢，平移元胞**这个三步实现整个晶格的构建。

### 石墨烯晶格：

<img src="https://images.weserv.nl/?url=https://article.biliimg.com/bfs/new_dyn/b27714a5d2b02ffae1b8985c5644b2d425463303.png" data-align="center" width="300" height="300" />

### 1.构建元胞

假设晶格常数$a=1$，以元胞中心为原点。

```
ClearAll[ucellgra]
ucellgra = {{-1/2, 0}, {1/2, 0}};
ListPlot[ucellgra]
```

[<img src="https://s21.ax1x.com/2024/12/18/pALsZlV.jpg" data-border="0" alt="pALsZlV.jpg" />](https://imgse.com/i/pALsZlV) 可以看到代码在`[-1/2,1/2]`处画出了两个点，作为一个元胞。

### 2.构建基矢

```
ClearAll[vas, vascoeef]
vas = {{3/2, Sqrt[3]/2}, {3/2, -Sqrt[3]/2}};
```

[<img src="https://s21.ax1x.com/2024/12/18/pALy1Hg.png" data-border="0" alt="pALy1Hg.png" />](https://imgse.com/i/pALy1Hg) 按照晶格结构，构建了两个基矢。

### 3.平移得到晶格

```
vascoeef = {{0, 0}, {0, 1}, {1, 0}, {1, 1}};
lat = Table[
   TranslationTransform[vascoeef[[i]] . vas][ucellgra], {i, 4}];
ListPlot[lat, AspectRatio -> {1, 1, 1}]
```

[<img src="https://s21.ax1x.com/2024/12/18/pALyq2t.jpg" data-border="0" alt="pALyq2t.jpg" />](https://imgse.com/i/pALyq2t) 可以看到在各基矢的方向平移得到一部分晶格。

### 4.双层晶格

单层晶格到双层晶格的关键在于添加维度，给元胞添加维度，添加基矢和基矢维度。

```
ucellgra3d = {{-1/2, 0, 0}, {1/2, 0, 0}};
vasgra3d = {{3/2, Sqrt[3]/2, 0}, {3/2, -Sqrt[3]/2, 0}, {0, 0, 1}};
vascoeefgra3d = {{0, 0, 0}, {0, 1, 0}, {1, 0, 0}, {1, 1, 0}, {0, -1,
    0}, {-1, 0, 0}, {-1, -1, 0}, {1, -1, 0}, {-1, 1, 0}, {0, 0,
    1}, {0, 1, 1}, {1, 0, 1}, {1, 1, 1}, {0, -1, 1}, {-1, 0,
    1}, {-1, -1, 1}, {1, -1, 1}, {-1, 1, 1}};
latgra3d =
  Table[TranslationTransform[vascoeefgra3d[[i]] . vasgra3d][
    ucellgra3d], {i, 18}];
ListPointPlot3D[latgra3d, BoxRatios -> Automatic]
```

[<img src="https://s21.ax1x.com/2024/12/18/pAL6HwF.jpg" data-border="0" alt="pAL6HwF.jpg" />](https://imgse.com/i/pAL6HwF)

## 双层Kagome晶格

Kagome晶格是一个元胞中包含**三**个原子的晶格，整个晶格可以由一个元胞在基矢方向上的平移得到。因此在mathematica中也可以从**构建元胞，构建基矢，平移元胞**这个三步实现整个晶格的构建。

双层kagome晶格和双层石墨烯晶格类似，只是将元胞换为三个原子，同时也更换基矢。

```
ucellkagome3d = {{-1/2, 0, 0}, {1/2, 0, 0}, {0, -1, 0}};
vaskagome3d = {{1, Sqrt[3], 0}, {1, -Sqrt[3], 0}, {0, 0, 1}};
vascoeefkagome3d = {{0, 0, 0}, {0, 1, 0}, {1, 0, 0}, {1, 1,
    0}, {0, -1, 0}, {-1, 0, 0}, {-1, -1, 0}, {1, -1, 0}, {-1, 1,
    0}, {0, 0, 1}, {0, 1, 1}, {1, 0, 1}, {1, 1, 1}, {0, -1, 1}, {-1,
    0, 1}, {-1, -1, 1}, {1, -1, 1}, {-1, 1, 1}};
latkagome3d =
  Table[TranslationTransform[vascoeefkagome3d[[i]] . vaskagome3d][
    ucellkagome3d], {i, 18}];
ListPointPlot3D[latkagome3d, BoxRatios -> Automatic]
```

[<img src="https://s21.ax1x.com/2024/12/18/pAL6xQx.jpg" data-border="0" alt="pAL6xQx.jpg" />](https://imgse.com/i/pAL6xQx)

此处省略详细步骤，具体步骤和石墨烯晶格类似。
