---
title: VASP-Phonopy 声子计算完整流程
date: 2026-07-20
authors: [hwei]
summary: 以 K₂ZnBr₄ 极性结构为例，整理从结构优化、有限位移预计算和批量验收到声子谱、态密度、热力学性质及 NAC 修正的完整流程。
---

## 1. 教程目标

本教程以 K₂ZnBr₄ 的极性结构为例，介绍如何使用 VASP 和 Phonopy 完成有限位移法声子计算，最终得到声子谱、声子态密度和热力学性质。

文中的 LSF 队列、软件路径和并行参数来自当前计算环境。将流程用于其他服务器时，需要按实际环境修改，不能直接照搬路径。

这类计算真正耗时的部分，不是 Phonopy 本身，而是几十个位移超胞的 VASP 静态力计算。本例生成了 42 个位移结构，如果直接全部提交，任何一个公共参数设置错误都会造成大量机时浪费。因此，本教程在正式批量计算前加入预计算：先用最终生产参数计算一个位移结构，确认电子迭代、能量和原子力都正常，再开始剩余任务。

需要先说明一点：预计算只能验证公共输入和计算环境是否可靠，不能保证后面的每一个位移结构都一定成功。批量任务结束后，仍然需要逐个检查。完整流程为：

```text
准备并检查 POSCAR
  ↓
原胞参数收敛测试
  ↓
结构优化
  ↓
选择并测试 DIM
  ↓
Phonopy 生成位移结构
  ↓
使用最终参数预计算 1 个位移结构
  ↓
预计算通过：批量计算全部位移结构
预计算失败：停止批量任务并修改参数
  ↓
逐个检查所有位移结构的 VASP 输出
  ↓
生成 FORCE_SETS / FORCE_CONSTANTS
  ↓
声子谱、DOS、热力学性质和 NAC 修正
```

## 2. VASP 和 Phonopy 分别做什么

VASP 和 Phonopy 不是同一个软件，两者在计算中负责的内容不同。

| 软件 | 主要作用 |
| --- | --- |
| VASP | 优化结构，并计算每个位移超胞中所有原子的力 |
| Phonopy | 生成位移结构，根据 VASP 的力构建力常数，再计算声子谱、DOS 和热力学性质 |

有限位移法的基本逻辑是：Phonopy 将某个原子移动一个很小的距离，VASP 计算这一位移对所有原子产生的力，Phonopy 再根据“位移-力”关系求出二阶力常数。

因此，VASP 输出的力是否准确，会直接决定最终声子谱是否可靠。一个任务即使生成了 `vasprun.xml`，也不代表它可以用于声子计算。电子迭代不稳定、未达到收敛、结构发生弛豫或者文件没有完整写完，都会污染最终的力常数。

## 3. 需要准备的文件和脚本

开始计算时需要准备：

| 文件或脚本 | 用途 |
| --- | --- |
| `POSCAR` | 优化前的原胞结构 |
| `auto_phonon.sh` | 当前使用的自动声子计算脚本 |
| `auto3.sh` | `auto_phonon.sh` 调用的结构优化脚本 |
| `POTCAR` | VASP 赝势文件，元素顺序必须与 POSCAR 一致 |
| VASP | 计算结构能量和原子力 |
| Phonopy | 生成位移结构和进行声子后处理 |
| VASPKIT | 生成 K 点和高对称路径 |

本教程提供两个配套脚本：

- [下载 phonon_precheck.sh]({{ '/assets/tutorials/vasp-phonopy-workflow/phonon_precheck.sh' | relative_url }})：正式长算前，计算并验收一个位移结构；
- [下载 check_phonon_disps.sh]({{ '/assets/tutorials/vasp-phonopy-workflow/check_phonon_disps.sh' | relative_url }})：批量检查所有 `disp-NNN` 目录。

`auto_phonon.sh` 是 LSF 任务脚本，通过下面的方式提交：

```bash
bsub < auto_phonon.sh
```

正式提交前，应记录实际使用的软件版本：

```bash
vasp_std 2>&1 | head
phonopy --version
vaspkit -version
```

VASP 通常不能直接这样单独启动，上面的命令只是表达需要记录版本。实际可以从任务日志、模块系统或可执行文件路径中确认。

## 4. 当前自动脚本的运行逻辑

