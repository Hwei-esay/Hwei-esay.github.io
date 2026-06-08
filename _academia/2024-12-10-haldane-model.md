---
title: "Haldane 模型学习笔记"
date: 2024-12-10
summary: "Haldane 模型哈密顿量、最近邻与次近邻跃迁及其动量空间矩阵形式。"
source_repository: "https://github.com/Hwei-esay/Physics"
source_commit: "ab02139"
---

![](https://images.unsplash.com/photo-1571757767119-68b8dbed8c97?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

## 1. Hamiltonian

$$H=M\sum_i\xi_ic_i^{\dagger}c_i+t_1\sum_{\langle i,j\rangle}c_i^\dagger c_j+t_2\sum_{\langle\langle i,j\rangle\rangle}e^{iv_{ij}\phi}c_i^\dagger c_j+h.c.$$

### 1.1 质量项

$$ H_1=M\sum_i\xi_i c_i^\dagger c_i $$

代表在本来的位置上产生和湮灭

### 1.2 最近邻跃迁（NN）

$$ H_2=t_1\sum_{\langle i,j\rangle}c_i^\dagger c_j $$

代表在本来位置上湮灭并在最邻近位置上产生

### 1.3 次近邻跃迁（NNN）

$$ H_3=t_2\sum_{\langle\langle i,j\rangle\rangle}e^{iv_{ij}\phi}c_i^\dagger c_j $$

代表在本来位置上湮灭并在次近邻位置上产生

### 1.4 哈密顿量转换为矩阵形式

即：写成用$a_k,b_k$来表达的形式

#### 1.4.1 傅里叶变换——($c_i \rightarrow a_k$)

$$ H_{NN}=t1\sum_k(a_k^\dagger b_k e^{-ike_1}+a_k^\dagger b_k e^{-ike_2})+a_k^\dagger b_k e^{-ike_3}+t1\sum_{k}(b_k^\dagger a_k e^{ike_1}+b_k^\dagger a_k e^{ike_2}+b_k^\dagger a_k e^{ike_3}) $$

$$ H_{NNN}=t_2e^{i\phi}\sum_k a_k^\dagger a_k(e^{-ikv_1}+e^{-ikv_2}+e^{-ikv_3})+t_2e^{i-\phi}\sum_k b_k^\dagger b_k(e^{-ikv_1}+e^{-ikv_2}+e^{-ikv_3}) $$

- 具体怎么计算的？

#### 1.4.2 使用旋量——(写成矩阵形式)

$$ H_{NN}=\begin{pmatrix} 0 & t1(e^{i{kx,ky}.a_1}+e^{i{kx,ky}.a_2}+e^{i{kx,ky}.a_3}) \\ t1(e^{-i{kx,ky}.a_1}+e^{-i{kx,ky}.a_2}+e^{-i{kx,ky}.a_3}) & 0 \end{pmatrix} $$

$$ H_{NNN}=\begin{pmatrix} t2(e^{-i{kx,ky}.b_1-i\phi}+e^{i{kx,ky}.b_1+i\phi}+e^{-i{kx,ky}.b_2-i\phi}+e^{i{kx,ky}.b_2+i\phi}+e^{-i{kx,ky}.b_3-i\phi}+e^{i{kx,ky}.b_3+i\phi}) & 0\\ 0 & t2(e^{i\phi-i{kx,ky}.b_1}+e^{i{kx,ky}.b_1-i\phi}+e^{i\phi-i{kx,ky}.b_2}+e^{i{kx,ky}.b_2-i\phi}+e^{i\phi-i{kx,ky}.b_3}+e^{i{kx,ky}.b_3-i\phi}) \end{pmatrix} $$

### 1.5 Mathematica中写出哈密顿量

$$ \left( \begin{array}{cc} 2 \text{t2} \cos (\phi -k.\text{b1})+2 \text{t2} \cos (\phi -k.\text{b2})+2 \text{t2} \cos (\phi -k.\text{b3})+M & -i \text{t1} \sin (k.\text{a1})+\text{t1} \cos (k.\text{a1})-i \text{t1} \sin (k.\text{a2})+\text{t1} \cos (k.\text{a2})-i \text{t1} \sin (k.\text{a3})+\text{t1} \cos (k.\text{a3}) \\ i \text{t1} \sin (k.\text{a1})+\text{t1} \cos (k.\text{a1})+i \text{t1} \sin (k.\text{a2})+\text{t1} \cos (k.\text{a2})+i \text{t1} \sin (k.\text{a3})+\text{t1} \cos (k.\text{a3}) & 2 \text{t2} \cos (k.\text{b1}+\phi )+2 \text{t2} \cos (k.\text{b2}+\phi )+2 \text{t2} \cos (k.\text{b3}+\phi )-M \\ \end{array} \right) $$
