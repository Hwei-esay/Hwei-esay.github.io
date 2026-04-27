---
title: 复现 G/h-BN 手性声子文章：从结构到 phonopy 后处理
summary: 围绕 Nano Letters 2018 这篇 G/h-BN 手性声子工作，整理从 Materials Project 获取结构、自动跑声子、补算 eigenvector、重组路径、画色散和生成振动图的完整流程。
---

这篇笔记整理的是我复现论文 [Nondegenerate Chiral Phonons in Graphene/Hexagonal Boron Nitride Heterostructure from First-Principles Calculations](https://pubs.acs.org/doi/10.1021/acs.nanolett.8b01487) 的过程，以及后续声子相关计算的常用流程。

论文信息：

- Gao, Zhang, Zhang, *Nano Letters* **2018**, 18(7), 4424-4430
- DOI: [10.1021/acs.nanolett.8b01487](https://doi.org/10.1021/acs.nanolett.8b01487)
- Materials Project 结构来源：[mp-48](https://next-gen.materialsproject.org/materials/mp-48)

这份总结分成两部分：

1. 理论与判断逻辑：为什么要这样做，以及常见误区在哪里。
2. 可复用流程：配置文件、命令、脚本模板，可以直接改后使用。

> 说明：文中的超胞尺寸、路径设置、`auto_phonon.sh` 参数等都要根据具体体系确认。我的习惯是先询问师兄，或者让 AI 帮忙检查一版输入文件，再正式提交任务。

## 一、最小复现流程

如果只想先把文章的大框架跑通，可以按下面三步走。

### 1. 从 Materials Project 获取结构

先从 Materials Project 下载 `POSCAR`：

- 结构页面：[mp-48](https://next-gen.materialsproject.org/materials/mp-48)
- 下载后根据实际研究对象做适当修改

常见修改包括：

- 调整真空层厚度
- 检查原胞/超胞是否与目标文献一致
- 检查原子排序是否便于后续分析
- 必要时手动修正层间距离、晶格常数或堆垛方式

### 2. 用自动脚本跑基础声子计算

我这里常用的脚本是：

```bash
/work/wangr/data2/ghw/scripts/auto_phonon.sh
```

通常先用它生成力常数、得到基础的声子色散。具体参数需要结合体系与服务器环境确定，建议先让熟悉这套流程的人帮忙看一遍，或者用 AI 辅助检查输入。

### 3. 再按需求做 phonopy 后处理

基础声子计算完成后，后续就不是一股脑“重跑 VASP”，而是按目标拆开：

- 只想画色散：已有 `FORCE_CONSTANTS` 就够
- 想看振动方向：需要 `eigenvector`
- 想讨论圆偏振或角动量：也必须有 `eigenvector`
- 想画指定路径：用 `band.yaml` 重组或重新指定 `BAND`
- 想做原子振动示意图：用 `MODULATION`

---

## 二、理论与判断逻辑

### 1. `band.yaml` 默认不一定包含 `eigenvector`

很多时候已经有的 `band.yaml` 只能用来画频率色散，因为它只包含：

- q 点坐标
- 路径距离
- 声子频率

如果文件里没有 `eigenvector`，那么下面这些分析都做不了：

- 原子振动方向判断
- 圆偏振分析
- 手性或 pseudo-angular momentum 分析
- 更严格的物理分支识别

### 2. 不需要重跑 VASP，也能补出带 `eigenvector` 的 `band.yaml`

这是最重要的一点。

如果你已经有：

- `POSCAR`
- `FORCE_CONSTANTS`

那么一般不需要重新跑一遍第一性原理计算，只需要让 `phonopy` 重新后处理，并在配置里加入：

```text
EIGENVECTORS = .TRUE.
BAND_CONNECTION = .TRUE.
```

其中：

- `EIGENVECTORS = .TRUE.` 用于输出本征矢
- `BAND_CONNECTION = .TRUE.` 用于尽量按本征矢连续性连接分支

### 3. 如何检查文件里有没有 `eigenvector`

最直接的方法是：

```bash
grep -n "eigenvector" band.yaml | head
```

如果有输出，说明文件里确实有本征矢。

如果没有输出，这个 `band.yaml` 就只能画频率色散，不能继续做振动方向、圆偏振或角动量分析。

### 4. 不能直接把 band index 当成 ZA/TA/LA/ZO/TO/LO

这是最容易犯错的地方。

`phonopy` 的 `band.yaml` 往往只是把每个 q 点的频率按从低到高排序。也就是说，`band 1`、`band 2`、`band 3` 更像是“当前这一列的频率次序”，而不一定永远对应固定的物理分支。

问题来自：

- 分支交叉
- 简并附近本征矢基底不唯一
- 仅按频率排序时会发生“列号交换”
- 在 `Gamma` 点附近，声学支非常接近，尤其容易混乱

所以像下面这种写法，只是给“第几列”上色，不一定是真正给 ZA/TA/LA/ZO/TO/LO 上色：

```python
for ib in range(6):
    color = colors[ib]
```

### 5. 正确区分物理分支需要依赖 `eigenvector`

对二维石墨烯类体系，6 条声子支通常写成：

- ZA: 面外声学支
- TA: 面内横向声学支
- LA: 面内纵向声学支
- ZO: 面外光学支
- TO: 面内横向光学支
- LO: 面内纵向光学支

更稳妥的识别方式，是对每个模式的本征矢做投影。

可以定义：

- `Pz = sum_j |e_jz|^2`，表示面外分量
- `PL = sum_j |q_hat · (e_jx, e_jy)|^2`，表示沿波矢方向的面内分量
- `PT = sum_j |q_perp · (e_jx, e_jy)|^2`，表示垂直于波矢的面内分量

判断逻辑通常是：

- `Pz` 最大：ZA 或 ZO
- `PL` 最大：LA 或 LO
- `PT` 最大：TA 或 TO

再结合频率高低，把它们分成 acoustic 和 optical 两组。

### 6. 圆偏振信息也来自 `eigenvector`

如果没有 `eigenvector`，不能讨论圆偏振。

常见的面内圆偏振量可以写成：

```text
s_z = sum_j 2 * Im(e_jx* * e_jy)
```

它的符号和大小通常反映：

- 接近 0：线偏振，或者不同原子的贡献彼此抵消
- 大于 0：一种旋向
- 小于 0：相反旋向
- 绝对值越接近 1：越接近圆偏振

需要注意的是，正负号还会受时间因子约定影响，例如 `exp(-iwt)` 或 `exp(+iwt)`。

### 7. 你的 `KPATH.phonopy` 实际上对应什么路径

如果 `BAND` 写成：

```text
0.000000 0.000000 0.000000
0.500000 0.000000 0.000000
0.333333 0.333333 0.000000
0.000000 0.000000 0.000000
```

那么前四个高对称点依次是：

- `(0, 0, 0)` 对应 `Gamma`
- `(1/2, 0, 0)` 对应 `M`
- `(1/3, 1/3, 0)` 对应 `K`
- `(0, 0, 0)` 对应 `Gamma`

也就是说，前三段路径其实是：

- `Gamma -> M`
- `M -> K`
- `K -> Gamma`

如果你研究的是石墨烯二维声子色散，一般只需要这前三段，或者直接重新指定二维路径。

### 8. 如何从已有路径中重组成新路径

假设原始前三段是：

- `seg0 = Gamma -> M`
- `seg1 = M -> K`
- `seg2 = K -> Gamma`

那么：

- `Gamma -> K` 等于 `reverse(seg2)`
- `Gamma -> K -> M -> Gamma` 对应顺序 `[(2, True), (1, True), (0, True)]`
- `M -> Gamma -> K -> M` 对应顺序 `[(0, True), (2, True), (1, True)]`

这个思路后面画图会直接用到。

---

## 三、可直接复用的计算流程

### 流程 1：重新生成带 `eigenvector` 的 `Gamma-K` 路径 `band.yaml`

先单独建目录，避免覆盖原来的文件：

```bash
mkdir GK_eig
cp POSCAR FORCE_CONSTANTS GK_eig/
cd GK_eig
```

创建配置文件 `band_GK_eig.conf`：

```text
DIM = 5 5 1
BAND = 0 0 0  1/3 1/3 0
BAND_POINTS = 101
BAND_LABELS = $\Gamma$ K
EIGENVECTORS = .TRUE.
BAND_CONNECTION = .TRUE.
```

说明：

- `DIM = 5 5 1` 应与力常数计算时使用的超胞一致
- `BAND = 0 0 0  1/3 1/3 0` 表示 `Gamma -> K`
- `BAND_CONNECTION = .TRUE.` 可以让分支连接更合理

运行：

```bash
phonopy -c POSCAR --readfc band_GK_eig.conf
```

检查是否生成了本征矢：

```bash
grep -n "eigenvector" band.yaml | head
```

### 流程 2：只计算高对称点 `Gamma`、`K`、`M` 的本征矢

如果只关心几个特殊点，不必整条路径都算。

```bash
mkdir q_eig_test
cp POSCAR FORCE_CONSTANTS q_eig_test/
cd q_eig_test
```

创建 `qpoints_GKM.conf`：

```text
DIM = 5 5 1
QPOINTS = 0 0 0  1/3 1/3 0  1/2 0 0
EIGENVECTORS = .TRUE.
```

运行：

```bash
phonopy -c POSCAR --readfc qpoints_GKM.conf
```

检查：

```bash
grep -n "eigenvector" qpoints.yaml | head
```

这个 `qpoints.yaml` 很适合做：

- 单点模式分析
- 圆偏振计算
- 振动方向判断

### 流程 3：生成原子振动图像

#### 1. `Gamma` 点模式

例如画 `Gamma` 点第 5 支模式：

创建 `mod_gamma.conf`：

```text
MODULATION = 1 1 1, 0 0 0 5 0.5
```

运行：

```bash
phonopy -c POSCAR --dim="5 5 1" --readfc mod_gamma.conf
```

一般会得到：

- `MPOSCAR`
- `MPOSCAR-001`
- `MPOSCAR-orig`
- `modulation.yaml`

其中 `MPOSCAR-001` 就是调制后的结构，可以直接用 VESTA 打开看振动示意图。

#### 2. `M` 点模式

`M = (1/2, 0, 0)`，通常建议用 `2 x 2 x 1` 超胞显示：

```text
MODULATION = 2 2 1, 1/2 0 0 4 0.5
```

运行：

```bash
phonopy -c POSCAR --dim="5 5 1" --readfc mod_M.conf
```

#### 3. `K` 点模式

`K = (1/3, 1/3, 0)`，通常建议用 `3 x 3 x 1` 超胞显示：

```text
MODULATION = 3 3 1, 1/3 1/3 0 6 0.5
```

运行：

```bash
phonopy -c POSCAR --dim="5 5 1" --readfc mod_K.conf
```

---

## 四、常用脚本模板

### 1. 打印 `Gamma`、`M`、`K` 点的模式频率

文件名：`print_modes_at_GMK.py`

```python
#!/usr/bin/env python3
import yaml

with open("band.yaml", "r") as f:
    data = yaml.safe_load(f)

phonons = data["phonon"]
seg = data["segment_nqpoint"]

idx_Gamma = 0
idx_M = seg[0] - 1
idx_K = seg[0] + seg[1] - 1
idx_Gamma2 = seg[0] + seg[1] + seg[2] - 1

special_points = [
    ("Gamma", idx_Gamma),
    ("M", idx_M),
    ("K", idx_K),
    ("Gamma(end)", idx_Gamma2),
]

for name, idx in special_points:
    q = phonons[idx]["q-position"]
    freqs = [band["frequency"] for band in phonons[idx]["band"]]
    print(f"\n{name}: q = {q}")
    for i, f in enumerate(freqs, start=1):
        print(f"  band {i}: {f:.6f} THz")
```

运行：

```bash
python3 print_modes_at_GMK.py
```

用途：

- 检查 `Gamma`、`M`、`K` 点上的 6 个模式频率
- 判断是否有异常虚频
- 为后续模态可视化选编号

### 2. 只画 `Gamma-K` 路径

文件名：`plot_GK_only.py`

```python
#!/usr/bin/env python3
import yaml
import numpy as np
import matplotlib.pyplot as plt

FIGSIZE = (4.2, 5.2)
DPI = 300
YLIM = (0, 50)
LINEWIDTH = 2.0
TITLE = r"Phonon dispersion of graphene: $\Gamma$-K"
XLABEL = "Wave vector"
YLABEL = "Frequency (THz)"
OUTPUT_PNG = "graphene_GK_only.png"
OUTPUT_PDF = "graphene_GK_only.pdf"

def read_band_yaml(filename="band.yaml"):
    with open(filename, "r") as f:
        data = yaml.safe_load(f)
    phonons = data["phonon"]
    distances = np.array([p["distance"] for p in phonons], dtype=float)
    freqs = np.array([[b["frequency"] for b in p["band"]] for p in phonons], dtype=float)
    qpoints = np.array([p["q-position"] for p in phonons], dtype=float)
    return data, qpoints, distances, freqs

def split_segments(qpoints, distances, freqs, segment_nqpoint):
    segments = []
    start = 0
    for nq in segment_nqpoint:
        end = start + nq
        segments.append({
            "q": qpoints[start:end],
            "d": distances[start:end],
            "f": freqs[start:end],
        })
        start = end
    return segments

def prepare_segment(seg, reverse=False):
    d = seg["d"].copy()
    f = seg["f"].copy()
    d_local = d - d[0]
    length = d_local[-1]
    if reverse:
        d_local = length - d_local[::-1]
        f = f[::-1, :]
    return d_local, f, length

def main():
    data, qpoints, distances, freqs = read_band_yaml("band.yaml")
    if "segment_nqpoint" not in data:
        raise RuntimeError("band.yaml 中没有 segment_nqpoint，无法可靠切分路径。")

    segments = split_segments(qpoints, distances, freqs, data["segment_nqpoint"])

    # 原始前三段:
    # seg0: Gamma -> M
    # seg1: M -> K
    # seg2: K -> Gamma
    # Gamma -> K = reverse(seg2)
    x_plot, f_plot, seg_len = prepare_segment(segments[2], reverse=True)

    fig, ax = plt.subplots(figsize=FIGSIZE, dpi=DPI)
    for ib in range(f_plot.shape[1]):
        ax.plot(x_plot, f_plot[:, ib], lw=LINEWIDTH)

    ax.axhline(0, color="black", linestyle="--", lw=0.8)
    ax.set_xticks([0, seg_len])
    ax.set_xticklabels([r"$\Gamma$", "K"], fontsize=14)
    ax.set_xlim(0, seg_len)
    ax.set_ylim(YLIM)
    ax.set_xlabel(XLABEL, fontsize=14)
    ax.set_ylabel(YLABEL, fontsize=14)
    ax.set_title(TITLE, fontsize=15)

    fig.tight_layout()
    fig.savefig(OUTPUT_PNG, dpi=DPI)
    fig.savefig(OUTPUT_PDF)
    print(f"Saved: {OUTPUT_PNG}")
    print(f"Saved: {OUTPUT_PDF}")

if __name__ == "__main__":
    main()
```

### 3. 画 `Gamma-K`，并按分支名给颜色

这段代码有一个前提：你已经用 `EIGENVECTORS = .TRUE.` 和 `BAND_CONNECTION = .TRUE.` 重新生成了更合理的 `band.yaml`。

文件名：`plot_GK_physical_colors.py`

```python
#!/usr/bin/env python3
import yaml
import numpy as np
import matplotlib.pyplot as plt

FIGSIZE = (4.2, 5.2)
DPI = 300
YLIM = (0, 50)
LINEWIDTH = 2.0
TITLE = r"Phonon dispersion of graphene: $\Gamma$-K"
YLABEL = "Frequency (THz)"
XLABEL = "Wave vector"

BRANCH_ORDER = ["ZA", "TA", "LA", "ZO", "TO", "LO"]
BRANCH_COLORS = {
    "ZA": "black",
    "TA": "blue",
    "LA": "red",
    "ZO": "magenta",
    "TO": "green",
    "LO": "navy",
}

OUTPUT_PNG = "graphene_GK_physical_colors.png"
OUTPUT_PDF = "graphene_GK_physical_colors.pdf"

def read_band_yaml(filename="band.yaml"):
    with open(filename, "r") as f:
        data = yaml.safe_load(f)
    phonons = data["phonon"]
    distances = np.array([p["distance"] for p in phonons], dtype=float)
    freqs = np.array([[b["frequency"] for b in p["band"]] for p in phonons], dtype=float)
    qpoints = np.array([p["q-position"] for p in phonons], dtype=float)
    return data, qpoints, distances, freqs

def main():
    data, qpoints, distances, freqs = read_band_yaml("band.yaml")
    nband = freqs.shape[1]
    if nband != 6:
        raise RuntimeError(f"当前声子分支数为 {nband}，但石墨烯原胞通常应有 6 条分支。")

    x = distances - distances[0]

    fig, ax = plt.subplots(figsize=FIGSIZE, dpi=DPI)
    for ib, branch in enumerate(BRANCH_ORDER):
        color = BRANCH_COLORS[branch]
        ax.plot(
            x,
            freqs[:, ib],
            color=color,
            lw=LINEWIDTH,
            label=branch
        )

    ax.axhline(0, color="black", linestyle="--", lw=0.8)
    ax.set_xticks([x[0], x[-1]])
    ax.set_xticklabels([r"$\Gamma$", "K"], fontsize=14)
    ax.set_xlim(x[0], x[-1])
    ax.set_ylim(YLIM)
    ax.set_ylabel(YLABEL, fontsize=14)
    ax.set_xlabel(XLABEL, fontsize=14)
    ax.set_title(TITLE, fontsize=15)
    ax.tick_params(axis="y", labelsize=13)
    ax.legend(frameon=False, fontsize=12, loc="center left", bbox_to_anchor=(1.02, 0.5))

    fig.tight_layout(rect=[0, 0, 0.85, 1])
    fig.savefig(OUTPUT_PNG, dpi=DPI)
    fig.savefig(OUTPUT_PDF)
    print(f"Saved: {OUTPUT_PNG}")
    print(f"Saved: {OUTPUT_PDF}")

if __name__ == "__main__":
    main()
```

> 这段脚本仍然只是“临时实用版”，因为它本质上还是把颜色绑到某一列上。真正严格的方法，是读取 `eigenvector` 后自动计算 `Pz`、`PL`、`PT`，再判断物理分支。

### 4. 画 `Gamma-K-M-Gamma`

文件名：`plot_GKMG.py`

```python
#!/usr/bin/env python3
import yaml
import numpy as np
import matplotlib.pyplot as plt

def read_band_yaml(filename="band.yaml"):
    with open(filename, "r") as f:
        data = yaml.safe_load(f)
    phonons = data["phonon"]
    distances = np.array([p["distance"] for p in phonons], dtype=float)
    freqs = np.array([[b["frequency"] for b in p["band"]] for p in phonons], dtype=float)
    qpoints = np.array([p["q-position"] for p in phonons], dtype=float)
    return data, qpoints, distances, freqs

def split_segments(qpoints, distances, freqs, segment_nqpoint):
    segments = []
    start = 0
    for nq in segment_nqpoint:
        end = start + nq
        segments.append({
            "q": qpoints[start:end],
            "d": distances[start:end],
            "f": freqs[start:end],
        })
        start = end
    return segments

def prepare_segment(seg, reverse=False):
    d = seg["d"].copy()
    f = seg["f"].copy()
    d_local = d - d[0]
    length = d_local[-1]
    if reverse:
        d_local = length - d_local[::-1]
        f = f[::-1, :]
    return d_local, f, length

def main():
    data, qpoints, distances, freqs = read_band_yaml("band.yaml")
    if "segment_nqpoint" not in data:
        raise RuntimeError("band.yaml 中没有 segment_nqpoint，无法可靠切分路径。")

    segments = split_segments(qpoints, distances, freqs, data["segment_nqpoint"])

    order = [
        (2, True),
        (1, True),
        (0, True),
    ]

    x_all = []
    f_all = []
    tick_positions = [0.0]
    offset = 0.0

    for i, (seg_idx, rev) in enumerate(order):
        d_local, f_local, seg_len = prepare_segment(segments[seg_idx], reverse=rev)
        if i > 0:
            d_local = d_local[1:]
            f_local = f_local[1:]
        x_all.append(d_local + offset)
        f_all.append(f_local)
        offset += seg_len
        tick_positions.append(offset)

    x_plot = np.concatenate(x_all)
    f_plot = np.concatenate(f_all)
    tick_labels = [r"$\Gamma$", "K", "M", r"$\Gamma$"]

    fig, ax = plt.subplots(figsize=(7, 5), dpi=300)
    for ib in range(f_plot.shape[1]):
        ax.plot(x_plot, f_plot[:, ib], lw=1.5)

    for x in tick_positions:
        ax.axvline(x, color="gray", linestyle="--", lw=0.8)

    ax.axhline(0, color="black", linestyle="--", lw=0.8)
    ax.set_xticks(tick_positions)
    ax.set_xticklabels(tick_labels, fontsize=13)
    ax.set_xlim(x_plot.min(), x_plot.max())
    ax.set_ylabel("Frequency (THz)", fontsize=13)
    ax.set_xlabel("Wave vector", fontsize=13)
    ax.set_title(r"Phonon dispersion: $\Gamma$-K-M-$\Gamma$", fontsize=14)

    fig.tight_layout()
    fig.savefig("graphene_GKMG.png", dpi=300)
    fig.savefig("graphene_GKMG.pdf")

if __name__ == "__main__":
    main()
```

### 5. 画 `M-Gamma-K-M`

如果只想改成 `M-Gamma-K-M`，可以直接把 `order` 和标签改为：

```python
order = [
    (0, True),
    (2, True),
    (1, True),
]
tick_labels = ["M", r"$\Gamma$", "K", "M"]
```

---

## 五、图像参数怎么改

### 1. 图像比例

```python
FIGSIZE = (4.2, 5.2)
```

常见选项：

- `(6, 4)`
- `(7, 4.5)`
- `(4.2, 5.2)`
- `(8, 5)`

### 2. 分辨率

```python
DPI = 300
```

- 论文或 PPT 常用 `300`
- 更高质量可设为 `600`

### 3. 纵坐标范围

```python
YLIM = (0, 50)
```

常见情况：

- 只看低频：`(0, 15)`
- 想显示轻微虚频：`(-2, 50)`

### 4. 线宽

```python
LINEWIDTH = 2.0
```

- 论文图常用 `1.2`
- PPT 图常用 `2.0`

### 5. 单位切换到 `cm^-1`

如果要从 `THz` 换到 `cm^-1`，可以先做转换：

```python
freqs = freqs * 33.356
```

然后把坐标轴标签改成：

```python
ax.set_ylabel(r"Frequency (cm$^{-1}$)")
```

### 6. 图例位置模板

右上角：

```python
ax.legend(frameon=False, fontsize=12, loc="upper right")
```

左上角：

```python
ax.legend(frameon=False, fontsize=12, loc="upper left")
```

左下角：

```python
ax.legend(frameon=False, fontsize=12, loc="lower left")
```

图外右侧，通常最清爽：

```python
ax.legend(
    frameon=False,
    fontsize=12,
    loc="center left",
    bbox_to_anchor=(1.02, 0.5)
)
fig.tight_layout(rect=[0, 0, 0.85, 1])
```

---

## 六、常见错误

### 错误 1：直接用 band index 代表物理分支

错误写法：

```python
BRANCH_ORDER = ["ZA", "TA", "LA", "ZO", "TO", "LO"]
for ib, branch in enumerate(BRANCH_ORDER):
    ax.plot(x, freqs[:, ib], color=BRANCH_COLORS[branch])
```

问题在于：

- `freqs[:, ib]` 只是第 `ib` 列
- 第 `ib` 列不一定始终代表同一个物理分支
- 在交叉和简并附近容易错配

更合理的做法是：

- 先使用 `BAND_CONNECTION = .TRUE.`
- 再进一步基于 `eigenvector` 投影自动识别 ZA/TA/LA/ZO/TO/LO

### 错误 2：没有 `eigenvector` 却讨论圆偏振

圆偏振本质上依赖复本征矢相位，例如 `Im(ex* ey)`。如果只有频率，没有本征矢，就不能做这一步。

修正方法：

```text
EIGENVECTORS = .TRUE.
```

### 错误 3：把完整三维路径误当成二维路径

如果原始 `KPATH.phonopy` 来自完整六方路径，那么整份 `band.yaml` 可能不仅包含 `Gamma-M-K-Gamma`，后面还会有：

- `A-L-H-A`
- `L-M`
- `H-K`

如果只研究二维石墨烯声子色散，就不要直接把整份 `band.yaml` 全画出来，而应该只取前 3 段，或者重新生成二维路径。

---

## 七、我现在最推荐的工作流

如果目标是“画出正确的 `Gamma-K` 声子色散，并尽量正确地区分分支”，我建议按这个顺序做：

1. 从 Materials Project 下载并整理 `POSCAR`。
2. 用 `/work/wangr/data2/ghw/scripts/auto_phonon.sh` 跑出基础力常数。
3. 保留 `POSCAR` 和 `FORCE_CONSTANTS`，在新目录里用 `phonopy --readfc` 重生 `band.yaml`。
4. 在配置里加入 `EIGENVECTORS = .TRUE.` 和 `BAND_CONNECTION = .TRUE.`。
5. 先用 `grep` 确认 `band.yaml` 是否真的包含 `eigenvector`。
6. 先画普通 `Gamma-K` 路径，再决定是否做颜色区分、圆偏振或振动图。
7. 如果颜色错分支，不要继续手改图例，而是回到 `eigenvector` 投影判断这一步。

---

## 八、下一步最值得补的脚本

当前最值得补的一段代码，不是继续改画图样式，而是：

1. 读取 `band.yaml` 中的 `eigenvector`
2. 计算 `Pz`、`PL`、`PT`
3. 自动判断 ZA/TA/LA/ZO/TO/LO
4. 再按物理分支上色

这一步才是解决“颜色绑错分支”的根本方法。前面那种手动写 `BRANCH_ORDER` 的方案，只适合临时出图，不适合作为严格分析流程。