当前 `auto_phonon.sh` 的主要流程是：

```text
读取脚本参数
  ↓
生成 INCAR-st、INCAR-opt、KPOINTS 和 mesh.conf
  ↓
VASPKIT 生成 KPATH.phonopy
  ↓
调用 auto3.sh 优化结构
  ↓
phonopy -d 生成 POSCAR-001、POSCAR-002……
  ↓
依次建立 disp-001、disp-002……目录
  ↓
在每个目录中运行一次 VASP
  ↓
phonopy -f 收集全部 vasprun.xml
  ↓
计算声子谱、DOS 和热力学性质
```

这个逻辑可以完成计算，但缺少中间验收。脚本只要看到 `disp-001/` 已经存在，就会直接跳过，不会判断其中的 VASP 是否成功；最后又会直接读取所有 `disp-*/vasprun.xml`。这正是当前流程最需要修改的地方。

## 5. 修改 auto_phonon.sh 中的参数

### 5.1 任务队列和 VASP 路径

脚本开头为 LSF 参数：

```bash
#BSUB -q intel768
#BSUB -n 48
#BSUB -e %J.err
#BSUB -o %J.out
#BSUB -J k2znbr4
#BSUB -R "span[ptile=48]"
```

这里申请一个节点的 48 核。还要检查 VASP 路径：

```bash
export PATH=/work/wangr/dxy/software/dmft/dmft/vasp/vasp.5.4.4-allbak/bin:$PATH
```

本例日志显示使用的是 VASP 5.4.4。正式计算前最好在预计算日志中再次确认版本，防止登录环境和计算节点加载了不同的 VASP。

### 5.2 DIM

当前脚本写的是：

```bash
export DIM="2 2 2"
```

如果输入 POSCAR 有 14 个原子，`DIM = 2 2 2` 应得到：

```text
14 × 2 × 2 × 2 = 112 个原子
```

但前面实际日志显示：

```text
POSCAR found : 3 types and 168 ions
```

168/14=12。如果服务器上使用的仍是这个 14 原子 POSCAR，那么实际计算对应的超胞行列式为 12，最常见的情况是 `DIM = 2 2 3`。这说明本地脚本、服务器脚本或实际输入结构中至少有一项不一致。

这个问题必须在继续计算前查清楚。不要只看脚本中的 `DIM`，还要检查：

```bash
grep -n "DIM" auto_phonon.sh phonopy_disp.yaml mesh.conf KPATH.phonopy
grep "NIONS" disp-001/OUTCAR | tail -1
```

`DIM` 负责实空间超胞，不能凭经验一次确定。对当前晶格，可先使用 `2 2 2`，再用更大超胞做收敛测试。超胞收敛时应比较软模、Γ 点附近声学支和主要高对称点频率，而不是只比较总能量。

### 5.3 原胞和超胞的 K 点

当前脚本中，结构优化使用：

```text
12 12 12
```

位移超胞使用：

```text
4 4 4
```

两者不能彼此独立设置。超胞扩大后，倒空间缩小，K 点数可以相应减少。例如原胞已经用 `12 12 12` 收敛：

| DIM | 等密度的超胞 K 点起始参考 |
| --- | --- |
| `2 2 2` | `6 6 6` |
| `2 2 3` | `6 6 4` |

这只是由尺寸缩放得到的起点，不代表必须使用这么密的网格。112 或 168 原子的超胞可能在 `4 4 4` 时已经收敛，也可能没有。正式计算前应至少比较两到三组网格，例如：

```text
2 2 2 超胞：4×4×4、5×5×5、6×6×6
2 2 3 超胞：4×4×3、5×5×3、6×6×4
```

比较相同结构的总能量、原子力和计算时间。如果关注声子，应以原子力变化为主要标准。最终使用的 `KPOINTS_phonon` 必须同时用于预计算和全部批量计算。

### 5.4 INCAR-st

声子有限位移结构只计算静态力，不能再弛豫。建议的核心设置为：

```text
PREC   = Accurate
IBRION = -1
NSW    = 0
ENCUT  = 500
EDIFF  = 1E-8
ISMEAR = 0
SIGMA  = 0.05
NELM   = 100
LREAL  = .FALSE.
ALGO   = Normal
ADDGRID = .TRUE.
LWAVE  = .FALSE.
LCHARG = .FALSE.
```

