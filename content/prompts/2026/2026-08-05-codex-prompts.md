---
title: "我在 Codex 惯用的 Prompts"
date: "2026-08-05"
author: "黄国政"
slug: "codex-prompts"
description: "持续更新……"
tags:
  - Prompt
pinned: true
---

自 6 月底开始使用 Codex，到现在已经有一个多月了，我越来越注重与 Codex 交流的 Prompts。在目前的学习阶段中，我知晓自己仍然不算一个真正的开发者或产品设计师，但在与 Codex 的一次次协作和日常浏览 X 的过程里，我也在不断学习进步。

这篇文章将用于记录和总结我在 Codex 和 X 中学习到的 Prompts，目前 Prompts 主要来源于我在 Codex 开发中对既往使用过的提示词的提炼，会持续修改与更新。

## `AGENTS.md`

在 [X](https://x.com/MarcosHernanz/status/2083954734487212511) 上看到一位 Vercel 的开发者分享了自己使用了约 600 亿 tokens 后的 AGENTS.md，据闻可以在开发中节省大量 tokens。

![](https://cdn.jsdelivr.net/gh/residualsun1/blog-static/project/2026/08/08-05-1.jpg)

我才发现自己还没有给 Codex 的 `AGENTS.md` 进行任何配置，因此在与 Gork 和 Codex 交流一番后，我稍微修改了一下 Hernans 的 Prompts（主要是在放弃向后兼容性上增加了一些约束），写进了 `C:\Users\用户名\.codex` 中的 `AGENTS.md`。

```Prompt
# AGENTS.md
- Do not preserve backward compatibility unless required by public APIs, persisted user data, external integrations, or staged deployments. Otherwise, remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
```

## 规划阶段

在项目开发的第一步上，我坚持先行规划（Plan），往往会向 Codex 提出详细的「**产品背景**」、「**产品描述**」，然后让 Codex 基于此从**专业资深的开发者/ UI 设计师的身份**出发，整理一份可执行的**计划文档**。

在此基础上，我还会给 Codex 提出几项约束原则：

1. **先实现一个可跑通、可交付、可验证的 Demo，不要一次性做成复杂的成品，必须先能落地，有迹可循**
2. **项目架构必须分层，简洁清晰，保证可维护性、可持续性**
3. **由于我是一个初级开发者，因此在描述上定然存在缺漏或谬误，请你以专业开发者的身份引导我**

```Prompt
（1）产品背景
Spike Jonze 拍摄的电影《Her》呈现了未来人与人工智能交谈和相恋的场景，其实也可以被认为描绘了一幅 AI 式陪伴的未来图景。主人公与人工智能 Samantha 的交谈给人以一种 AI 真能倾听人的情绪，回应人的情感的感受，受此启发，我希望能开发一款用户通过语音与大模型交谈的 Agent 产品，产品定位为 AI 语音陪伴。

（2）产品描述
产品具体需求如下：

1. 用户在产品界面可以上传图片，该图片会被渲染成特定的粒子效果（如粒子可以随着用户说话和背景音乐的强度而产生相应地的舞动幅度）。这一具体的效果请 1：1 严格地参考我上传的图片（example-1.png、example-2.png）的视觉风格，也可以尝试围绕「Three.js」「WebGL」「p5js」「SVG」「数字艺术」「粒子特效」这几个关键词或标签来思考如何实现效果。同时，由于我不具有技术背景，请你也和我介绍可能需要用到的相关技术术语，如
   1. 视觉类参数： Glow Intensity（辉光强度）, Trail Length（拖尾长度）, Color Shift / Hue Drift（色相漂移），Bloom Threshold（泛光阈值）；
   2. 交互类型：Mouse Disturbance（鼠标扰动）, Swirl Effect（漩涡效果）, Force Field Interaction（力场交互）, Gravity Well（引力井）, Magnetic Field Simulation（磁场模拟）
   3. 粒子效果：Particle Field（粒子场）, Particle Emission（粒子发射）, Particle Decay（粒子衰减）, Particle Noise（噪声驱动粒子）, GPU Instancing（GPU 实例化）, Particle Curl Noise（旋度噪声粒子）, Particle Attraction/Repulsion（吸引/排斥力场）, Particle Flow（粒子流）, Alpha Blending（透明度混合）, Additive Rendering（累加光效）
   4. 噪声/场效果：Perlin Noise, Simple Noise, Crul Noise, Vector Field, Turbulence（湍流）, Noise Octaves（噪声倍频）
   5. 等等等等……
2. 在上传的图片被粒子化以后，交互页面的模样请参考上传的 image-3.png。用户可以长按下方麦克风进入语音输入，AI 的回应方式可以有两种，一种是文字回复，另一种则是 AI 语音回复。AI 回应的交互效果是在界面中间自然浮现对话框，请参考上传的 image-4.png（文字回复）和 image-5（语音回复） 。
3. 交谈可以被归档为「日记」。当用户认为与大模型交谈的时间差不多以后，可以点击按钮「Save Memory」来保存对话，Agent 可以根据这段聊天记录，将用户说的话和大模型说的话整理成一篇日记，然后将被粒子化的图片放在「记忆回廊」之中。
4. 记忆回廊是一个单独的独立界面，背景干净纯黑，衬托粒子画像的氛围感。上传过的图片都会被放在记忆回廊中，排布模样可以参考 image-2.png
5. 我可以在产品界面添加背景音乐，音乐由用户导入上传，营造氛围感。

（3）请你基于以上需求，先以专业的开发者和资深 UI 设计师身份整理一份可执行的计划文档，与我协商交流过后，得到确认再开始执行方案。我认为这一产品可以分出几个部分，首先是 UI 设计，那些粒子效果和各种视觉效果需要什么技术？UI 的设计可能需要迭代几次，但做好后相当于完成了一半（记住，如果你无法理解我对图片粒子化的描述，且能识别视频中的效果，请提醒我上传相关的视频供你复现）；其次是大模型的调用，我们需要怎么调用大模型，可以调用哪些大模型？最后是语音的输入怎么设置？如果我希望大模型的语音音色更丰富，应该怎么做？这些是我目前所想到的分块实现思路，肯定也是不完整，因此需要你辅助我。最后再补充最重要的一点，现在需要做出来的是一个可以跑通的可交互的 Demo，不要一步就做十分复杂的成品，保证先能落地，有迹可循。
```

## 迭代阶段

```Prompt
在当前阶段中，不要在修改文件后直接 commit 和 push，必须在修改后交由我审核与亲自 commit 和 push
```

## 部署阶段

```Prompt
我需要你评估一下我的项目当前是否合适上传到 GitHub 托管，接着应该选择 Netlify，还是 Vercel，还是 Cloudflare 或者更好的平台进行部署。我的诉求是：必须明确本项目的架构，以便于本项目的维护，确保项目的可持续性，比如后续需要调整时更方便，或者需要进行大变动和调整也可以有迹可循。以及，从工程架构来看，请尽量保持项目的简洁，将冗余代码、文件进行精简，比如是否有的代码可以进行合并，是否有的代码、文件完全无关，则可以彻底删除。最基础的则是必须确保本项目的稳定性、安全性，确保功能正常运行、地理信息真实、正常渲染。由于我是初级开发者，可能还会存在疏漏，因此请你还要以资深开发者的身份补齐一个产品项目部署应当有的准备、审核（如果需要的话）。
```