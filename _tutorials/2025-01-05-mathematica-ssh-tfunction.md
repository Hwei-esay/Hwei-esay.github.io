---
title: "使用 tfunction 构建 SSH 模型哈密顿量"
date: 2025-01-05
summary: "记录 Mathematica 中 tfunction 模板、参数指定和 SSH 哈密顿量构建方法。"
source_repository: "https://github.com/Hwei-esay/Physics"
source_commit: "ab02139"
---

## 1.什么是tfunction

## 2.tfunc的模版

```mathematica
a=1;
tFunc1[\[Mu]_,v_,w_][indf_->ptf_,indi_->pti_]:=Module[{vd=ptf-pti,d,\[Phi],x,y,fills,sign,conds,zero=1.*^-5},
d=Norm[vd];
{x,y}=Norm/@TakeDrop[vd,1];
conds={d<zero,d>zero&&Abs[x]<0.41,Abs[x]>0.59};
fills={
    Hold[\[Mu]],
    Hold[v],
    Hold[w]
    };
FillWithCondition[fills,conds]];
```

前三个参数是被指定的参数（也可以是两个【v，w】）

## 3.使用tfunc构建哈密顿量

```mathematica
h1=HMatrixFromHoppings[{ptsssh3,ptsssh3},tFunc2[0,0.5,1.6],1.01]
```

> **提示**
>
> 注意在tfunc中指定参数

## 4.构建周期性晶格