`ALGO = Normal` 是当前计算尤其需要确认的参数。此前日志在前 5 步使用 DAV，之后切换到 RMM，并出现几百到上千次：

```text
WARNING in EDDRMM: call to ZHEGV failed
```

这说明实际运行使用的是 `ALGO = Fast` 一类的 RMM-DIIS 流程，而不是当前模板里的 `ALGO = Normal`。

原因在于脚本只有在 `INCAR-st` 不存在时才生成新文件：

```bash
if [ ! -f INCAR-st ]
then
    # 生成 INCAR-st
fi
```

如果工作目录里已经有旧版 `INCAR-st`，脚本不会更新它。因此，每次提交前都要直接检查实际文件：

```bash
grep -E "ALGO|IALGO|EDIFF|NELM|IBRION|NSW|LREAL|ENCUT" INCAR-st
```

不要只检查 `auto_phonon.sh` 里的模板。

当前模板还重复写了两次 `LREAL`：

```text
LREAL = $LREAL
LREAL = F
```

建议只保留一次，避免以后修改了前一项却忘记后一项。

### 5.5 ATOM_NAME 和 mesh.conf

当前脚本写的是：

```bash
export ATOM_NAME="C"
```

这明显不是 K₂ZnBr₄。应改为：

```bash
export ATOM_NAME="K Zn Br"
```

如果 POSCAR 已经包含元素名称，新版 Phonopy 通常不需要 `ATOM_NAME`，也可以从 `mesh.conf` 中删掉。

当前 `mesh.conf` 使用：

```text
MP = 8 8 8
```

这里的 `MP` 是声子 q 点网格，不是 VASP 的电子 K 点。`8 8 8` 可以用于快速检查，但不建议直接作为最终 DOS 和热力学网格。可先测试：

```text
MESH = 16 14 12
MESH = 20 18 16
MESH = 24 22 20
```

当 DOS、自由能和热容基本不再变化时，再确定最终网格。

## 6. 第一步：检查并优化结构

### 6.1 检查 POSCAR

开始前检查：

- 元素顺序与 POTCAR 一致；
- 原子数正确；
- 没有重复原子或距离异常近的原子；
- 晶格单位和坐标格式正确；
- 当前结构确实是需要研究的极化态，而不是意外生成的中心对称结构。

可以先使用：

```bash
phonopy --symmetry -c POSCAR
```

旧版本命令可能不同，应以服务器上的 `phonopy --help` 为准。

### 6.2 结构优化

当前脚本通过 `auto3.sh` 进行结构优化，并将优化后的结构复制回主目录。结构优化结束后不能只看 `opt/` 目录是否存在，需要检查：

```bash
tail -n 5 opt/OSZICAR
grep "reached required accuracy" opt/OUTCAR
grep "General timing and accounting" opt/OUTCAR
```

同时检查最后一步的：

- 最大原子力；
- 晶格应力；
- 体积和晶格常数；
- 极化结构是否仍保持目标构型；
- `CONTCAR` 是否完整。

优化结果通过后，将最终 `CONTCAR` 明确复制为新的 `POSCAR`：

```bash
cp opt/CONTCAR POSCAR
```

当前脚本使用 `cp POSCAR ../POSCAR`，它依赖 `auto3.sh` 在内部把优化结构重新写回 `POSCAR`。这种隐含行为不太容易检查，教程中建议以最终 `CONTCAR` 为准。

## 7. 第二步：生成位移结构

旧版 Phonopy 常用：

```bash
phonopy -d --dim="2 2 2" -c POSCAR
```

当前脚本省略了 `-c POSCAR`，因为默认文件名就是 `POSCAR`：

```bash
phonopy -d --dim="$DIM"
```

运行后应得到：

```text
SPOSCAR
phonopy_disp.yaml
POSCAR-001
POSCAR-002
...
```

新版 Phonopy 使用：

```bash
phonopy-init -d --dim 2 2 2 --pa auto -c POSCAR
```

生成后马上检查：

```bash
ls POSCAR-* | wc -l
grep -n "supercell_matrix" phonopy_disp.yaml
```

还要打开 `SPOSCAR` 检查原子数。本例如果原胞为 14 个原子：

```text
DIM = 2 2 2 → 112 原子
DIM = 2 2 3 → 168 原子
```

