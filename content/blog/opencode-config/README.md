---
title: OpenCode 配置教程
weight: 1
---

## Installation

### Windows

如果你没有使用过 WSL，按照以下命令初始化：

```bash
wsl --install -d Ubuntu-22.04
```

完成后，通过以下命令启动 WSL：

```bash
wsl
```

随后按照 Ubuntu 的安装向导进行安装

### Ubuntu

通过以下命令安装 bun：

```bash
curl -fsSL https://bun.sh/install | bash
ln -sf ~/.bun/bin/bun ~/.bun/bin/node
ln -sf ~/.bun/bin/bun ~/.bun/bin/npm
ln -sf ~/.bun/bin/bunx ~/.bun/bin/npx
printf '[install]\nregistry = "https://registry.npmmirror.com/"\n' > ~/.bunfig.toml
```

通过命令行安装 [OpenCode](https://opencode.ai/zh)：

```bash
npm install -g @opencode/cli
```

## Configuration

告诉 Sisyphus (如果有的话)：

> 将仓库 https://github.com/Instinct323/EnvConfig.git 克隆到临时目录，按照其中的 opencode/config-guide.md 配置环境

退出 `opencode`，通过以下命令进行身份验证：

```
opencode auth login
```

![](assets/auth_login.png)

# WeChat

连接到微信需要进行以下配置：

```bash
npm install -g cli-wechat-bridge@latest
wechat-setup
```

在工作目录下运行命令启动：

```bash
wechat-opencode
```