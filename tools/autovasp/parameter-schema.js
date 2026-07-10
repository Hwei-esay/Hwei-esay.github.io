export const categories = [
  { key: "calculation", index: "02", title: "Calculation Type", description: "决定要执行的计算阶段与结构优化方式。" },
  { key: "electronic", index: "03", title: "Electronic Structure", description: "能带路径、能量窗口与轨道投影设置。" },
  { key: "magnetism", index: "04", title: "Magnetism", description: "自旋极化相关设置。" },
  { key: "soc", index: "05", title: "Spin–Orbit Coupling", description: "非共线 VASP 与 SOC 优化开关。" },
  { key: "kpoints", index: "06", title: "KPOINTS", description: "优化、SCF 和能带路径的 k 点采样。" },
  { key: "convergence", index: "07", title: "Convergence", description: "截断能、展宽、能带数和并行参数。" },
  { key: "advanced", index: "08", title: "Advanced", description: "AutoVASP 路径、体系名称与 DFT+U 设置。" }
];

const help = (purpose, recommendation, impact, useCases, avoid) => ({ purpose, recommendation, impact, useCases, avoid });

export const parameters = [
  {
    name: "Opt", label: "Structure Optimization", type: "boolean", defaultValue: 0, category: "calculation",
    help: help("运行结构优化并生成 opt/ 目录。", "首次研究新结构时开启；已充分弛豫的结构可关闭。", "会改变原子位置/晶格并显著增加计算时间。", "新材料、应变结构、界面与吸附体系。", "只想复算固定结构的能带或 DOS 时。")
  },
  {
    name: "Opt_contr", label: "Constrained Optimization", type: "boolean", defaultValue: 0, category: "calculation",
    help: help("调用 contrcell 版本并写入 OPTCELL，限制晶格优化自由度。", "只有明确知道要固定哪些晶格方向时才开启。", "会约束结构搜索空间，设置错误可能得到非物理解。", "二维材料、外延约束、固定真空层。", "普通三维体材料的完全弛豫。")
  },
  {
    name: "Scf", label: "Self-consistent Calculation", type: "boolean", defaultValue: 1, category: "calculation",
    help: help("生成自洽电荷密度，为后续能带与 Wannier 计算提供基础。", "脚本注释要求 Scf 不应为 0；通常保持开启。", "关闭后后续阶段可能缺少 CHGCAR/WAVECAR。", "几乎所有完整计算流程。", "仅在已有兼容的 scf/ 结果并确认外部脚本可复用时关闭。")
  },
  {
    name: "Nonscf", label: "Non-self-consistent Band", type: "boolean", defaultValue: 1, category: "calculation",
    help: help("沿高对称路径运行非自洽计算并生成能带数据。", "做能带、轨道投影或 Wannier 对照时开启。", "增加一次 VASP 运行，但不重新收敛电荷密度。", "Band Structure、SOC Band、轨道投影。", "只做结构优化或只需要总能量时。")
  },
  {
    name: "Energy_range", label: "Energy Range (eV)", type: "array", length: 2, defaultValue: [-5.0, 5.0], step: 0.1, category: "electronic",
    help: help("控制能带与投影图相对费米能的显示窗口。", "通常从 -5 到 5 eV；聚焦低能物理可缩到 ±2 eV。", "只影响后处理显示范围，不改变 VASP 本身的本征值。", "能带图、轨道投影图。", "不要把上下限写反，也不要用过窄窗口掩盖目标能带。")
  },
  {
    name: "CBM_VBM", label: "CBM / VBM Analysis", type: "boolean", defaultValue: 1, category: "electronic",
    help: help("提取导带底与价带顶信息。", "半导体和绝缘体建议开启；金属体系通常关闭。", "影响后处理分析，不改变电子结构计算。", "带隙、直接/间接带隙判断。", "Spin=1 时原脚本说明会关闭此分析；金属中也意义有限。")
  },
  {
    name: "Orbit_pro", label: "Orbital Projection Mode", type: "enum", defaultValue: 2, options: [{ value: 0, label: "0 — Off" }, { value: 1, label: "1 — Single graph" }, { value: 2, label: "2 — Multiple graphs" }], category: "electronic",
    help: help("控制轨道投影分析模式，并在非零时追加 LORBIT=11。", "先用 1 快速检查；需要分轨道对比时使用 2。", "会增加 PROCAR 等输出和后处理工作量。", "元素/轨道成分、能带反转、杂化分析。", "只关心总能带或磁性自旋计算不兼容现有后处理时。")
  },
  {
    name: "ions", label: "Projected Ions", type: "array", defaultValue: [0], category: "electronic",
    help: help("指定轨道投影分析中的原子序号；0 表示全部原子。", "先用 0 总览，再按 POSCAR 顺序填写目标原子。", "决定投影权重汇总范围，不改变 VASP 计算。", "表面态、界面态、特定元素成分。", "不要使用超出 POSCAR 原子总数的编号。")
  },
  {
    name: "orbits", label: "Projected Orbitals", type: "array", defaultValue: [1], category: "electronic",
    help: help("指定投影轨道：1=s，2–4=p，5–9=d。", "根据化学价态选择；可用空格输入多个轨道编号。", "决定投影图展示哪些轨道成分。", "p/d 轨道杂化、能带反转、晶场劈裂。", "不要填写 1–9 之外的编号。")
  },
  {
    name: "pointsize", label: "Projection Point Size", type: "number", defaultValue: 4, min: 1, max: 10, step: 1, category: "electronic",
    help: help("设置轨道投影图中散点的视觉尺寸。", "4 是清晰且不易遮挡的起点。", "只影响后处理图片，不影响物理结果。", "调整投影能带图可读性。", "过大可能遮住相邻能带，过小则难以辨认。")
  },
  {
    name: "Spin", label: "Spin Polarization", type: "boolean", defaultValue: 0, category: "magnetism",
    help: help("控制自旋极化流程。原脚本注明开启后会关闭 CBM/VBM 与轨道投影分析。", "磁性元素、自由基或可能有局域磁矩时开启。", "计算量通常增加，并可能收敛到不同磁态。", "铁磁/反铁磁候选、过渡金属、缺陷态。", "明确非磁的闭壳层体系可关闭；开启时需同时检查 INCAR 的 ISPIN/MAGMOM。")
  },
  {
    name: "SOC", label: "Spin–Orbit Coupling", type: "boolean", defaultValue: 0, category: "soc",
    help: help("使用 vasp_ncl，并向 SCF/NSCF INCAR 追加 LSORBIT 等参数。", "含 W、Bi、Te 等重元素建议开启；Rashba、拓扑、Weyl、自旋纹理研究时通常必须开启。", "会降低对称性、增加计算量，并可能打开能隙或劈裂能带。", "拓扑材料、重元素体系、磁各向异性与自旋纹理。", "普通结构优化或轻元素初筛可关闭以节省时间。")
  },
  {
    name: "Opt_soc", label: "SOC During Optimization", type: "boolean", defaultValue: 0, category: "soc",
    help: help("在结构优化阶段也加入 SOC 设置。", "只有 SOC 对结构/能量排序显著时开启。", "显著增加优化成本；通常对几何结构影响小于对能带的影响。", "重元素、磁各向异性敏感结构。", "常规预优化阶段通常关闭，先标量相对论优化。")
  },
  {
    name: "kmesh_opt", label: "Optimization k-mesh", type: "array", length: 3, defaultValue: [7, 2, 1], min: 1, step: 1, category: "kpoints",
    help: help("结构优化使用的 Gamma-centered 三维 k 点网格。", "保持各方向采样密度与倒易晶格长度大致成比例；真空方向常设 1。", "过稀会造成力和应力不准，过密会增加每一步成本。", "所有周期性结构优化。", "不要机械照搬到晶格尺寸差异很大的材料。")
  },
  {
    name: "kmesh_scf", label: "SCF k-mesh", type: "array", length: 3, defaultValue: [7, 2, 1], min: 1, step: 1, category: "kpoints",
    help: help("自洽计算使用的 k 点网格。", "至少不低于优化网格，并用总能/费米能做收敛测试。", "直接影响电荷密度、总能和后续能带精度。", "SCF、DOS、Wannier 前置计算。", "金属或小晶胞不宜使用过稀网格。")
  },
  {
    name: "Auto_K_nonscf", label: "Automatic Band Path", type: "boolean", defaultValue: 0, category: "kpoints",
    help: help("决定是否由外部 AutoVASP 工具自动生成非自洽高对称路径。", "不确定路径时开启；需要可复现的指定路径时关闭并编辑下方路径。", "改变能带采样路径，不改变 SCF 电荷密度。", "快速检查未知晶系或手动指定特殊路径。", "自动路径与目标布里渊区约定不一致时不要开启。")
  },
  {
    name: "Dimension", label: "System Dimension", type: "enum", defaultValue: 3, options: [{ value: 1, label: "1D" }, { value: 2, label: "2D" }, { value: 3, label: "3D" }], category: "kpoints",
    help: help("告诉自动 k 路径流程体系的周期维度。", "体材料选 3，二维层状/薄膜选 2，一维链选 1。", "错误维度可能生成不合适的高对称路径。", "Auto_K_nonscf=1 时尤其重要。", "不要按可视化外观选择，应按周期性边界条件选择。")
  },
  {
    name: "High_sym_points", label: "High-symmetry Path", type: "textarea", defaultValue: "0.0  0.0  0.0 ! G\n0.5  0.0  0.0 ! X\n0.5  0.5  0.0 ! M\n0.0  0.0  0.0 ! G\n0.0  0.5  0.0 ! Y\n0.5  0.5  0.0 ! M", category: "kpoints", scriptSpecial: true,
    help: help("写入 High_sym_points 文件的分数倒易坐标与标签。", "按材料晶格的标准布里渊区路径填写，并与论文采用的记号一致。", "决定非自洽能带经过哪些高对称点。", "自定义二维矩形路径、对比特定方向色散。", "当前默认 Γ–X–M–Γ–Y–M 只适合相应矩形布里渊区，不能通用于所有晶系。")
  },
  {
    name: "nk_insert", label: "Points per Path Segment", type: "number", defaultValue: 100, min: 2, step: 1, category: "kpoints",
    help: help("在相邻高对称点之间插入的采样点数。", "常规能带图用 80–150；只做快速测试可降到 30–50。", "越大曲线越平滑、非自洽计算越贵。", "Band Structure、SOC Band、Wannier 对比。", "路径段很多或体系很大时不必盲目设得过高。")
  },
  {
    name: "Encut_opt", label: "Optimization ENCUT (eV)", type: "number", defaultValue: 400, min: 1, step: 10, category: "convergence",
    help: help("结构优化的平面波截断能。", "至少参考 POTCAR 中最大的 ENMAX，常取 1.2–1.3 倍并做收敛测试。", "过低会导致能量、力和应力误差；过高增加内存与时间。", "所有结构优化。", "不要只凭默认 400 eV 判断所有元素体系都已收敛。")
  },
  {
    name: "Sigma_opt", label: "Optimization SIGMA (eV)", type: "number", defaultValue: 0.05, min: 0, step: 0.01, category: "convergence",
    help: help("结构优化电子占据的展宽宽度。", "半导体/绝缘体常用 0.05 eV；金属可结合合适 ISMEAR 调整。", "影响电子收敛、自由能与力的稳定性。", "金属和小带隙体系的稳定收敛。", "绝缘体不宜使用过大的 SIGMA 掩盖带隙。")
  },
  {
    name: "Encut_scf", label: "SCF ENCUT (eV)", type: "number", defaultValue: 400, min: 1, step: 10, category: "convergence",
    help: help("SCF 阶段设置区的平面波截断能。", "与优化保持一致或更高，并以总能/能带收敛为准。", "决定基组精度和计算资源。注意原脚本手写 INCAR_scf 当前另有 ENCUT=500 硬编码。", "SCF、能带、Wannier 前置计算。", "在未同步修正手写 INCAR 前，不要假设此变量一定覆盖其中的 500 eV。")
  },
  {
    name: "Sigma_scf", label: "SCF SIGMA (eV)", type: "number", defaultValue: 0.05, min: 0, step: 0.01, category: "convergence",
    help: help("SCF 设置区的占据展宽。", "半导体/绝缘体通常 0.05 eV；金属应结合 ISMEAR 与 k 点密度测试。", "影响费米面附近占据与电子收敛。注意手写 INCAR 中也有 SIGMA=0.05。", "SCF 与能带前置电荷密度。", "不要用过大展宽代替足够密的金属 k 点采样。")
  },
  {
    name: "NBANDS", label: "Number of Bands", type: "number", defaultValue: 400, min: 1, step: 1, category: "convergence",
    help: help("设置希望计算的总能带数。", "至少覆盖占据带并为目标未占据能区留余量；Wannier 时与 num_bands 协调。", "过少会截断目标导带，过多增加对角化成本。注意原手写 INCAR 未直接引用该变量。", "高能导带、光学、Wannier 化。", "不要把 Wannier 的 num_wann 与 NBANDS 混为一谈。")
  },
  {
    name: "npar", label: "NPAR", type: "number", defaultValue: 4, min: 1, step: 1, category: "convergence",
    help: help("VASP 5.4.4 的能带并行参数。", "常从总核数平方根附近测试，并确保与集群划分兼容。", "只影响性能与内存分布，通常不改变物理结果。", "旧版 VASP 的 MPI 并行调优。", "SOC/非共线或新版并行策略中不要盲目沿用。")
  },
  {
    name: "Dir_AutoVASP", label: "AutoVASP Directory", type: "text", defaultValue: "/work/wangr/AutoVASP1.2/", category: "advanced",
    help: help("AutoVASP 外部 bin 脚本的安装目录。", "填写集群上的绝对路径并保留末尾斜杠。", "路径错误会导致 Potcar.sh、Initial.sh 等无法 source。", "将脚本迁移到不同用户或集群。", "不要填写本机路径或不存在的共享目录。")
  },
  {
    name: "system", label: "System Name", type: "text", defaultValue: "heterstructure", category: "advanced",
    help: help("写入 INCAR 的 SYSTEM 标识，便于区分任务。", "使用简短、无空格的材料名或结构标签。", "主要影响输出可读性，不改变物理结果。", "批量任务命名、不同应变/层数对比。", "避免 shell 特殊字符和含义不清的名称。")
  },
  {
    name: "LDAU", label: "DFT+U", type: "boolean", defaultValue: 0, category: "advanced",
    help: help("向各阶段 INCAR 追加 Dudarev DFT+U 参数。", "局域化 d/f 电子且有文献或基准依据时开启。", "会改变能级、磁矩、带隙和相稳定性。", "过渡金属氧化物、稀土与强关联候选。", "没有明确 U 值依据时不建议为“打开带隙”而随意使用。")
  },
  {
    name: "LDAUL", label: "LDAUL", type: "array", defaultValue: [0, 0, 1], category: "advanced",
    help: help("按 POTCAR 元素顺序指定施加 U 的角动量通道（-1/0/1/2/3）。", "数组长度应与元素种类数一致；常见 d 轨道用 2。", "通道选错会把 U 加到错误轨道。", "多元素 DFT+U 设置。", "不要按原子总数填写，也不要与 POSCAR/POTCAR 元素顺序错位。")
  },
  {
    name: "LDAUU", label: "LDAUU (eV)", type: "array", defaultValue: [0, 0, 0, 2.5], category: "advanced",
    help: help("按元素顺序给出有效 U 值。", "优先采用同泛函、同赝势、相近化学环境的文献或线性响应结果。", "数值会显著影响带隙、磁矩和能量排序。", "强关联 d/f 电子材料。", "数组长度必须与 POTCAR 元素种类和 LDAUL 对齐；原默认长度不一致，使用前务必核对。")
  }
];