如果原子数与预期不同，此时就应该停止，而不是等 VASP 跑完后再排查。

## 8. 第三步：预计算一个位移结构

这是整个流程中新增的一步。

### 8.1 为什么要做预计算

本例共有 42 个位移结构。只计算一个结构的成本约为全部计算的 1/42，却能提前发现下面这些公共问题：

- VASP 版本或编译环境错误；
- `ALGO`、`ENCUT`、`EDIFF` 等 INCAR 参数错误；
- K 点过密导致成本无法接受；
- POTCAR 顺序错误；
- 核数与 `NPAR` 的并行组合不合适；
- RMM-DIIS、`ZHEGV failed`、`BRMIX` 等电子收敛问题；
- `vasprun.xml` 无法被 Phonopy 读取。

预计算必须使用最终生产参数。使用 Γ 点做几分钟测试只能确认程序能启动，不能替代这一步。

### 8.2 建立预计算目录

推荐直接使用本教程提供的 `phonon_precheck.sh`。将它与 `POSCAR-001`、`INCAR-st`、`KPOINTS_phonon` 和 `POTCAR` 放在同一目录后提交。如果 `POSCAR-001` 已经被移动到 `disp-001/POSCAR`，脚本也会自动读取：

```bash
bsub < phonon_precheck.sh
```

脚本会自动建立 `precheck-001/`，打印实际使用的 INCAR 和 KPOINTS，运行 VASP，并检查 `ZHEGV`、正常结束标记、最终能量、原子力和 `vasprun.xml`。只有全部通过时才输出：

```text
PRECHECK PASSED
```

不要提前手动建立 `precheck-001/`，脚本发现同名目录已经存在时会停止，避免新旧结果混在一起。

如果不使用附件脚本，也可以手动建立目录。以 `POSCAR-001` 为例：

```bash
mkdir precheck-001
cp POSCAR-001 precheck-001/POSCAR
cp INCAR-st precheck-001/INCAR
cp KPOINTS_phonon precheck-001/KPOINTS
cp POTCAR precheck-001/POTCAR
```

进入目录后，再次核对实际输入：

```bash
cd precheck-001
grep -E "ALGO|IALGO|EDIFF|NELM|IBRION|NSW|LREAL|ENCUT" INCAR
head -n 8 KPOINTS
head -n 7 POSCAR
```

随后通过一个只运行当前目录 VASP 的 LSF 脚本提交预计算。不要让原来的 `auto_phonon.sh` 在同一个任务中继续循环剩余 41 个结构。

### 8.3 预计算验收标准

任务结束后，至少检查以下内容。

第一，计算必须正常结束：

```bash
grep "General timing and accounting" OUTCAR
tail -n 5 OSZICAR
tail -n 5 log
```

第二，不能出现这些错误：

```bash
grep -Ein "ZHEGV|EDDRMM|BRMIX|ZBRENT|DAV: Sub-Space|ERROR|FATAL|NaN|killed|segmentation" log OUTCAR
```

正常情况下，这条命令不应输出任何内容。

第三，必须正常得到静态计算结果：

```bash
grep "F=" OSZICAR | tail -1
grep -n "TOTAL-FORCE" OUTCAR | tail -1
grep "total drift" OUTCAR | tail -1
```

第四，检查 `vasprun.xml` 是否完整：

```bash
test -s vasprun.xml
tail -n 5 vasprun.xml
```

文件末尾应出现完整的 XML 结束标签。系统安装了 `xmllint` 时，也可以运行：

```bash
xmllint --noout vasprun.xml
```

第五，观察电子迭代。使用 `ALGO = Normal` 时，日志应以 `DAV:` 为主，不应在第 5 步后切换到大量 `RMM:`。电子步数应明显小于 `NELM`，电荷残差不能长期停滞。

当前问题日志不符合要求：一个任务出现 784 次 `ZHEGV failed`；另一个运行到第 146 个电子步仍未结束，并在第 48-50 步发生约 5 eV 的能量跳变。这样的 `vasprun.xml` 不能用于生成力常数。

### 8.4 预计算失败时怎么处理

如果出现 `ZHEGV failed`，首先保持其他参数不变，只修改电子算法：

```text
ALGO   = Normal
NELM   = 100
ISTART = 0
ICHARG = 2
```

