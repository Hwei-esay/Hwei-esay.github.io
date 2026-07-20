---
title: VASP–Wannier90–WannierTools 计算流程
date: 2026-07-17
summary: 以 Bi₂Se₃ 为例，整理从 VASP 能带计算、Wannier90 拟合到 WannierTools 拓扑边界态与 Berry curvature 计算的完整流程。
---

## 1. 教程目标

本教程以 Bi₂Se₃ 为例，介绍如何依次使用 VASP、Wannier90 和 WannierTools，得到材料的拓扑边界态（LDOS）和 Berry curvature 分布。

开始计算时，唯一需要自行准备的结构输入文件是正确的 `POSCAR`。计算过程中还需要以下脚本：

| 脚本 | 用途 |
| --- | --- |
| `AutoVASP.sh` | 提交 VASP 计算 |
| `Wannier_cal-new.sh` | 提交 VASP + Wannier90 初次拟合计算 |
| `Disentanglement.sh` | 重新调整参数并进行能带拟合 |
| `tool_25.sh` | 提交 WannierTools 计算 |

以上脚本均为当前计算环境中的 LSF 任务脚本，需要通过 `bsub` 提交到任务队列。以下命令以常见的 LSF 提交方式为例：

```bash
bsub < 脚本名.sh
```

如果所在计算平台规定了其他提交方式，应以平台说明为准。文中的脚本路径和具体输入参数也需要按实际计算环境修改。

## 2. VASP 计算

### 2.1 准备输入文件和脚本

首先写好并检查 `POSCAR`，然后在计算目录中复制一份 `AutoVASP.sh`：

```bash
cp /path/to/AutoVASP.sh .
```

根据 `POSCAR` 和具体计算要求修改 `AutoVASP.sh`。

> 待补充：`AutoVASP.sh` 中需要修改的具体参数，例如赝势、截断能、K 点、并行参数、SOC 设置及计算路径等。对于 Bi₂Se₃ 拓扑性质的计算，需要确认流程中正确考虑了 SOC。

### 2.2 提交计算

修改完成后，使用 `bsub` 提交任务：

```bash
bsub < AutoVASP.sh
```

### 2.3 检查计算结果

任务结束后，检查 `OUTCAR`、`scf/`、`nonscf/` 等文件和文件夹，确认 VASP 计算是否正常完成并达到收敛要求。

如果计算成功，`nonscf/` 中应得到：

- `Proband/`
- 能带图 `Band.jpg`

这两个结果是后续检查 Wannier90 拟合质量时主要使用的参考。至此，VASP 计算完成。

### 2.4 错误检查示例：投影能带异常

`AutoVASP.sh` 计算完成后，首先检查 `nonscf/` 中的 `band.png`。如图 1 所示，能带计算结果正常。

<figure style="margin: 1.8rem 0; text-align: center;">
  <img src="{{ '/assets/tutorials/vasp-wannier90-wanniertools/01-band-normal.png' | relative_url }}" alt="正常的能带计算结果" style="width: 680px; max-width: 100%; height: auto; margin: 0 auto;">
  <figcaption style="margin-top: 0.6rem; color: #6b7280; font-size: 0.9rem;">图 1　<code>nonscf/band.png</code> 中正常的能带计算结果</figcaption>
</figure>

接着检查 `nonscf/Pro_band/` 文件夹。如图 2 所示，投影能带出现错误。

<figure style="margin: 1.8rem 0; text-align: center;">
  <img src="{{ '/assets/tutorials/vasp-wannier90-wanniertools/02-projected-band-error.png' | relative_url }}" alt="投影能带错误" style="width: 680px; max-width: 100%; height: auto; margin: 0 auto;">
  <figcaption style="margin-top: 0.6rem; color: #6b7280; font-size: 0.9rem;">图 2　<code>nonscf/Pro_band/</code> 中出现错误的投影能带</figcaption>
</figure>

此时需要检查 `scf/`、`nonscf/` 中的 `<jobID>.log`，以及工作路径下的 `<jobID>.err` 和 `<jobID>.out`。

> 本例中，我直接将这些日志交给 AI 检查。后续熟悉相关内容后，再补充人工检查方法，以及如何核对 AI 识别出的错误是否正确。

检查后发现，日志提示网格选择有误：原设置为 `(12 12 3)`，如图 3 所示。将网格修改为 `(9 9 9)`，如图 4 所示，然后重新提交计算。

<figure style="margin: 1.8rem 0; text-align: center;">
  <img src="{{ '/assets/tutorials/vasp-wannier90-wanniertools/03-kmesh-original-12x12x3.png' | relative_url }}" alt="原网格设置 12 12 3" style="width: 680px; max-width: 100%; height: auto; margin: 0 auto;">
  <figcaption style="margin-top: 0.6rem; color: #6b7280; font-size: 0.9rem;">图 3　<code>AutoVASP.sh</code> 中原来的网格设置 <code>(12 12 3)</code></figcaption>
</figure>

<figure style="margin: 1.8rem 0; text-align: center;">
  <img src="{{ '/assets/tutorials/vasp-wannier90-wanniertools/04-kmesh-corrected-9x9x9.png' | relative_url }}" alt="修改后的网格设置 9 9 9" style="width: 680px; max-width: 100%; height: auto; margin: 0 auto;">
  <figcaption style="margin-top: 0.6rem; color: #6b7280; font-size: 0.9rem;">图 4　<code>AutoVASP.sh</code> 中修改后的网格设置 <code>(9 9 9)</code></figcaption>
