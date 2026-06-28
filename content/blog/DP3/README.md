---
title: DP3 代码架构全解：从点云到动作的扩散策略
date: 2026-06-28
---

> 目标：用最短代码阅读量，完整理解 DP3 官方实现的核心架构。

| 项目 | 信息 |
|---|---|
| **论文** | [3D Diffusion Policy: Generalizable Visuomotor Policy Learning via Simple 3D Representations](https://arxiv.org/abs/2403.03954) |
| **会议** | RSS 2024 |
| **作者** | Yanjie Ze, Gu Zhang, Kangning Zhang, Chenyuan Hu, Muhan Wang, Huazhe Xu |
| **项目主页** | [3d-diffusion-policy.github.io](https://3d-diffusion-policy.github.io) |
| **代码仓库** | [github.com/YanjieZe/3D-Diffusion-Policy](https://github.com/YanjieZe/3D-Diffusion-Policy) |
| **标签** | diffusion policy, 3D vision, robot learning, imitation learning, point cloud |

---

## 一句话全景

**3D Diffusion Policy (DP3)** 是 RSS 2024 提出的通用视觉模仿学习算法，将 3D 点云表征与扩散策略结合，在仿真与真实机器人任务中均表现出惊人效果。其核心链路极简洁：

**PointNet 编码 3D 观测 → 1D U-Net 扩散去噪 → 行为克隆训练 → 输出机器人动作序列。**

---

## 目录结构速览

```
3D-Diffusion-Policy/
├── train.py                          # 训练入口
├── eval.py                           # 评估入口
├── diffusion_policy_3d/              # 核心源码
│   ├── policy/                       # 策略层
│   │   ├── base_policy.py            # 策略基类
│   │   ├── dp3.py                    # DP3 完整版策略
│   │   └── simple_dp3.py             # SimpleDP3 轻量版策略
│   ├── model/                        # 网络模型层
│   │   ├── vision/
│   │   │   └── pointnet_extractor.py # 3D 观测编码器
│   │   ├── diffusion/
│   │   │   ├── conditional_unet1d.py          # 完整版 1D Conditional U-Net
│   │   │   ├── simple_conditional_unet1d.py   # 轻量版 1D Conditional U-Net
│   │   │   ├── conv1d_components.py           # 1D 卷积基础组件
│   │   │   ├── positional_embedding.py        # 正弦位置编码
│   │   │   ├── mask_generator.py              # 低维掩码生成器
│   │   │   └── ema_model.py                   # EMA 模型
│   │   └── common/
│   │       ├── normalizer.py         # 数据归一化
│   │       └── lr_scheduler.py       # 学习率调度器
│   ├── dataset/                      # 数据加载层
│   │   ├── base_dataset.py           # 数据集基类
│   │   ├── adroit_dataset.py         # Adroit 环境
│   │   ├── dexart_dataset.py         # DexArt 环境
│   │   ├── metaworld_dataset.py      # MetaWorld 环境
│   │   └── realdex_dataset.py        # 真实机器人数据
│   ├── env_runner/                   # 环境评估层
│   │   ├── base_runner.py            # Runner 基类
│   │   ├── adroit_runner.py
│   │   ├── dexart_runner.py
│   │   └── metaworld_runner.py
│   ├── env/                          # 环境封装层
│   ├── gym_util/                     # Gym Wrapper 工具
│   ├── config/                       # Hydra 配置
│   │   ├── dp3.yaml
│   │   ├── simple_dp3.yaml
│   │   └── task/                     # 61 个任务配置
│   └── common/                       # 通用工具
└── third_party/                      # 外部依赖
```

关键文件直达链接：
- 训练入口 [`train.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/train.py)
- 评估入口 [`eval.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/eval.py)
- 策略基类 [`base_policy.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/policy/base_policy.py)
- 完整版策略 [`dp3.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/policy/dp3.py)
- 轻量版策略 [`simple_dp3.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/policy/simple_dp3.py)
- 点云编码器 [`pointnet_extractor.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/vision/pointnet_extractor.py)
- 完整版 U-Net [`conditional_unet1d.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/diffusion/conditional_unet1d.py)
- 轻量版 U-Net [`simple_conditional_unet1d.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/diffusion/simple_conditional_unet1d.py)
- 数据集基类 [`base_dataset.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/dataset/base_dataset.py)
- Adroit 数据集 [`adroit_dataset.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/dataset/adroit_dataset.py)
- Runner 基类 [`base_runner.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/env_runner/base_runner.py)
- 算法配置 [`dp3.yaml`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/config/dp3.yaml) / [`simple_dp3.yaml`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/config/simple_dp3.yaml)

---

## 三层核心抽象

DP3 代码组织遵循清晰的三层抽象：

| 层级 | 职责 | 关键文件 |
|------|------|----------|
| **策略层 (Policy)** | 定义 `predict_action()` 和 `compute_loss()`，连接观测与动作 | [`dp3.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/policy/dp3.py), [`simple_dp3.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/policy/simple_dp3.py) |
| **模型层 (Model)** | 实现神经网络前向传播：观测编码器 + 扩散模型 | [`pointnet_extractor.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/vision/pointnet_extractor.py), [`conditional_unet1d.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/diffusion/conditional_unet1d.py) |
| **数据层 (Dataset)** | 加载示范数据，提供 `__getitem__` 和归一化 | [`*_dataset.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/tree/master/diffusion_policy_3d/dataset) |

评估时额外引入 **Runner 层**，负责在仿真环境中 rollout 策略并记录视频与成功率。

---

## 训练数据流

```
[Zarr 数据文件]
    │
    ▼
[Dataset: *_dataset.py]
    │  加载 point_cloud (T, N, 3/6) + agent_pos (T, D) + action (T, Da)
    │  通过 SequenceSampler 采样固定长度序列
    ▼
[DataLoader]
    │
    ▼
[TrainDP3Workspace: train.py]
    │  调用 model.compute_loss(batch)
    ▼
[DP3.compute_loss: dp3.py]
    │  1. 归一化 obs & action
    │  2. DP3Encoder 编码观测 → obs_feature (B, Do)
    │  3. 构造 trajectory = action
    │  4. 加噪：noisy_traj = scheduler.add_noise(traj, noise, t)
    │  5. 预测：pred = UNet(noisy_traj, t, global_cond=obs_feature)
    │  6. 计算 MSE Loss(pred, target)
    ▼
[Optimizer: AdamW] ← 反向传播更新参数
```

---

## 推理数据流

```
[Env: obs_dict = {point_cloud, agent_pos}]
    │
    ▼
[DP3.predict_action: dp3.py]
    │  1. 归一化观测
    │  2. DP3Encoder 编码 → global_cond (B, Do)
    │  3. 从高斯噪声初始化 trajectory (B, T, Da)
    │  4. for t in scheduler.timesteps:
    │       trajectory = UNet(trajectory, t, global_cond)
    │       trajectory = scheduler.step(model_output, t)
    │  5. 反归一化 → action_pred
    │  6. 取 [To-1 : To-1+n_action_steps] 作为输出
    ▼
[Action] → [Env.step(action)]
```

---

## 关键模块详解

### 策略层（Policy）

#### BasePolicy
抽象基类，仅定义三个接口：
- `predict_action(obs_dict)` —— 推理
- `compute_loss(batch)` —— 训练
- `set_normalizer(normalizer)` —— 设置数据归一化器

源码：[base_policy.py](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/policy/base_policy.py)

#### DP3 / SimpleDP3
两者**代码结构几乎完全相同**，唯一区别是使用的 U-Net 不同：

- **DP3** → [`conditional_unet1d.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/diffusion/conditional_unet1d.py)（完整版：每层 2 个 ResBlock，支持 Cross-Attention 条件注入，参数量更大）
- **SimpleDP3** → [`simple_conditional_unet1d.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/diffusion/simple_conditional_unet1d.py)（轻量版：每层 1 个 ResBlock，仅支持 FiLM/Add，参数量更小，推理 **25 FPS**）

每个 Policy 包含三个子模块：
1. `obs_encoder: DP3Encoder` —— 编码 3D 观测
2. `model: ConditionalUnet1D` —— 扩散去噪网络
3. `noise_scheduler: DDIMScheduler` —— 来自 `diffusers` 的调度器

源码：[dp3.py](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/policy/dp3.py) | [simple_dp3.py](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/policy/simple_dp3.py)

### 观测编码器（DP3Encoder）

```
obs_dict = {
    "point_cloud": (B, N, 3) 或 (B, N, 6),   # 3D 坐标 (+ RGB)
    "agent_pos":   (B, D_pos),               # 机械臂/手状态
}

        point_cloud ──→ PointNetEncoderXYZ/RGB ──→ pn_feat (B, C)
        agent_pos   ──→ State MLP              ──→ state_feat (B, 64)
                              │
                              └─→ concat ──→ final_feat (B, C+64)
```

- `PointNetEncoderXYZ`：3 层 MLP + MaxPool + 投影，将点云编码为全局特征
- `PointNetEncoderXYZRGB`：4 层 MLP，支持颜色输入（6 通道）
- 最终拼接 State MLP 输出，作为 `global_cond` 输入 U-Net
- **特殊处理**：DexArt 支持 `imagin_robot`（想象机器人点云），`DP3Encoder` 会将其与真实点云拼接后再编码

源码：[pointnet_extractor.py](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/vision/pointnet_extractor.py)

### 扩散模型（ConditionalUnet1D）

标准的 **1D U-Net + FiLM 条件调制** 结构：

```
Input: (B, T, action_dim)  # T = horizon

    │
    ├──→ Down Blocks (3 层)
    │       ConditionalResidualBlock1D(x, global_feature) → Downsample
    │
    ├──→ Mid Blocks (2 层/1 层)
    │       ConditionalResidualBlock1D(x, global_feature)
    │
    ├──→ Up Blocks (3 层)
    │       Concat(skip) → ConditionalResidualBlock1D(x, global_feature) → Upsample
    │
    └──→ FinalConv → (B, T, action_dim)
```

**条件注入方式**（`condition_type`）：
- `film`：用全局特征预测 scale & bias，对特征图做仿射变换（默认）
- `add`：直接相加
- `cross_attention_add/film`：Cross-Attention（仅完整版支持）
- `mlp_film`：MLP 后再 FiLM

**时间步编码**：正弦位置编码 `SinusoidalPosEmb` + MLP，与 global_cond 拼接后作为条件。

源码：[conditional_unet1d.py](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/diffusion/conditional_unet1d.py) | [simple_conditional_unet1d.py](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/diffusion/simple_conditional_unet1d.py)

### 数据集（Dataset）

所有数据集继承 `BaseDataset`，数据存储格式为 **Zarr**：

```python
# 数据结构（以 Adroit 为例）
replay_buffer = {
    'state':       (N_total, D_state),      # 状态序列
    'action':      (N_total, D_action),     # 动作序列
    'point_cloud': (N_total, 1024, 6),      # 点云观测
    'img':         (N_total, H, W, 3),      # 图像（可选）
}
```

- `SequenceSampler`：从回放缓冲区中按 episode 采样固定长度 `horizon` 的序列
- `LinearNormalizer`：对 action、agent_pos、point_cloud 做 Min-Max 归一化
- 各数据集的区别仅在于：Zarr 路径不同、obs 字段略有差异、环境封装不同

源码：[base_dataset.py](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/dataset/base_dataset.py) | [adroit_dataset.py](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/dataset/adroit_dataset.py)

### 环境运行器（EnvRunner）

- `BaseRunner`：抽象基类，定义 `run(policy) -> log_dict`
- 各 Runner 负责：
  1. 构建环境（原始 env + PointCloudWrapper + VideoRecordingWrapper + MultiStepWrapper）
  2. 循环 `eval_episodes` 次 rollout
  3. 每次 rollout：`obs → policy.predict_action → env.step → 记录 reward/success`
  4. 返回平均成功率、视频等日志

源码：[base_runner.py](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/env_runner/base_runner.py)

---

## 配置系统（Hydra）

项目使用 **Hydra** 进行配置管理，采用分层组合设计：

```
dp3.yaml                # 算法级配置（模型结构、训练超参、优化器）
  └── task/*.yaml       # 任务级配置（数据集路径、环境类型、观测维度）
```

例如运行 DP3 在 `adroit_hammer` 任务上：

```bash
python train.py --config-name=dp3 task=adroit_hammer
```

配置文件中通过 `hydra.utils.instantiate()` 动态创建对象，实现**零硬编码**的模块替换。

源码：[dp3.yaml](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/config/dp3.yaml) | [simple_dp3.yaml](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/config/simple_dp3.yaml)

---

## DP3 vs SimpleDP3：核心差异

| 维度 | DP3 | SimpleDP3 |
|------|-----|-----------|
| U-Net | [完整版](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/diffusion/conditional_unet1d.py) | [轻量版](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/diffusion/simple_conditional_unet1d.py) |
| 每层 ResBlock 数 | 2 | 1 |
| Cross-Attention | 支持 | 不支持 |
| down_dims | [512, 1024, 2048] | [128, 256, 384] |
| 训练时间 | ~3 小时（A40） | ~1-2 小时 |
| 推理速度 | 较慢 | **25 FPS** |
| GPU 显存 | ~10G | 更少 |
| 推荐场景 | 追求最高性能 | 快速迭代、实机部署 |

---

## 阅读路线图（按优先级）

时间有限时，按以下顺序阅读即可掌握全貌：

1. **[`train.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/train.py)** —— 训练主循环、Workspace 管理
2. **[`dp3.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/policy/dp3.py)** —— 策略的 `compute_loss` + `predict_action`
3. **[`pointnet_extractor.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/vision/pointnet_extractor.py)** —— 3D 观测编码逻辑
4. **[`conditional_unet1d.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/model/diffusion/conditional_unet1d.py)** —— 扩散模型结构
5. **[`base_dataset.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/dataset/base_dataset.py) + [`adroit_dataset.py`](https://github.com/YanjieZe/3D-Diffusion-Policy/blob/master/diffusion_policy_3d/dataset/adroit_dataset.py)** —— 数据流

其余文件为支撑性代码（工具函数、环境封装、配置等），需要时再深入。

---

## 扩展新任务的最小步骤

1. 写环境封装（`env/your_task/`）
2. 写 Runner（`env_runner/your_runner.py`）
3. 生成示范数据（Zarr 格式）
4. 写 Dataset（`dataset/your_dataset.py`）
5. 写任务配置（`config/task/your_task.yaml`）
6. 运行 `train.py`

---

## 依赖关系图

```
train.py / eval.py
    │
    ├──→ TrainDP3Workspace
    │       ├──→ DP3 / SimpleDP3 (Policy)
    │       │       ├──→ DP3Encoder (Model)
    │       │       │       ├──→ PointNetEncoderXYZ/RGB
    │       │       │       └──→ State MLP
    │       │       ├──→ ConditionalUnet1D (Model)
    │       │       └──→ DDIMScheduler (diffusers)
    │       ├──→ *_Dataset (Dataset)
    │       │       └──→ ReplayBuffer + SequenceSampler
    │       ├──→ *_Runner (EnvRunner)
    │       └──→ Optimizer / EMA / LR Scheduler
    │
    └──→ Hydra Config (dp3.yaml + task/*.yaml)
```

---

## 引用

```bibtex
@inproceedings{Ze2024DP3,
  title={3D Diffusion Policy: Generalizable Visuomotor Policy Learning via Simple 3D Representations},
  author={Yanjie Ze and Gu Zhang and Kangning Zhang and Chenyuan Hu and Muhan Wang and Huazhe Xu},
  booktitle={Proceedings of Robotics: Science and Systems (RSS)},
  year={2024}
}
```

---

*文档版本：基于 [3D-Diffusion-Policy](https://github.com/YanjieZe/3D-Diffusion-Policy) 官方仓库主分支代码整理。*