然后从头重算同一个 `POSCAR-001`。不要继续增加 `NELM` 让 RMM 硬跑，也不要先修改五六个参数，因为这样无法知道究竟是哪一项解决了问题。

如果 `ALGO = Normal` 后仍然失败，再依次检查：

1. 原子间距和位移结构；
2. POTCAR 顺序及版本；
3. ENCUT 是否达到所有赝势中最大 ENMAX 的要求；
4. K 点和占据设置；
5. VASP 的 LAPACK/BLAS 编译和版本；
6. 相同输入在较少核数下能否正常运行。

每次只改变一个因素，然后重新运行同一个预计算。这样才有清楚的对照。

### 8.5 OSZICAR 中 dE 发散时检查并行核数

正常的电子自洽过程中，`OSZICAR` 中 `dE` 的绝对值应该整体趋近于 0。个别电子步出现小幅回升或正负号变化并不一定有问题；但如果 `dE` 连续多个电子步在很大的数量级上剧烈振荡，甚至越来越大，而且迟迟没有最终的 `F=` 行，就说明电子自洽已经发散，不能继续使用该目录中的力和 `vasprun.xml`。

![OSZICAR 中 dE 剧烈振荡并发散]({{ '/assets/tutorials/vasp-phonopy-workflow/oszicar-de-divergence.png' | relative_url }})

上图红框中的 `dE` 在相邻 `DAV` 步之间大幅正负振荡，数量级达到约 $10^6$ 至 $10^9$ eV，并没有向 0 收敛。这不是正常的收敛波动。

确认位移结构、POTCAR 顺序和实际使用的 INCAR 没有问题后，可以保持其他输入不变，先测试较少的并行核数。修改 `auto_phonon.sh` 中的 LSF 资源设置：

```bash
#BSUB -n 32
#BSUB -R "span[ptile=32]"
```

同时保持：

```bash
export NPAR=8
```

本例最初使用 96 核、`NPAR=8` 时，`disp-001/OSZICAR` 在电子迭代中发散；仅将任务改为 32 核并保持 `NPAR=8` 后，同一位移结构在 22 个电子步内正常收敛，并输出最终的 `F=` 行。因此，旧版 VASP、单个 Γ 点和特定并行划分的组合有时会影响数值稳定性。

重新测试时，不要直接启动全部位移结构。应在新目录中重新计算同一个 `POSCAR-001`，并检查实际并行配置和收敛结果：

```bash
grep -E "NPAR" disp-001/INCAR
grep -E "running on|NCORES_PER_BAND" disp-001/OUTCAR | head
grep -E "BRMIX|FEXCP|RAD_INT" disp-001/log
tail -n 5 disp-001/OSZICAR
```

成功时，错误关键词检查不应有输出，`dE` 的绝对值应逐步减小到 `EDIFF` 以下，并且 `OSZICAR` 最后出现 `F=`。32 核、`NPAR=8` 是本例验证有效的组合，不是适用于所有体系和服务器的固定参数；如果减少核数后仍然发散，应继续检查电子算法、占据设置、VASP 版本和编译环境。

### 8.6 是否需要预计算多个结构

最低要求是计算一个位移结构。如果不同元素的化学环境差别很大，可分别选择一个 K、Zn 和 Br 位移结构进行预计算。三个预计算约占总成本的 3/42，仍然比整批失败便宜得多。

具体哪个 `POSCAR-xxx` 对应哪个原子，可以在 `phonopy_disp.yaml` 中查看位移原子的编号和方向。

## 9. 第四步：批量计算所有位移结构

预计算通过后，才能开始全部位移结构的 VASP 计算。

### 9.1 当前脚本的风险

当前循环为：

```bash
for disp in POSCAR-*
do
    # 建立 disp-xxx
    # 运行 VASP
done
```

所有结构在同一个 LSF 任务中串行计算。如果一个结构需要几个小时，42 个结构可能超过队列时限；中间某一步失败，脚本仍可能继续；整个任务结束前也不容易知道已经有多少结果可靠。

更合适的方式是：

- 一个 `disp-xxx` 对应一个 LSF 子任务；
- 或使用 LSF job array 并行提交；
- 每个子任务结束后独立验收；
- 只有全部通过后才进入 `phonopy -f`。

