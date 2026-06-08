---
title: "数理方法：傅里叶变换与热传导方程"
date: 2024-12-30
summary: "用积分变换求解无限长细杆热传导问题，并记录正交函数与无穷积分参考。"
source_repository: "https://github.com/Hwei-esay/Physics"
source_commit: "ab02139"
---

## 积分变换法

### 思路：

- 列出定解问题
- 对方程和边界条件做傅立叶变换
- 对傅立叶变换后的方程求解
- 做$\tilde u(k,t)$傅立叶逆变换

### 例题

求解无限长细杆热传导问题 $$ \begin{array}{} \begin{cases} u_t=a^2u_{xx} \\ u|_{t=0}=\varphi(x) \end{cases} \end{array}{} $$

#### 1. 傅立叶变换

> **提示**
>
> 因为x的取值范围是全空间，t只有正半边。

$$ \begin{cases} \tilde u(k,t)=\frac{1}{\sqrt{2\pi}}\int_{-\infty}^{\infty}u(x,t)e^{-ikx}dx \\ u(k,t)=\frac{1}{\sqrt{2\pi}}\int_{-\infty}^{\infty}\tilde u(x,t)e^{ikx}dx \end{cases} $$

得到傅立叶变换之后的定解问题： $$ \begin{cases} \frac{\partial u'(k,t)}{\partial t}=a^2 (ik)^2 u'(k,t) \\ u'(k)|_{t=0}=\varphi'(k) \end{cases} $$ 可以看到方程变成了一阶常系数微分方程

#### 2.求解一阶常系数微分方程

$$ \frac{d \tilde u(k,t)}{dt}=-a^2 k^2 \tilde u(k,t) \\ $$

$$ \frac{d \tilde u (k,t)}{\tilde u(k,t)} = -a^2 k^2 dt $$

$$ \ln \tilde u =-a^2 k^2 t+c $$

$$ \tilde u=Ae^{-a^2 k^2 t} $$

使用边界条件求常数 $$ \tilde u(k,t)|_{t=0}=A=\tilde \varphi(k) $$ 所以 $$ \tilde u(k,t)=\tilde \varphi(k)e^{-a^2k^2t} $$

#### 3.逆傅立叶变换

$$ u(x,t)=\frac{1}{\sqrt{2\pi}}\varphi(x)*\int_{- \infty}^{\infty}\frac{1}{\sqrt{2\pi}}e^{-a^2k^2t}e^{ikx}dk $$

关注积分部分：

$$ \frac{1}{\sqrt{2\pi}}\int_{-\infty}^{\infty}e^{-a^2t(k^2-ikx/a^2t)}dk $$

指数上凑平方 $$ \frac{1}{\sqrt{2\pi}}\int_{-\infty}^{\infty}e^{-a^2t[(k-ix/{2a^2t})^2-(ix/2a^2t)^2]}dk $$ 有公式： $$ \int_{-\infty}^{\infty}e^{-x^2}dx=\sqrt{\pi} $$ 可得积分部分为 $$ \frac{1}{a\sqrt{2t}}e^{-x^2/4a^2t} $$

带回卷积表达式：

$$ u(x,t)=\frac{1}{\sqrt{2\pi}}\varphi(x)*\frac{1}{a\sqrt{2t}}e^{-x^2/4a^2t} $$

$$ u(x,t)=\frac{1}{2a\sqrt{\pi t}}\int_{-\infty}^{\infty}\varphi(\xi)e^{-(x-\xi)^2/4a^2t}d\xi $$

### 参考

1.[【bilibili】积分变换法](https://www.bilibili.com/video/BV1pC4y1b7ca/?spm_id_from=333.337.search-card.all.click&vd_source=8618b35766148e933dd3adf968d119bd)

## 傅立叶变换

- 为什么积分可以证明函数的正交性

### 正交函数

#### 函数的正交是向量正交的推广

对于向量的正交性的定义是内积为0（即两个向量在各自方向的投影为0） $$ X=(x_1,x_2,x_2,\cdots,x_n),Y=(y_1,y_2,y_2,\cdots,y_n) $$

$$ X\cdot Y=x_1y_1+x_2y_2+x_3y_3+\cdots+x_ny_n $$

对应到函数：

$$ \int_{t_1}^{t_2}\varphi_n(t)\varphi_m^*(t)dt= \begin{cases} 0,&n\ne m \\ K,&n=m \end{cases} $$

函数集 $\{\varphi_n(t)\}$ 在 $(t_1,t_2)$ 区间内正交。

若$K=1$，则函数集为归一化正交函数集

### 参考

1.[【csdn】三角函数的正交性为什么用积分表示](https://blog.csdn.net/bestone0213/article/details/24346525)

## 无穷积分

### 参考

1.[【知乎】复变函数（4）](https://zhuanlan.zhihu.com/p/76868291)

2.[【知乎】复变函数（5）](https://zhuanlan.zhihu.com/p/77163755)