export const templates = [
  { id: "optimization", name: "Structure Optimization", description: "先弛豫结构，保留后续 SCF。", values: { Opt: 1, Opt_contr: 0, Opt_soc: 0, Scf: 1, Nonscf: 0, Encut_opt: 500, Sigma_opt: 0.05, kmesh_opt: [7, 7, 1] } },
  { id: "band", name: "Band Structure", description: "SCF + 高对称路径非自洽能带。", values: { Opt: 0, Scf: 1, Nonscf: 1, SOC: 0, Spin: 0, Auto_K_nonscf: 0, nk_insert: 100, Energy_range: [-5, 5] } },
  { id: "dos", name: "DOS-ready SCF", description: "生成高质量 SCF 电荷密度，供外部 DOS 流程使用。", values: { Opt: 0, Scf: 1, Nonscf: 0, SOC: 0, kmesh_scf: [12, 12, 4], Sigma_scf: 0.05, Encut_scf: 500 } },
  { id: "soc-band", name: "SOC Band", description: "开启自旋与 SOC 的能带流程。", values: { Opt: 0, Scf: 1, Nonscf: 1, Spin: 1, SOC: 1, Opt_soc: 0, CBM_VBM: 0, Orbit_pro: 0, nk_insert: 120, NBANDS: 400 } },
  { id: "phonon", name: "Phonon-ready Forces", description: "高精度结构/力计算起点；脚本本身不含力常数变量。", values: { Opt: 1, Scf: 1, Nonscf: 0, SOC: 0, Encut_opt: 520, Encut_scf: 520, Sigma_opt: 0.02, Sigma_scf: 0.02, kmesh_opt: [6, 6, 1], kmesh_scf: [8, 8, 1] } },
  { id: "custom", name: "Custom", description: "保留当前所有参数，不应用任何覆盖。", values: null }
];