如果暂时仍使用原脚本串行计算，至少要在每次 VASP 结束后立即检查返回值：

```bash
if ! eval "$runvasp"; then
    echo "VASP failed in $disp_dir" >&2
    exit 1
fi
```

并在进入下一个目录前执行与预计算相同的日志检查。

### 9.2 不能只根据目录是否存在来续算

原脚本使用：

```bash
if [ -d "$disp_dir" ]; then
    continue
fi
```

这意味着只要目录存在，即使里面的 VASP 没算完也会被当成已完成。正确逻辑应检查：

```bash
test -s "$disp_dir/vasprun.xml"
grep -q "General timing and accounting" "$disp_dir/OUTCAR"
grep -q "F=" "$disp_dir/OSZICAR"
```

同时确认没有错误关键词。只有这些检查全部通过，才能跳过。

### 9.3 批量计算期间的检查

不需要等 42 个结构全部结束后再检查。建议每完成一批就运行：

```bash
for d in disp-*; do
    if grep -Eqi "ZHEGV|EDDRMM|BRMIX|ZBRENT|ERROR|FATAL|NaN" "$d/log" "$d/OUTCAR" 2>/dev/null; then
        echo "FAILED: $d"
    elif ! grep -q "General timing and accounting" "$d/OUTCAR" 2>/dev/null; then
        echo "INCOMPLETE: $d"
    else
        echo "OK: $d"
    fi
done
```

本教程还提供了独立的 `check_phonon_disps.sh`，可在主目录直接运行：

```bash
bash check_phonon_disps.sh
```

它会将目录分为 `OK`、`FAILED` 和 `INCOMPLETE`，并在最后统计通过数量。只有返回值为 0 且通过数与位移结构总数一致时，才能继续生成 `FORCE_SETS`。

只要出现一个 `FAILED`，就应先判断是不是公共参数问题。如果连续多个目录出现相同错误，应停止剩余任务，而不是继续消耗机时。

## 10. 第五步：生成 FORCE_SETS

确认所有位移结构都通过检查后，再按照位移编号顺序收集力：

```bash
phonopy -f disp-001/vasprun.xml disp-002/vasprun.xml ... disp-042/vasprun.xml
```

当前脚本使用：

```bash
phonopy -f disp-*/vasprun.xml
```

因为目录编号使用三位补零，shell 通常会按正确顺序展开。但为了避免缺号或混入其他目录，运行前先检查：

```bash
printf '%s\n' disp-*/vasprun.xml
printf '%s\n' disp-*/vasprun.xml | wc -l
```

文件数必须与 `POSCAR-xxx` 的数量完全相同。

新版 Phonopy 可以使用：

```bash
phonopy-init --sp -f disp-*/vasprun.xml
```

生成 `FORCE_SETS` 或 `phonopy_params.yaml` 后，应检查 Phonopy 输出是否报告力漂移、文件数不一致或无法解析 XML。

## 11. 第六步：计算声子谱

当前脚本通过 VASPKIT 生成 `KPATH.phonopy`，然后运行：

```bash
phonopy -p -s KPATH.phonopy
```

计算前检查：

- `DIM` 与生成位移结构时完全一致；
- 高对称路径针对优化后的晶格生成；
- `NPOINTS` 足够，例如 101；
- `FORCE_SETS` 或 `FORCE_CONSTANTS` 来自全部通过验收的 VASP 结果。

当前脚本在结构优化之前生成 `KPATH.phonopy`。如果优化前后晶格或对称性发生变化，高对称路径可能不再对应最终结构。更合理的顺序是：先完成结构优化，再使用最终 POSCAR 生成高对称路径。

得到声子谱后重点检查：

- Γ 点三条声学支是否接近 0；
- 是否存在明显虚频；
- 虚频是否随 DIM、ENCUT、K 点和 EDIFF 收敛；
- 高频支是否出现不连续或异常分裂。

出现虚频不一定代表结构真的不稳定。结构未充分优化、超胞太小、力不准确以及未加入极性修正都可能产生假虚频。

## 12. 第七步：DOS 和热力学性质

建议将 `mesh.conf` 写成：

```text
DIM = 2 2 2
PRIMITIVE_AXES = AUTO

MESH = 20 18 16
GAMMA_CENTER = .TRUE.

DOS = .TRUE.
TPROP = .TRUE.
TMIN = 0
TMAX = 800
TSTEP = 10

WRITE_MESH = .FALSE.
```