</figure>

需要补充说明的是，真正导致这种投影能带异常的原因，是 `AutoVASP` 计算中没有打开 SOC。图 5 中的 `SOC=0` 表明 SOC 处于关闭状态。

<figure style="margin: 1.8rem 0; text-align: center;">
  <img src="{{ '/assets/tutorials/vasp-wannier90-wanniertools/05-soc-disabled.png' | relative_url }}" alt="AutoVASP 中 SOC 未开启" style="width: 580px; max-width: 100%; height: auto; margin: 0 auto;">
  <figcaption style="margin-top: 0.6rem; color: #6b7280; font-size: 0.9rem;">图 5　<code>AutoVASP.sh</code> 中的 <code>SOC=0</code>，即 SOC 未开启</figcaption>
</figure>

因此，使用 `AutoVASP.sh` 时既要注意网格的选择，也要确认 SOC 是否已经打开。对于本例，投影能带异常的真正原因是 SOC 未开启。

## 3. Wannier90 能带拟合

这一步的目标是使用 Wannier90 拟合 VASP 能带，并得到 `wannier90_hr.dat`。

### 3.1 初次拟合

在 `AutoVASP.sh` 所在的计算目录中复制 `Wannier_cal-new.sh`：

```bash
cp /path/to/Wannier_cal-new.sh .
```

根据材料和拟合要求修改脚本中的参数，主要包括：

- disentanglement 的内、外能量窗口；
- 用于拟合的投影轨道；
- 与能带数、Wannier 函数数目及计算路径有关的参数。

> 待补充：两个能量窗口、投影轨道及其他参数的具体设置方法。

修改完成后提交任务：

```bash
bsub < Wannier_cal-new.sh
```

该脚本会依次进行所需的 VASP 和 Wannier90 计算。计算成功后，应在输出文件中找到 `wannier90_hr.dat`。

### 3.2 检查拟合质量

需要对照 VASP 得到的能带图，检查 Wannier90 拟合能带是否在关注的能量范围内与 VASP 能带良好重合。同时检查 Wannier 函数的展宽；按现有流程，可在 `WT.out` 中查看相关结果，并确认展宽与 `POSCAR` 中的晶格尺度处于合理、可比较的量级。

> 说明：标准 Wannier90 通常将展宽写入 `wannier90.wout`。如果当前脚本将相关信息汇总到 `WT.out`，则以脚本的实际输出为准。展宽是否合理还应结合轨道类型、晶格结构和拟合质量判断，不能只依据单一数值。

### 3.3 重新进行 disentanglement

Wannier90 拟合通常难以一次得到理想结果。如果初次拟合不理想，可新建 `fit/` 目录，在其中重新调整参数并进行拟合：

```bash
mkdir fit
cd fit
```

复制所需文件和 `Disentanglement.sh` 后，重点修改 `wannier90.win` 中的投影轨道、内外能量窗口等参数，再提交任务：

```bash
bsub < Disentanglement.sh
```

根据拟合结果反复调整，直到 Wannier90 能带在关注的能量范围内能够较好地复现 VASP 能带。

无论初次拟合成功，还是经过 `fit/` 中的重新拟合，最终都应得到质量较好的 `wannier90_hr.dat`。该文件可以看作针对 VASP 能带构建的紧束缚模型，后续可在此基础上计算拓扑边界态和 Berry curvature。

## 4. WannierTools 计算

下一步使用 WannierTools 计算 LDOS 和 Berry curvature。此阶段需要的主要输入文件为：

- `wannier90_hr.dat`
- `wt.in`

`wt.in` 的参数设置可参考现有内部教程中的 WannierTools 一节。LDOS 和 Berry curvature 对应的计算任务不同，因此需要分别修改 `wt.in` 中的相关参数，不能直接使用同一套设置。

> 待补充：LDOS 和 Berry curvature 计算所需的 `wt.in` 参数，以及表面方向、费米能级、K 点路径或网格等具体设置。

准备好 `wannier90_hr.dat` 和 `wt.in` 后，通过 `tool_25.sh` 提交计算：

```bash
bsub < tool_25.sh
```

计算完成后，检查 WannierTools 的输出文件，并绘制或查看 LDOS、Berry curvature 对应的结果图。

## 5. 流程总结

```text
POSCAR
  ↓
AutoVASP.sh
  ↓
VASP：SCF + NSCF
  ↓
Proband/ + Band.jpg
  ↓
Wannier_cal-new.sh
  ↓
Wannier90 初次拟合
  ↓
拟合不理想时：fit/ + Disentanglement.sh
  ↓
wannier90_hr.dat
  ↓
wt.in + tool_25.sh
  ↓
LDOS / Berry curvature 结果图
```

最终需要重点保存和检查的文件包括：

- VASP 参考能带：`nonscf/Proband/`、`nonscf/Band.jpg`；
- Wannier90 紧束缚模型：`wannier90_hr.dat`；
- WannierTools 输入文件：`wt.in`；
- WannierTools 输出的 LDOS 和 Berry curvature 数据及图片。
