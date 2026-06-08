---
title: "Kane-Mele 模型学习笔记"
date: 2025-01-06
summary: "Kane-Mele 模型的哈密顿量、晶格基矢及各耦合项定义。"
source_repository: "https://github.com/Hwei-esay/Physics"
source_commit: "ab02139"
---

![](https://images.unsplash.com/photo-1734405285908-5899b1b81585?q=80&w=1463&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

## Hamiltonian

$$
H=t\sum_{\langle i,j\rangle}c_i^{\dagger}c_j
+i\lambda_{SO}\sum_{\langle\langle i,j\rangle\rangle}v_{ij}c_i^{\dagger}s^zc_j
+i\lambda_R\sum_{\langle i,j\rangle}c_i^{\dagger}(\mathbf{s}\times\hat{\mathbf{d}}_{ij})_zc_j
+\lambda_v\sum_i\xi_ic_i^{\dagger}c_i
$$

kane-mele模型考虑了以下作用：

- 最近邻跃迁
- 本征自旋轨道耦合
- Rashba自旋轨道耦合
- 子晶格项(质量项/onsite energy)

### 0. 定义

![Kane-Mele 晶格定义](/assets/physics/kanemele-define.png)

$$
\boldsymbol{a}_1=a\left(-\frac{1}{2},\frac{\sqrt{3}}{2}\right),\qquad
\boldsymbol{a}_2=a\left(\frac{1}{2},\frac{\sqrt{3}}{2}\right)
$$

$\boldsymbol{a}_1,\boldsymbol{a}_2$ 是晶格基矢，$a$ 是同一子晶格相邻原子之间的距离。

从 B 到 A 原子的三个最近邻矢量是：

$$
\delta_1=\frac{a}{\sqrt{3}}\left(-\frac{\sqrt{3}}{2},\frac{1}{2}\right),\quad
\delta_2=\frac{a}{\sqrt{3}}\left(\frac{\sqrt{3}}{2},\frac{1}{2}\right),\quad
\delta_3=\frac{a}{\sqrt{3}}(0,-1)
$$

因此 $\boldsymbol{a}_1=\delta_1-\delta_3$，$\boldsymbol{a}_2=\delta_2-\delta_3$。

### 1. 最近邻跃迁

可以在基底
$(\Psi_{kA\uparrow},\Psi_{kB\uparrow},\Psi_{kA\downarrow},\Psi_{kB\downarrow})$
下继续写出各项的矩阵形式。

## 附录