其中 `DIM` 必须替换成实际使用的超胞。新版 Phonopy 已经从 `phonopy_disp.yaml` 或 `phonopy_params.yaml` 读取超胞矩阵时，可以不重复写。

运行：

```bash
phonopy -p -t -s mesh.conf
```

不同 Phonopy 版本的命令参数可能不同。新版推荐：

```bash
phonopy --config mesh.conf -p phonopy_params.yaml
```

最终需要检查：

- 总 DOS 的积分是否与振动模数量一致；
- 热力学结果是否随 MESH 收敛；
- 虚频是否被错误地忽略；
- 输出的“每摩尔”对应 primitive cell 还是化学式单位。

不要使用 `PRETEND_REAL = .TRUE.` 把明显虚频直接改成实频后作为正式热力学结果。它只能用于临时测试。

## 13. 极性材料的 BORN 和 NAC 修正

K₂ZnBr₄ 是极性结构，Γ 点附近可能存在 LO-TO splitting。最终声子结果建议计算介电张量和 Born 有效电荷，并加入非解析项修正。

在优化后的原胞上进行 VASP 计算：

```text
PREC     = Accurate
ENCUT    = 500
EDIFF    = 1E-8
IBRION   = -1
ISMEAR   = 0
SIGMA    = 0.01
LREAL    = .FALSE.
LEPSILON = .TRUE.
```

然后运行：

```bash
phonopy-vasp-born
```

将输出保存为 `BORN`，并在配置中加入：

```text
NAC = .TRUE.
```

`BORN` 中的原胞定义必须与 Phonopy 使用的 primitive cell 一致。加入 NAC 后，应重新检查 Γ 点附近的光学支和高对称路径方向。

## 14. 错误检查示例：ZHEGV failed

本次计算中，日志显示：

```text
DAV: 1
DAV: 2
...
DAV: 5
RMM: 6
...
WARNING in EDDRMM: call to ZHEGV failed
```

一个日志虽然在第 41 步写出了 `F=`，但出现了 784 次警告；另一个日志运行到第 146 步仍未完成，并发生约 5 eV 的能量跳变。这说明 RMM-DIIS 的子空间求解已经不稳定。

处理方法是：

1. 停止尚未完成的批量任务；
2. 不使用当前 `disp-001` 至 `disp-007` 中的 `vasprun.xml`；
3. 直接检查每个目录中实际复制进去的 `INCAR`；
4. 改用 `ALGO = Normal`；
5. 从原子电荷重新计算一个预计算结构；
6. 预计算无警告并正常输出力后，再重算全部位移结构。

这里最容易误判的地方，是看到最后的能量变化已经很小，就认为结果可以使用。`ZHEGV failed` 说明本征值问题求解失败，能量表面收敛不能证明波函数和原子力可靠。声子计算依赖的正是原子力，因此不能冒这个险。

## 15. 当前 auto_phonon.sh 建议修改的地方

根据本次检查，当前脚本至少需要处理以下问题：

| 当前行为 | 问题 | 建议 |
| --- | --- | --- |
| 仅在文件不存在时生成 `INCAR-st` | 旧参数会被静默复用 | 提交前打印实际 INCAR，或每次显式生成到新目录 |
| `ATOM_NAME="C"` | 与 K、Zn、Br 不符 | 改为 `K Zn Br` 或删除该项 |
| `LREAL` 写了两次 | 后一项覆盖前一项 | 只保留一次 |
| 已有 `disp-*` 目录就跳过 | 未完成目录也会被视为成功 | 根据 OUTCAR、OSZICAR、vasprun.xml 和错误关键词判断 |
| 所有位移结构在一个任务中串行计算 | 耗时长，容易超过队列时限 | 使用 LSF job array 或分批提交 |
| VASP 结束后没有立即验收 | 错误会一直传到 Phonopy | 每个目录计算后运行统一检查函数 |
| 直接执行 `phonopy -f disp-*/vasprun.xml` | 可能混入失败或不完整文件 | 全部目录通过后再执行 |
| 优化前生成高对称路径 | 路径可能与最终结构不一致 | 优化后重新生成 |
| `MP = 8 8 8` 固定 | DOS 和热力学可能未收敛 | 做 MESH 收敛测试 |
| 没有 BORN/NAC | 极性材料 Γ 点附近可能不正确 | 增加原胞介电和 Born 电荷计算 |
| 末尾 `cd ../` | 会离开工作目录，且后面没有任务 | 删除，避免以后继续扩展脚本时出错 |

