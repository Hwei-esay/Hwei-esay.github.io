---
title: "Steam Deck 安装 Windows 系统详细教程"
date: 2026-05-16
categories: [教程, 硬件]
tags: [Steam Deck, Windows, 双系统, 双引导]
author: Hwei
---

# Steam Deck 安装 Windows 系统详细教程

> 本文记录了在 Steam Deck 上安装 Windows 11 的完整步骤，适用于需要使用 Windows 独占软件或游戏的用户。支持 Steam Deck OLED 与 LCD 全系列。

<!-- more -->

## 前置准备

### 硬件准备

- Steam Deck（OLED 或 LCD）
- 容量不小于 256GB 的 U 盘或移动硬盘（用于制作 Windows 安装介质）
- 稳定的网络连接（下载 Windows 镜像）
- USB-C 转 USB-A 转接头（或支持 USB-C 的 U 盘）
- 键鼠套装（Windows 安装过程中触摸板无法使用）

### 软件准备

- Windows 11 镜像（推荐从 [Microsoft 官方](https://www.microsoft.com/zh-cn/software-download/windows11) 下载）
- [Rufus](https://rufus.ie/zh/)（用于制作 U 盘启动盘）
- [Ventoy](https://www.ventoy.net/) 或 [BalenaEtcher](https://etcher.balena.io/)（备选启动盘制作工具）

### 分区规划建议

| 分区 | 文件系统 | 大小 | 用途 |
|------|---------|------|------|
| Windows 系统盘 | NTFS | 128GB+ | Windows 系统及软件 |
| SteamOS | Btrfs | 剩余空间 | 原系统（建议保留） |

{: .table }

> **注意**：Steam Deck 默认 256GB/512GB/1TB 版本的 Windows 分区容量上限不同。推荐 512GB 及以上型号安装 Windows，256GB 型号空间较为紧张。

---

## 第一步：制作 Windows 安装 U 盘

### 1.1 下载 Windows 11 镜像

访问 [Microsoft 官方镜像下载页面](https://www.microsoft.com/zh-cn/software-download/windows11)，选择「下载 Windows 11 磁盘映像（ISO）」。

推荐使用 **Windows 11 23H2** 版本，兼容性较好。

### 1.2 使用 Rufus 制作启动盘

1. 插入 U 盘（容量 ≥ 8GB）
2. 运行 Rufus，选择 U 盘设备
3. 引导类型选择「磁盘镜像或 ISO 文件」→ 点击「选择」加载 Windows 11 ISO
4. 分区方案选择 **GPT**
5. 目标系统类型选择 **UEFI（非 CSM）**
6. 文件系统选择 **NTFS**
7. 点击「开始」，等待制作完成

> ⚠️ Rufus 会提示需要补充 BCD 等文件，选择「是」继续。

### 1.3 启用 Windows 安装环境的 USB 支持

Steam Deck 在默认 BIOS 界面下无法直接识别 USB 设备，需要注入 USB 驱动：

1. 下载 [Steam Deck Windows USB 驱动包](https://help.steampowered.com/en/faqs/view/0917551E-E3B4-C58D-2D61-51D5F4E2E7F3)（Steam 官方支持页面）
2. 将驱动包解压到 U 盘的 `EFI/_drivers` 目录
3. 或者使用 [GStore 镜像站](https://gs.ggasy.com) 提供的预置驱动版 Windows 镜像

---

## 第二步：进入 BIOS 并调整启动顺序

### 2.1 进入 Steam Deck BIOS

1. 关机状态下，长按 **「音量减」+「电源键」**
2. 听到提示音后松开，屏幕出现 BIOS 界面

### 2.2 配置 BIOS 设置

1. 进入 **Setup (Configure options)**
2. 选择 **Boot from File** → 选择 U 盘（通常显示为 "USB Drive"）
3. 若 U 盘无法识别，返回 BIOS 主界面，进入 **Setup** → **Shell** → 加载 USB 驱动：

   ```
   load -v -n efi/filesystems/impUREfiUsbHostDx DjCnCx64_x64.efi
   ```

4. 之后再次尝试从 U 盘启动

---

## 第三步：磁盘分区

### 3.1 在 Windows 安装界面分区

1. 语言选择「中文（简体）」，点击下一步
2. 点击「现在安装」
3. 选择「我没有产品密钥」（后续可在系统内激活）
4. 选择 Windows 版本：**Windows 11 专业版**（功能最全）
5. 勾选「我接受许可条款」→ 下一步
6. 选择「自定义：仅安装 Windows（高级）」

### 3.2 分区操作

进入磁盘分区界面后，会看到 Steam Deck 的 eMMC/SSD：

| 操作 | 说明 |
|------|------|
| 删除原有分区 | 清除 SteamOS 分区表 |
| 新建简单卷 | 为 Windows 创建分区 |
| 压缩卷 | 从现有分区压缩空间给 Windows |

**推荐分区方案**（以 512GB 为例）：

1. 选中整个磁盘 → 删除所有现有分区
2. 新建 Windows 分区：选择「新建」→「分配 150GB」（NTFS）→ 应用
3. 剩余空间保持未分配状态，后续可装回 SteamOS

> ⚠️ 如果遇到「我们无法创建新的分区」错误，按 `Shift+F10` 打开命令行，使用 `diskpart` 手动分区：
> ```
> list disk
> select disk 0
> clean
> convert gpt
> create partition primary size=150000
> format fs=ntfs label="Windows"
> exit
> ```

---

## 第四步：安装 Windows 11

1. 选择刚才创建的 Windows 分区 → 下一步
2. 等待 Windows 文件复制（约 10-20 分钟）
3. 自动重启后进入「准备中」阶段（约 5-10 分钟）
4. 区域设置 → 选择「中国」
5. 键盘布局 → 选择「微软拼音」/「US」
6. 连接网络 → 选择「跳过」（部分驱动需要后续手动安装）
7. 创建本地账户 → 设置用户名、密码
8. 隐私设置 → 全部「否」/「关闭」→ 接受

---

## 第五步：安装必要驱动

Windows 11 装好后，很多硬件无法识别，需要安装 Steam Deck 官方驱动包。

### 5.1 下载官方驱动

在 Steam Deck Windows 驱动页面下载：[https://help.steampowered.com/en/faqs/view/0917551E-E3B4-C58D-2D61-51D5F4E2E7F3](https://help.steampowered.com/en/faqs/view/0917551E-E3B4-C58D-2D61-51D5F4E2E7F3)

驱动包包含：

- **GPU 驱动**（AMD Van Gogh APU）
- **Wi-Fi / 蓝牙驱动**
- **音频驱动**
- **SD 读卡器驱动**
- **Steam Deck 控制驱动**（让手柄按键正常工作）

### 5.2 安装顺序

建议按以下顺序安装：

1. **GPU 驱动**（最重要，必须先装）
2. **Wi-Fi 驱动**（否则无法上网）
3. **音频驱动**
4. **SD 卡驱动**
5. **Steam 输入驱动**

### 5.3 控制面板配置

安装完 Steam 输入驱动后：

1. 打开「控制面板」→「设置」→「蓝牙或其他设备」
2. Steam Deck 应该被识别为 Xbox 兼容控制器
3. 手柄的触控板、陀螺仪等功能需要配合 Steam 软件使用

---

## 第六步：安装 Steam 和 SteamOS 双系统切换

### 6.1 安装 Steam

从 [store.steampowered.com](https://store.steampowered.com/about/) 下载安装 Steam。

### 6.2 恢复 SteamOS 分区（可选）

如果希望保留双系统引导：

1. 准备 SteamOS 恢复镜像
2. 用 U 盘启动，进入 SteamOS
3. 在 Linux 分区重新安装 SteamOS

### 6.3 设置默认启动系统

在 BIOS 中可以设置默认启动系统，或者使用 [Ventoy](https://www.ventoy.net/) 多系统 U 盘实现一键切换。

---

## 常见问题

### Q1：Windows 11 安装卡在「正在准备」界面？

这是因为 Steam Deck 的存储控制器驱动未加载。尝试使用预置驱动的镜像，或在 UEFI Shell 中手动加载 NVMe 驱动。

### Q2：Wi-Fi 无法搜索到 5GHz 网络？

Steam Deck 的 Wi-Fi 模组支持 5GHz，但部分 Windows 镜像的驱动默认未启用。安装官方驱动后即可解决。

### Q3：Steam Deck 控制器的按键全部失灵？

确认已安装「Steam 输入驱动」。安装完成后，打开 Steam 客户端，在「设置」→「控制器」→「通用控制器设置」中启用 Steam Deck 支持。

### Q4：如何调整 Windows 下的风扇曲线？

Steam Deck 的风扇由 SteamOS 控制。在 Windows 下可使用 [SteamDeckTools](https://github.com/aylward/SteamDeckTools) 软件手动调节风扇曲线。

### Q5：双系统如何快速切换？

安装 [rEFInd](https://www.roberts下山.me/efi.php) 引导管理器，开机时可以选择启动 Windows 或 SteamOS。

---

## 参考链接

- [Steam Deck Windows 驱动官方下载](https://help.steampowered.com/en/faqs/view/0917551E-E3B4-C58D-2D61-51D5F4E2E7F3)
- [Microsoft Windows 11 官方镜像](https://www.microsoft.com/zh-cn/software-download/windows11)
- [Rufus 官网](https://rufus.ie/zh/)
- [Steam Deck DIY 维基](https://gist.github.com/aeikeme)

---

*本文会随 Steam Deck 更新持续维护。如有问题欢迎在 GitHub 提 Issue。*
