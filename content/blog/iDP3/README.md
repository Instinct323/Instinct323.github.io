---
title: iDP3 代码架构全解：从 ego-centric 点云到人形机器人动作的扩散策略
date: 2026-07-12
---

> 目标：用最短代码阅读量，完整理解 iDP3 (Improved 3D Diffusion Policy) 官方实现的核心架构。

| 项目 | 信息 |
|---|---|
| **论文** | [Generalizable Humanoid Manipulation with 3D Diffusion Policies](https://arxiv.org/abs/2410.10803) |
| **会议** | IROS 2025 |
| **作者** | Yanjie Ze, Zixuan Chen, Wenhao Wang, Tianyi Chen, Xialin He, Ying Yuan, Xue Bin Peng, Jiajun Wu |
| **项目主页** | [humanoid-manipulation.github.io](https://humanoid-manipulation.github.io/) |
| **代码仓库** | [github.com/YanjieZe/Improved-3D-Diffusion-Policy](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy) |
| **标签** | diffusion policy, 3D vision, humanoid robot, imitation learning, point cloud, real-world deployment |

---

## 一句话全景

**Improved 3D Diffusion Policy (iDP3)** 是 IROS 2025 提出的人形机器人通用视觉模仿学习算法，是 [DP3](https://3d-diffusion-policy.github.io/) 的升级版本。核心改进在于：

1. **Ego-centric 3D 视觉表征** —— 无需相机标定和点云分割，直接使用 RealSense L515 深度相机输出的原始 RGB-D 点云
2. **Multi-Stage PointNet 编码器** —— 4 层逐层全局特征聚合，替代 DP3 的单次 MaxPool 朴素 PointNet
3. **真实机器人全流程** —— 从数据采集（VisionPro / Open-TeleVision 遥操作）、训练到 GR1 人形机器人 onboard CPU 实机部署的完整 pipeline

**核心链路：**

**Multi-Stage PointNet 编码 ego-centric 点云 → 1D Conditional U-Net 扩散去噪 → 行为克隆训练 → 输出 25 DoF 动作 → 映射为 32 DoF GR1 关节指令。**

---

## 目录结构速览

```
Improved-3D-Diffusion-Policy/
├── train.py                          # 训练入口
├── deploy.py                         # 实机部署入口（GR1 机器人 onboard CPU）
├── vis_dataset.py                    # 点云 / 图像数据可视化
├── diffusion_policy_3d/              # 核心源码
│   ├── policy/                       # 策略层
│   │   ├── base_policy.py            # 策略基类
│   │   ├── diffusion_pointcloud_policy.py  # iDP3 点云策略
│   │   └── diffusion_image_policy.py       # 图像基线策略（Timm backbone）
│   ├── model/                        # 网络模型层
│   │   ├── vision_3d/
│   │   │   ├── pointnet_extractor.py     # iDP3Encoder（点云 + 状态编码）
│   │   │   ├── multi_stage_pointnet.py   # MultiStagePointNetEncoder（核心改进）
│   │   │   └── point_process.py          # 点云预处理（均匀采样 / pad / shuffle）
│   │   ├── vision/
│   │   │   ├── timm_obs_encoder.py       # 图像编码器（ResNet/ViT backbone）
│   │   │   └── crop_randomizer.py
│   │   ├── diffusion/
│   │   │   ├── conditional_unet1d.py     # 1D Conditional U-Net（FiLM / CrossAttn）
│   │   │   ├── conv1d_components.py      # 1D 卷积基础组件
│   │   │   ├── positional_embedding.py   # 正弦位置编码
│   │   │   ├── mask_generator.py         # 低维掩码生成器（inpainting）
│   │   │   └── ema_model.py             # 指数移动平均
│   │   └── common/
│   │       ├── normalizer.py             # Min-Max 归一化
│   │       ├── lr_scheduler.py           # cosine / linear warmup
│   │       └── ...
│   ├── dataset/                      # 数据加载层
│   │   ├── base_dataset.py           # 数据集基类（BasePointcloudDataset / BaseImageDataset）
│   │   ├── gr1_dex_dataset_3d.py       # GR1 点云数据集（Zarr 回放缓冲区）
│   │   └── gr1_dex_dataset_image.py    # GR1 图像数据集
│   ├── workspace/                    # 训练工作区
│   │   ├── base_workspace.py         # Workspace 基类（Checkpoint / Snapshot / Resume）
│   │   ├── idp3_workspace.py         # iDP3 训练流程（点云策略）
│   │   └── dp_workspace.py           # 图像策略训练流程（支持 JIT 导出）
│   ├── config/                       # Hydra 分层配置
│   │   ├── idp3.yaml                 # iDP3 算法配置（模型结构、训练超参）
│   │   ├── dp_224x224_r3m.yaml       # 图像策略配置
│   │   └── task/
│   │       ├── gr1_dex-3d.yaml       # 点云任务：shape_meta + dataset 路径
│   │       └── gr1_dex-image.yaml    # 图像任务
│   └── common/                       # 通用工具
│       ├── multi_realsense.py        # RealSense L515 多进程相机驱动
│       ├── gr1_action_util.py        # 25↔32 DoF 关节映射 + EEF 6D 动作解析
│       ├── rotation_util.py          # 四元数 ↔ 6D 旋转 转换
│       ├── replay_buffer.py          # Zarr 回放缓冲区读写
│       ├── sampler.py                # SequenceSampler（按 episode 滑动窗口采样）
│       ├── checkpoint_util.py        # TopKCheckpointManager（按 metric 保留最佳 K 个）
│       └── json_logger.py            # 本地 JSON 日志
├── scripts/
│   ├── train_policy.sh               # 训练脚本封装（指定 alg / task / exp_name）
│   ├── deploy_policy.sh              # 部署脚本封装
│   └── vis_dataset.sh                # 可视化脚本封装
└── third_party/
    ├── visualizer/                     # 点云可视化（open3d / plotly）
    └── r3m/                            # R3M 预训练图像表征（图像基线使用）
```

关键文件直达链接：
- 训练入口 [`train.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/train.py)
- 部署入口 [`deploy.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/deploy.py)
- iDP3 策略 [`diffusion_pointcloud_policy.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/policy/diffusion_pointcloud_policy.py)
- 图像策略 [`diffusion_image_policy.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/policy/diffusion_image_policy.py)
- iDP3 编码器 [`pointnet_extractor.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/vision_3d/pointnet_extractor.py)
- 多阶段 PointNet [`multi_stage_pointnet.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/vision_3d/multi_stage_pointnet.py)
- 点云预处理 [`point_process.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/vision_3d/point_process.py)
- U-Net [`conditional_unet1d.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/diffusion/conditional_unet1d.py)
- 点云数据集 [`gr1_dex_dataset_3d.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/dataset/gr1_dex_dataset_3d.py)
- Workspace 基类 [`base_workspace.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/workspace/base_workspace.py)
- iDP3 训练工作区 [`idp3_workspace.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/workspace/idp3_workspace.py)
- 图像训练工作区 [`dp_workspace.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/workspace/dp_workspace.py)
- RealSense 驱动 [`multi_realsense.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/common/multi_realsense.py)
- 动作映射 [`gr1_action_util.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/common/gr1_action_util.py)
- iDP3 配置 [`idp3.yaml`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/config/idp3.yaml)
- 任务配置 [`gr1_dex-3d.yaml`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/config/task/gr1_dex-3d.yaml)

---

## 四层核心抽象

iDP3 代码组织遵循清晰的四层抽象，相比 DP3 增加了 **Workspace 层** 统一管理训练生命周期：

| 层级 | 职责 | 关键文件 |
|------|------|----------|
| **策略层 (Policy)** | 定义 `predict_action()` / `compute_loss()` / `forward()`，连接观测与动作 | [`diffusion_pointcloud_policy.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/policy/diffusion_pointcloud_policy.py), [`diffusion_image_policy.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/policy/diffusion_image_policy.py) |
| **模型层 (Model)** | 观测编码器 + 扩散模型前向传播 | [`pointnet_extractor.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/vision_3d/pointnet_extractor.py), [`multi_stage_pointnet.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/vision_3d/multi_stage_pointnet.py), [`conditional_unet1d.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/diffusion/conditional_unet1d.py) |
| **数据层 (Dataset)** | 加载 Zarr 示范数据，滑动窗口采样，归一化 | [`gr1_dex_dataset_3d.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/dataset/gr1_dex_dataset_3d.py) |
| **工作区 (Workspace)** | 训练主循环、EMA、Checkpoint、Resume、WandB 日志 | [`idp3_workspace.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/workspace/idp3_workspace.py), [`base_workspace.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/workspace/base_workspace.py) |

---

## 训练数据流

```
[Zarr 数据文件]
    │
    ▼
[Dataset: gr1_dex_dataset_3d.py]
    │  加载 state (T, 32) + action (T, 25) + point_cloud (T, N, 6)
    │  通过 SequenceSampler 按 episode 滑动窗口采样固定长度 horizon=16 的序列
    │  均匀采样 / pad 点云至固定 4096 点
    ▼
[DataLoader]
    │
    ▼
[iDP3Workspace.run]
    │  调用 model.compute_loss(batch)
    ▼
[DiffusionPointcloudPolicy.compute_loss]
    │  1. LinearNormalizer 归一化 action（point_cloud / agent_pos 保持 identity）
    │  2. 若 use_pc_color=False，丢弃颜色：point_cloud = point_cloud[..., :3]
    │  3. iDP3Encoder 编码观测 → obs_feature (B, Do)
    │     ├── MultiStagePointNetEncoder: (B, 4096, 3) → (B, 128)
    │     └── StateEncoder MLP: agent_pos (B, 32) → (B, 64)
    │     └── concat → final_feat (B, 192)
    │  4. 构造 trajectory = normalized action (B, T, Da)
    │  5. 加噪：noisy_traj = noise_scheduler.add_noise(traj, noise, t)
    │  6. U-Net 预测：pred = model(noisy_traj, t, global_cond=obs_feature)
    │  7. 根据 prediction_type 选择 target（epsilon / sample / v_prediction）
    │  8. MSE Loss(pred, target) * loss_mask
    ▼
[Optimizer: AdamW] ← backward → step → lr_scheduler.step()
    │
    ▼
[EMA.step] ← 每 batch 更新指数移动平均权重
```

---

## 推理数据流

```
[RealSense / Zarr playback: obs_dict]
    │  point_cloud: (B, n_obs_steps, 4096, 6)
    │  agent_pos:   (B, n_obs_steps, 32)
    ▼
[DiffusionPointcloudPolicy.predict_action]
    │  1. 归一化观测；若 use_pc_color 颜色通道 /255.0
    │  2. 取前 n_obs_steps 帧展平：this_nobs = obs[:, :To].reshape(B*To, ...)
    │  3. iDP3Encoder 编码 → nobs_features (B*To, Do) → reshape(B, To*Do)
    │  4. 若 condition_type 含 cross_attention：reshape(B, To, Do) 作为序列条件
    │  5. 高斯噪声初始化 trajectory (B, T, Da)，T=horizon=16
    │  6. for t in scheduler.timesteps:
    │       trajectory = UNet(trajectory, t, global_cond)
    │       trajectory = scheduler.step(model_output, t).prev_sample
    │  7. 反归一化 → action_pred (B, T, 25)
    │  8. 取切片 [To-1 : To-1+n_action_steps] 作为输出
    ▼
[Action (B, n_action_steps, 25)]
    │
    ▼
[deploy.py / GR1DexEnvInference.step]
    │  1. joint25_to_joint32(act) 映射为 32 DoF 关节目标
    │  2. 上肢 IK retarget → upbody_comm.set_pos(filtered_pos)
    │  3. hand_comm.send_hand_cmd(...) 发送手部指令
    │  4. 相机采集新观测 → 拼成下一帧 obs_dict
```

---

## 关键模块详解

### 策略层（Policy）

#### BasePolicy

抽象基类，与 DP3 完全一致：

```python
class BasePolicy(ModuleAttrMixin):
    def predict_action(self, obs_dict: Dict[str, torch.Tensor]) -> Dict[str, torch.Tensor]:
        raise NotImplementedError()

    def reset(self):
        pass

    def set_normalizer(self, normalizer: LinearNormalizer):
        raise NotImplementedError()
```

源码：[base_policy.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/policy/base_policy.py)

#### DiffusionPointcloudPolicy（iDP3）

核心策略类。与 DP3 的 `dp3.py` 结构高度一致，关键差异体现在 **观测编码器** 和 **条件注入方式**：

```python
class DiffusionPointcloudPolicy(BasePolicy):
    def __init__(self, ..., pointnet_type="multi_stage_pointnet", ...):
        # 1. 解析 shape_meta，得到 action_dim=25
        # 2. 创建 iDP3Encoder 编码观测
        obs_encoder = iDP3Encoder(..., pointnet_type=pointnet_type, ...)
        obs_feature_dim = obs_encoder.output_shape()  # 128 + 64 = 192
        # 3. 创建 ConditionalUnet1D
        global_cond_dim = obs_feature_dim * n_obs_steps  # 384（默认 film/add）
        if "cross_attention" in condition_type:
            global_cond_dim = obs_feature_dim  # 192，保持序列维度
        model = ConditionalUnet1D(..., global_cond_dim=global_cond_dim, ...)
```

Policy 包含三个核心子模块：
1. `obs_encoder: iDP3Encoder` —— MultiStagePointNet + State MLP
2. `model: ConditionalUnet1D` —— 1D 扩散去噪网络
3. `noise_scheduler: DDIMScheduler` —— diffusers 调度器

**`forward()` vs `predict_action()` 的区别**：
- `forward(obs_dict)` —— 简化推理接口，直接返回 `action` 张量（用于部署时 `policy(obs_dict)` 调用）
- `predict_action(obs_dict)` —— 返回字典 `{'action': ..., 'action_pred': ...}`，包含完整的 horizon 预测（用于训练验证和可视化）

源码：[diffusion_pointcloud_policy.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/policy/diffusion_pointcloud_policy.py)

#### DiffusionImagePolicy（图像基线）

用于对比实验的图像策略，结构与 iDP3 完全一致，仅替换观测编码器：
- 观测编码器：`TimmObsEncoder`（ResNet/ViT backbone，通过 `timm` 库加载预训练权重）
- 支持 `use_depth=True` 时将 depth 拼接到 RGB 通道（4 通道输入）或仅使用 depth（1 通道）
- 其余部分（U-Net、扩散流程、mask generator）与 iDP3 共享同一套实现

源码：[diffusion_image_policy.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/policy/diffusion_image_policy.py)

---

### 观测编码器（iDP3Encoder）

iDP3 最核心的改进模块。输入观测字典经过预处理后分别送入点云分支和状态分支：

```python
obs_dict = {
    "point_cloud": (B, 4096, 3) 或 (B, 4096, 6),   # ego-centric 3D 坐标 (+ RGB)
    "agent_pos":   (B, 32),                        # GR1 上身 + 手部关节状态
}

        point_cloud ──→ uniform_sampling ──→ MultiStagePointNetEncoder ──→ pn_feat (B, 128)
        agent_pos   ──→ StateEncoder (2-layer MLP)                    ──→ state_feat (B, 64)
                                          │
                                          └─→ concat ──→ final_feat (B, 192)
```

**MultiStagePointNetEncoder（核心创新）**：

```python
class MultiStagePointNetEncoder(nn.Module):
    def __init__(self, h_dim=128, out_channels=128, num_layers=4):
        self.conv_in = nn.Conv1d(3, h_dim, kernel_size=1)
        for i in range(num_layers):
            self.layers.append(nn.Conv1d(h_dim, h_dim, kernel_size=1))
            self.global_layers.append(nn.Conv1d(h_dim * 2, h_dim, kernel_size=1))
        self.conv_out = nn.Conv1d(h_dim * num_layers, out_channels, kernel_size=1)

    def forward(self, x):  # x: (B, N, 3)
        x = x.transpose(1, 2)          # (B, 3, N)
        y = self.act(self.conv_in(x))  # (B, h_dim, N)
        feat_list = []
        for i in range(self.num_layers):
            y = self.act(self.layers[i](y))              # 局部卷积 (B, h_dim, N)
            y_global = y.max(-1, keepdim=True).values    # 全局 MaxPool (B, h_dim, 1)
            y = torch.cat([y, y_global.expand_as(y)], dim=1)  # 广播拼接 (B, h_dim*2, N)
            y = self.act(self.global_layers[i](y))       # 融合 (B, h_dim, N)
            feat_list.append(y)
        x = torch.cat(feat_list, dim=1)   # (B, h_dim*4, N)
        x = self.conv_out(x)              # (B, out_channels, N)
        x_global = x.max(-1).values       # (B, out_channels)
        return x_global
```

相比 DP3 的朴素 PointNet（3 层 MLP + 一次 MaxPool），MultiStagePointNet 的数学本质是一个 **逐层全局上下文注入网络**：
- 每一层都执行 `局部卷积 → 全局聚合 → 广播拼接 → 融合卷积`
- 4 层共 4 次全局-局部交互，最终拼接所有中间层特征后做一次聚合
- 参数量更紧凑（h_dim=128，out_channels=128），但对 4096 点的大规模点云表征能力显著强于 DP3

**StateEncoder**：
- `state_key` 在 `iDP3Encoder` 中为 `'agent_pos'`，在独立 `StateEncoder` 类中为 `'full_state'`
- 2 层 MLP（默认 `state_mlp_size=(64, 64)`）：`agent_pos (32) → hidden → output_dim=64`
- `create_mlp()` 辅助函数用于构造 `Linear + ReLU` 链，支持自定义 `net_arch` 和 `squash_output`

**点云预处理**：
- `uniform_sampling_torch`：随机均匀采样或 zero-pad 至 `num_points=4096`
- `shuffle_point_torch`：打乱点序，增强随机性
- `pad_point_torch`：当点数不足时补零并 shuffle

源码：[pointnet_extractor.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/vision_3d/pointnet_extractor.py) | [multi_stage_pointnet.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/vision_3d/multi_stage_pointnet.py) | [point_process.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/vision_3d/point_process.py)

---

### 扩散模型（ConditionalUnet1D）

与 DP3 完整版结构一致，标准 **1D U-Net + FiLM 条件调制**，新增 `CrossAttention` 支持序列条件：

```
Input: (B, T, action_dim)  # T=horizon=16, action_dim=25

    │
    ├──→ Down Blocks (3 层)
    │       ConditionalResidualBlock1D(x, global_feature) → ConditionalResidualBlock1D → Downsample1d
    │
    ├──→ Mid Blocks (2 层)
    │       ConditionalResidualBlock1D(x, global_feature)
    │
    ├──→ Up Blocks (3 层)
    │       Concat(skip) → ConditionalResidualBlock1D(x, global_feature) → ConditionalResidualBlock1D → Upsample1d
    │
    └──→ FinalConv → (B, T, action_dim)
```

**CrossAttention 条件类型（iDP3 新增）**：

```python
# conditional_unet1d.py forward
if global_cond is not None:
    if self.condition_type == 'cross_attention':
        timestep_embed = timestep_embed.unsqueeze(1).expand(-1, global_cond.shape[1], -1)
    global_feature = torch.cat([timestep_embed, global_cond], axis=-1)
```

当 `condition_type` 为 `cross_attention_add` 或 `cross_attention_film` 时：
- `global_cond` 的 shape 为 `(B, n_obs_steps, Do)` 而非 `(B, n_obs_steps * Do)`
- `timestep_embed` 沿序列维度广播拼接，形成 `(B, T_obs, dsed + Do)` 的序列条件
- `CrossAttention` 模块在 `ConditionalResidualBlock1D` 内部执行 Query-Key-Value 注意力：`query=action_feature, key/value=obs_feature`

**条件注入方式对比**：

| condition_type | 机制 | global_cond shape | 适用场景 |
|----------------|------|-------------------|----------|
| `film` | 预测 scale/bias 做仿射变换 | `(B, n_obs_steps * Do)` | 默认，效果最好 |
| `add` | 直接相加 | `(B, n_obs_steps * Do)` | 最简单，效果略差 |
| `cross_attention_add` | CrossAttn 后相加 | `(B, n_obs_steps, Do)` | 序列条件，参数量稍大 |
| `cross_attention_film` | CrossAttn 后 FiLM | `(B, n_obs_steps, Do)` | 序列条件 + FiLM |
| `mlp_film` | MLP 后 FiLM | `(B, n_obs_steps * Do)` | 增加非线性 |

**时间步编码**：`SinusoidalPosEmb(dsed=128)` + 2 层 MLP，与 global_cond 拼接后作为最终条件向量。

源码：[conditional_unet1d.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/diffusion/conditional_unet1d.py)

---

### 数据集（Dataset）

数据以 **Zarr** 格式存储，`GR1DexDataset3D` 负责加载和采样：

```python
# Zarr 数据结构
replay_buffer = {
    'state':       (N_total, 32),       # GR1 全身关节状态（用于提取 agent_pos）
    'action':      (N_total, 25),       # 25 DoF 动作
    'point_cloud': (N_total, N, 6),      # 原始点云（含 RGB），N 不固定
}
```

**Dataset 处理流程**：
1. `ReplayBuffer.copy_from_path(zarr_path, keys=...)` —— 懒加载 Zarr 数组
2. `SequenceSampler` —— 按 episode 滑动窗口采样 `horizon=16` 的连续序列，支持 `pad_before/after` 边界填充
3. `get_val_mask` / `downsample_mask` —— 划分训练/验证集，支持 `max_train_episodes` 限制训练 episode 数
4. `_sample_to_data` —— 将原始 sample 转换为训练格式：
   - `agent_pos = state[:, ]`（全部 32 维状态）
   - `point_cloud = uniform_sampling_numpy(point_cloud, num_points=4096)`
5. `get_normalizer()` —— **仅对 action 做 Min-Max 归一化**，`point_cloud` 和 `agent_pos` 使用 identity normalizer（无需归一化，保持物理尺度）

**与 DP3 数据集的关键差异**：
- DP3 的各环境数据集（Adroit/DexArt/MetaWorld）有各自的环境封装和 obs 字段差异
- iDP3 仅有一个点云数据集和一个图像数据集，结构统一，差异仅在于 `zarr_path`

源码：[gr1_dex_dataset_3d.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/dataset/gr1_dex_dataset_3d.py) | [base_dataset.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/dataset/base_dataset.py)

---

### 训练工作区（Workspace）

#### BaseWorkspace

所有 Workspace 的基类，提供训练状态持久化基础设施：

```python
class BaseWorkspace:
    def save_checkpoint(self, path, tag='latest', use_thread=False):
        # 保存 state_dict（model/optimizer/ema）+ pickles（global_step/epoch 等）
        # 支持 use_thread 异步保存，避免阻塞训练

    def load_checkpoint(self, path, tag='latest'):
        # 自动加载 latest 或 best（按 test_mean_score 解析文件名）

    def save_snapshot(self, tag='latest'):
        # 完整序列化整个 workspace 对象（含 Python 对象，代码不变时可用）

    def get_checkpoint_path(tag='latest'):
        # tag='latest' → latest.ckpt
        # tag='best'  → 扫描 checkpoints/ 目录按 test_mean_score 找最佳
```

使用 `dill` 替代 `pickle` 支持 lambda 和复杂对象的序列化；checkpoint 中区分 `state_dicts`（模块权重）和 `pickles`（标量/对象状态）。

源码：[base_workspace.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/workspace/base_workspace.py)

#### iDP3Workspace

管理完整的 iDP3 训练生命周期，与 DP3 的关键差异在于 **没有 EnvRunner**：

```python
class iDP3Workspace(BaseWorkspace):
    def run(self):
        # 1. resume from checkpoint if cfg.training.resume
        # 2. instantiate dataset → DataLoader
        # 3. normalizer = dataset.get_normalizer() → model.set_normalizer()
        # 4. instantiate optimizer, lr_scheduler, ema
        # 5. wandb.init() + JsonLogger
        for epoch in range(num_epochs):
            for batch in train_dataloader:
                loss, loss_dict = model.compute_loss(batch)
                loss.backward()
                if global_step % gradient_accumulate_every == 0:
                    optimizer.step(); optimizer.zero_grad(); lr_scheduler.step()
                if use_ema: ema.step(model)
            # --- eval ---
            policy.eval()
            # iDP3 没有仿真环境，直接在训练集上 predict_action 算 MSE
            for batch in train_dataloader:
                result = policy.predict_action(batch['obs'])
                mse = F.mse_loss(result['action_pred'], batch['action'])
            step_log['train_action_mse_error'] = mse.item()
            step_log['test_mean_score'] = -step_log['train_action_mse_error']
            # --- checkpoint ---
            if epoch % checkpoint_every == 0: save_checkpoint()
            policy.train()
```

**与 DP3 训练流程的差异**：
- DP3 每 `rollout_every` 个 epoch 启动 `EnvRunner` 在仿真环境中 rollout，计算成功率 + 录制视频
- iDP3 没有仿真环境，验证仅在训练集上执行 `predict_action` 计算动作 MSE，metric 为负 MSE
- 因此 iDP3 的 `val_every` 和 `checkpoint_every` 实际上是在训练集上的 self-evaluation

源码：[idp3_workspace.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/workspace/idp3_workspace.py)

#### DPWorkspace

管理图像策略训练，结构与 iDP3Workspace 完全一致，额外提供 `to_jit()` 方法：
- 加载 checkpoint 后，使用 `torch.jit.trace(policy, obs_dict)` 导出 TorchScript
- 在 CPU 上测试 JIT 推理 FPS，用于 onboard 部署加速

源码：[dp_workspace.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/workspace/dp_workspace.py)

---

### 实机部署（Deploy）

#### GR1DexEnvInference

部署环境封装，运行在 GR1 机器人 onboard computer（CPU only）上：

```python
env = GR1DexEnvInference(
    obs_horizon=2,            # 观测历史长度 To
    action_horizon=8,         # 每步执行的动作数 = horizon - n_obs_steps + 1 = 16 - 2 + 1 = 15
    device="cpu",             # onboard 无 GPU
    use_point_cloud=True,
    use_image=False,
    num_points=4096,
    use_waist=True,           # 是否控制腰部关节
)
```

**动作转换链（25 → 32 DoF）**：

```python
# policy 输出 action: (n_action_steps, 25)
# 25 = waist(1) + head(2) + left_arm(5) + right_arm(5) + hands(12)
# 32 = waist(3) + head(3) + left_arm(7) + right_arm(7) + hands(12)

act_32 = joint25_to_joint32(act_25)
# waist:   new_joint[0]          → joint[1]（仅 waist_pitch）
# head:    new_joint[1:3]        → joint[3], joint[5]（pitch, yaw）
# arms:    new_joint[3:13]       → 左右臂各 5 个 active joint
# hands:   new_joint[13:25]      → 12 维手部指令

# 若 use_waist=False，腰部 6DoF 强制置零（仅保留手臂+头部+手）
filtered_pos[0:6] = 0.

# 通过 Zenoh 通信发送到机器人底层
upbody_comm.set_pos(filtered_pos)           # 上肢关节
hand_comm.send_hand_cmd(hand_r, hand_l)     # 左右手
```

**关键组件**：
- `MultiRealSense`：多进程 RealSense 驱动
  - `SingleVisionProcess`：独立子进程运行相机，通过 `multiprocessing.Queue` 传递 `(color, depth, point_cloud)`
  - `create_colored_point_cloud`：从 RGB-D + 相机内参生成 `(N, 6)` 点云，先按深度 `far/near` 裁剪，再做 `grid_sample_pcd(grid_size=0.005)` 体素降采样，最后随机采样 / pad 到 `num_points`
  - 支持 front / right 双相机（默认仅 front）
- `UpperBodyCommunication` / `HandCommunication`：通过 `zenoh` 与 GR1 机器人底层控制器通信
- `ArmRetarget`：从另一仓库引入的 IK 解算器，将目标 EEF 位姿 retarget 到 14 维上肢关节
- `gr1_action_util`：
  - `joint32_to_joint25()` / `joint25_to_joint32()` —— 32↔25 DoF 投影映射
  - `extract_eef_action()` —— 从 25 维动作解析出 `body_action(6) + arm_pos(2×3) + arm_rot_6d(2×6) + hand_action(12)`
  - `extract_abs_eef()` —— delta 动作叠加到当前绝对位姿（用于 EEF 控制模式）

**部署循环**：

```python
obs_dict = env.reset(first_init=True)
while step_count < roll_out_length:
    with torch.no_grad():
        # policy.forward() 直接输出 action 张量
        action = policy(obs_dict)[0]     # (n_action_steps, 25)
        action_list = [act.numpy() for act in action]
    obs_dict = env.step(action_list)      # 执行 + 采集新观测
    step_count += action_horizon
```

源码：[deploy.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/deploy.py) | [multi_realsense.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/common/multi_realsense.py) | [gr1_action_util.py](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/common/gr1_action_util.py)

---

## 配置系统（Hydra）

项目使用 **Hydra** 进行分层组合配置：

```
idp3.yaml / dp_224x224_r3m.yaml    # 算法级配置（模型结构、训练超参、优化器、EMA）
  └── task/*.yaml                  # 任务级配置（数据集路径、观测维度、动作维度、episode 数）
```

**iDP3 典型配置**（`idp3.yaml`）：
- horizon: `16`, n_action_steps: `15`, n_obs_steps: `2`
- 扩散：DDIMScheduler, num_train_timesteps=50, num_inference_steps=10, prediction_type=`sample`
- U-Net：down_dims=`[256, 512, 1024]`, kernel_size=5, n_groups=8, diffusion_step_embed_dim=128
- 点云编码器：`pointnet_type="multi_stage_pointnet"`, out_channels=128, num_points=4096
- 优化器：AdamW, lr=1e-4, betas=[0.95, 0.999], weight_decay=1e-6
- 训练：batch_size=64, num_epochs=301, use_ema=True, lr_scheduler=cosine, lr_warmup_steps=500
- Checkpoint：`save_ckpt=False`（默认不保存中间 checkpoint，仅保留 latest）

**任务配置**（`gr1_dex-3d.yaml`）：
- point_cloud shape: `[4096, 6]`（含颜色，但默认 `use_pc_color=False`，实际只消费前 3 维）
- agent_pos shape: `[32]`
- action shape: `[25]`
- `pad_before=${eval:'${n_obs_steps}-1'}` → `pad_before=1`
- `pad_after=${eval:'${n_action_steps}-1'}` → `pad_after=14`
- `max_train_episodes=90`（约 90 个示范 episode）

运行命令：

```bash
# 训练 iDP3
bash scripts/train_policy.sh idp3 gr1_dex-3d 0913_example

# 训练图像基线
bash scripts/train_policy.sh dp_224x224_r3m gr1_dex-image 0913_example

# 部署 iDP3
bash scripts/deploy_policy.sh idp3 gr1_dex-3d 0913_example
```

源码：[idp3.yaml](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/config/idp3.yaml) | [gr1_dex-3d.yaml](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/config/task/gr1_dex-3d.yaml)

---

## iDP3 vs DP3：核心差异

| 维度 | DP3 | iDP3 |
|------|-----|------|
| **应用场景** | 仿真环境（Adroit/DexArt/MetaWorld/RealDex） | 真实人形机器人（Fourier GR1） |
| **点云编码器** | PointNetEncoderXYZ（3 层 MLP + 单次 MaxPool） | **MultiStagePointNetEncoder**（4 层逐层全局聚合） |
| **点云规模** | 1024 点 | **4096 点** |
| **点云预处理** | 无（固定点数输入） | **uniform_sampling_torch**（随机均匀采样 + pad） |
| **视觉表征** | 需要相机标定 + 点云分割（segmentation） | **Ego-centric 原始点云**，无需标定/分割 |
| **U-Net 规模** | down_dims `[512, 1024, 2048]` | down_dims `[256, 512, 1024]`（更轻量） |
| **扩散步数** | num_train_timesteps=100, inference=100 | num_train_timesteps=50, inference=10（更快） |
| **动作空间** | 仿真环境维度（如 24/30） | **25 DoF → 32 DoF**（GR1 上身+双手） |
| **训练验证** | EnvRunner 仿真 rollout 计算成功率 + 视频 | **训练集上 predict_action MSE**（无仿真环境） |
| **Workspace** | `TrainDP3Workspace`（统一处理点云/图像） | `iDP3Workspace` + `DPWorkspace`（分离点云/图像） |
| **部署** | 仅仿真评估 | **GR1 onboard CPU 部署完整 pipeline** |
| **相机驱动** | 无 | **MultiRealSense**（多进程 RealSense L515，支持双相机） |
| **动作映射** | 直接输出环境动作 | **joint25↔joint32 映射 + EEF delta 解析** |
| **图像基线** | 无 | `DiffusionImagePolicy`（Timm backbone，支持 JIT 导出） |

---

## 阅读路线图（按优先级）

时间有限时，按以下顺序阅读即可掌握全貌：

1. **[`train.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/train.py)** —— Hydra 入口，Workspace 调度
2. **[`idp3_workspace.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/workspace/idp3_workspace.py)** —— 训练主循环、EMA、Checkpoint、验证（注意无 EnvRunner）
3. **[`diffusion_pointcloud_policy.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/policy/diffusion_pointcloud_policy.py)** —— `compute_loss` + `predict_action` + `forward` 三接口辨析
4. **[`pointnet_extractor.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/vision_3d/pointnet_extractor.py)** —— iDP3Encoder + StateEncoder 结构
5. **[`multi_stage_pointnet.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/vision_3d/multi_stage_pointnet.py)** —— 核心创新：逐层全局特征聚合的数学本质
6. **[`conditional_unet1d.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/model/diffusion/conditional_unet1d.py)** —— CrossAttention 序列条件注入机制
7. **[`gr1_dex_dataset_3d.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/dataset/gr1_dex_dataset_3d.py) + [`base_dataset.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/dataset/base_dataset.py)** —— Zarr 数据流 + SequenceSampler
8. **[`deploy.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/deploy.py) + [`multi_realsense.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/common/multi_realsense.py) + [`gr1_action_util.py`](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy/blob/master/Improved-3D-Diffusion-Policy/diffusion_policy_3d/common/gr1_action_util.py)** —— 实机部署链（需要时再看）

---

## 扩展到新机器人的最小步骤

iDP3 的设计使得迁移到新机器人相对直接：

1. **遥操作采集数据**：使用 VisionPro / Open-TeleVision 或其他遥操作方案，记录 `state`, `action`, `point_cloud` 到 Zarr
2. **写任务配置**（`config/task/your_robot.yaml`）：
   - 修改 `shape_meta`：调整 `agent_pos` 维度和 `action` 维度
   - 指定 `zarr_path` 和 `max_train_episodes`
3. **运行训练**：`bash scripts/train_policy.sh idp3 your_robot exp_name`
4. **修改 `deploy.py`**：
   - 替换 `UpperBodyCommunication` / `HandCommunication` 为你机器人的通信接口
   - 修改 `joint25_to_joint32()` 或直接用你机器人的动作维度
   - 调整 `MultiRealSense` 参数（相机内参、num_points、z_far/z_near）
5. **运行部署**：`bash scripts/deploy_policy.sh idp3 your_robot exp_name`

**重要提示**：iDP3 的核心假设是 **ego-centric 点云**（相机固定在机器人头部/胸部，随机器人运动）。如果迁移到外置固定相机，需要重新考虑坐标系对齐问题。

---

## 依赖关系图

```
train.py
    │
    ├──→ iDP3Workspace / DPWorkspace（继承 BaseWorkspace）
    │       ├──→ DiffusionPointcloudPolicy / DiffusionImagePolicy（Policy）
    │       │       ├──→ iDP3Encoder / TimmObsEncoder（观测编码器）
    │       │       │       ├──→ MultiStagePointNetEncoder（4-stage 全局聚合）
    │       │       │       │       └──→ Conv1d + MaxPool + Concat × 4
    │       │       │       └──→ StateEncoder（2-layer MLP）
    │       │       ├──→ ConditionalUnet1D（1D U-Net + FiLM/CrossAttn）
    │       │       │       ├──→ ConditionalResidualBlock1D × (3 down + 2 mid + 3 up)
    │       │       │       ├──→ Downsample1d / Upsample1d
    │       │       │       └──→ SinusoidalPosEmb（时间步编码）
    │       │       └──→ DDIMScheduler（diffusers，50 steps → 10 inference）
    │       ├──→ GR1DexDataset3D / GR1DexDatasetImage（Dataset）
    │       │       └──→ ReplayBuffer + SequenceSampler（Zarr + 滑动窗口）
    │       ├──→ LinearNormalizer（仅 action Min-Max 归一化）
    │       ├──→ AdamW Optimizer + Cosine LR Scheduler
    │       ├──→ EMAModel（指数移动平均）
    │       ├──→ TopKCheckpointManager（保留最佳 checkpoint）
    │       ├──→ JsonLogger + WandB（双路日志）
    │       └──→ Hydra Config（idp3.yaml + task/*.yaml）
    │
    └──→ BaseWorkspace.save_checkpoint / load_checkpoint（dill 序列化）

deploy.py
    │
    ├──→ workspace.get_model() → DiffusionPointcloudPolicy.eval().cpu()
    ├──→ GR1DexEnvInference
    │       ├──→ MultiRealSense（多进程 RealSense L515）
    │       │       ├──→ SingleVisionProcess（子进程 + Queue）
    │       │       └──→ create_colored_point_cloud（RGB-D → N×6，grid sampling）
    │       ├──→ UpperBodyCommunication / HandCommunication（Zenoh）
    │       ├──→ ArmRetarget（IK 解算）
    │       └──→ gr1_action_util（25↔32 DoF 映射 + EEF 解析）
    └──→ Loop: obs → policy.forward() → joint25→joint32 → robot.step → next obs
```

---

## 引用

```bibtex
@article{ze2024humanoid_manipulation,
  title   = {Generalizable Humanoid Manipulation with 3D Diffusion Policies},
  author  = {Yanjie Ze and Zixuan Chen and Wenhao Wang and Tianyi Chen and Xialin He and Ying Yuan and Xue Bin Peng and Jiajun Wu},
  year    = {2024},
  journal = {arXiv preprint arXiv:2410.10803}
}
```

---

*文档版本：基于 [Improved-3D-Diffusion-Policy](https://github.com/YanjieZe/Improved-3D-Diffusion-Policy) 官方仓库主分支代码整理。*