建议以后把一个大脚本拆成四个明确阶段：

```text
01_prepare.sh     优化结构并生成位移结构
02_precheck.sh    只计算一个位移结构并验收
03_batch.sh       批量或数组计算全部位移结构
04_postprocess.sh 检查全部结果并运行 Phonopy
```

这样某一步出错时，只需要重做对应阶段，不会因为修改后处理参数而重新运行 VASP，也不会因为一个空的 `disp-*` 目录错误跳过计算。

## 16. 最终检查清单

### 16.1 正式批量计算前

- [ ] POSCAR 和 POTCAR 元素顺序一致；
- [ ] 原胞 ENCUT 和 K 点已经收敛；
- [ ] 结构优化达到力和应力要求；
- [ ] 优化后结构仍是目标极化态；
- [ ] `DIM` 与预期原子数一致；
- [ ] `INCAR-st` 实际内容为 `ALGO = Normal`；
- [ ] 预计算使用最终 KPOINTS、POTCAR、INCAR、核数和 `NPAR` 配置；
- [ ] 预计算没有 `ZHEGV`、`BRMIX`、NaN 等错误；
- [ ] 预计算正常输出 `TOTAL-FORCE` 和完整 `vasprun.xml`。

### 16.2 生成 FORCE_SETS 前

- [ ] 位移目录数量与 `POSCAR-xxx` 数量一致；
- [ ] 每个 OUTCAR 都正常结束；
- [ ] 每个 OSZICAR 都有最终 `F=`；
- [ ] 每个日志都没有严重电子收敛警告；
- [ ] 每个 `vasprun.xml` 都完整且可解析；
- [ ] 没有漏号或重复读取文件；
- [ ] 所有位移结构使用完全相同的 INCAR、KPOINTS 和 POTCAR。

### 16.3 最终声子结果

- [ ] Γ 点声学支行为合理；
- [ ] 虚频已经做过参数和超胞收敛检查；
- [ ] 声子谱对 DIM 收敛；
- [ ] DOS 和热力学性质对 MESH 收敛；
- [ ] 极性材料已经检查 BORN/NAC；
- [ ] 保存 POSCAR、phonopy_disp.yaml、全部输入、FORCE_SETS 和软件版本。

## 17. 流程总结

```text
POSCAR + POTCAR
  ↓
原胞 ENCUT/KPOINTS 收敛
  ↓
结构优化
  ↓
确认极化结构、对称性和晶格
  ↓
选择 DIM 并生成 phonopy_disp.yaml + POSCAR-xxx
  ↓
检查超胞原子数
  ↓
precheck-001：使用最终生产参数运行 VASP
  ↓
检查电子收敛、错误关键词、TOTAL-FORCE、vasprun.xml
  ↓
通过 → 批量计算全部位移结构
失败 → 修改一个参数并重复 precheck-001
  ↓
逐目录验收
  ↓
phonopy -f / phonopy-init --sp -f
  ↓
FORCE_SETS / phonopy_params.yaml
  ↓
声子谱
  ↓
DOS + 热力学性质
  ↓
BORN/NAC 修正与收敛检查
```

这个流程比“一次提交后等所有结果”多了一次预计算，但对于 42 个位移结构而言，这一步只增加了很小的成本。它不能替代最终检查，却可以提前发现会影响全部任务的公共错误。本次遇到的 `ALGO` 配置不一致和 `ZHEGV failed`，都应该在预计算阶段被拦住。

## 18. 参考资料

- [Phonopy 官方 VASP 工作流](https://phonopy.github.io/phonopy/vasp.html)
- [Phonopy 设置参数](https://phonopy.github.io/phonopy/setting-tags.html)
- [Phonopy 工作流](https://phonopy.github.io/phonopy/workflow.html)
- [VASP ALGO 参数](https://vasp.at/wiki/ALGO)
- [VASP RMM-DIIS 说明](https://vasp.at/wiki/RMM-DIIS)
