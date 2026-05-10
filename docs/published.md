# 从 0 到 1：前后端服务上线生产环境实践指南

> 本文档记录 Tempo 项目后端（FastAPI）与前端（Vue 3 + Vite）从零开始上线到阿里云生产环境的完整过程，包含方案设计和实施过程中遇到的实际问题与解决方案。

---

## 一、上线方案概览

### 1.1 技术架构

```
用户 / App WebView
    │
    ├─▶ CDN (tempo.99tempo.cn) ──▶ OSS Bucket (Vue 静态资源)
    │
    └─▶ SAE (tempo-api.99tempo.cn) ──▶ FastAPI 容器
                │
                ▼
        ┌───────────────┐
        │ OpenAI / DDG  │
        │  外部 API     │
        └───────────────┘
```

### 1.2 云服务选型（阿里云）

| 组件 | 产品 | 用途 |
|---|---|---|
| 域名与备案 | 阿里云域名 + ICP 备案 | 品牌域名注册与备案 |
| 前端静态托管 | OSS + CDN | 托管 Vue 构建产物 |
| 后端计算 | SAE（Serverless 应用引擎） | 运行 FastAPI 容器 |
| 镜像仓库 | ACR 个人版 | 存储 Docker 镜像 |
| CI/CD | GitHub Actions | 自动化构建与部署 |

### 1.3 域名规划

| 域名 | 用途 |
|---|---|
| `99tempo.cn` | 根域名（需 ICP 备案） |
| `tempo.99tempo.cn` | 前端 H5 / WebView 页面 |
| `tempo-api.99tempo.cn` | 后端 API 服务 |

---

## 二、实施步骤

### 2.1 代码仓库准备

#### 2.1.1 后端容器化

创建 `service/Dockerfile`：

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# 安装 uv 包管理器
RUN pip install --no-cache-dir uv

# 复制依赖定义文件
COPY pyproject.toml uv.lock ./

# 安装生产依赖（锁定版本，不包含 dev 依赖）
RUN uv sync --no-dev --frozen

# 复制业务代码
COPY app/ ./app/

# 暴露端口
EXPOSE 8000

# 启动命令：gunicorn + uvicorn worker
CMD ["uv", "run", "gunicorn", "app.main:app", \
     "-w", "4", "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000"]
```

**关键点**：
- 使用 `uv sync --no-dev --frozen` 确保生产依赖锁定
- Gunicorn + Uvicorn worker 适合生产环境并发
- 需要在 `pyproject.toml` 中添加 `gunicorn` 依赖

#### 2.1.2 CORS 生产环境配置

修改 `service/app/core/middleware.py`，支持环境变量配置：

```python
import os

def add_cors_middleware(app) -> None:
    """添加 CORS 中间件。

    生产环境通过 CORS_ORIGINS 环境变量配置允许的源，
    多个源用逗号分隔。未配置时默认允许所有源（仅限开发环境）。
    """
    cors_origins_env = os.getenv("CORS_ORIGINS", "")
    if cors_origins_env:
        allow_origins = [origin.strip() for origin in cors_origins_env.split(",")]
    else:
        allow_origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
```

#### 2.1.3 GitHub Actions 工作流

**后端部署** (`.github/workflows/deploy-service.yml`)：

```yaml
name: Deploy Service

on:
  push:
    branches: [master]
    paths:
      - 'service/**'
      - 'pyproject.toml'
      - 'uv.lock'
  workflow_dispatch:

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v5
        with:
          version: "latest"

      - name: Run backend tests
        working-directory: service
        run: |
          uv sync
          uv run pytest -v

      - name: Login to Alibaba Cloud ACR
        uses: docker/login-action@v3
        with:
          registry: ${{ secrets.ACR_REGISTRY }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v6
        with:
          context: ./service
          push: true
          tags: |
            ${{ secrets.ACR_REGISTRY }}/tempo-service:${{ github.sha }}
            ${{ secrets.ACR_REGISTRY }}/tempo-service:latest

      - name: Install Alibaba Cloud CLI
        run: |
          wget -q https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz
          tar -xzf aliyun-cli-linux-latest-amd64.tgz
          sudo mv aliyun /usr/local/bin/

      - name: Deploy to SAE
        run: |
          aliyun configure set \
            --profile default \
            --mode AK \
            --region ${{ secrets.SAE_REGION }} \
            --access-key-id ${{ secrets.ALIYUN_ACCESS_KEY_ID }} \
            --access-key-secret ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}
          aliyun sae DeployApplication \
            --AppId ${{ secrets.SAE_APP_ID }} \
            --ImageUrl ${{ secrets.ACR_REGISTRY }}/tempo-service:${{ github.sha }}
```

**前端部署** (`.github/workflows/deploy-web.yml`)：

```yaml
name: Deploy Web

on:
  push:
    branches: [master]
    paths:
      - 'web/**'
      - 'pnpm-lock.yaml'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.10.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build web
        run: pnpm --filter web build
        env:
          VITE_API_BASE_URL: https://tempo-api.99tempo.cn

      - name: Setup ossutil
        uses: manyuanrong/setup-ossutil@v3.0
        with:
          endpoint: ${{ secrets.OSS_ENDPOINT }}
          access-key-id: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          access-key-secret: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}

      - name: Upload to OSS
        run: ossutil cp -rf web/dist/ oss://${{ secrets.OSS_BUCKET }}/ --update

      - name: Install Alibaba Cloud CLI
        run: |
          wget -q https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz
          tar -xzf aliyun-cli-linux-latest-amd64.tgz
          sudo mv aliyun /usr/local/bin/

      - name: Refresh CDN cache
        if: ${{ vars.CDN_DOMAIN != '' }}
        continue-on-error: true
        run: |
          aliyun configure set \
            --profile default \
            --mode AK \
            --region cn-hangzhou \
            --access-key-id ${{ secrets.ALIYUN_ACCESS_KEY_ID }} \
            --access-key-secret ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}
          aliyun cdn RefreshObjectCaches \
            --ObjectPath https://${{ vars.CDN_DOMAIN }}/ \
            --ObjectType Directory
```

---

### 2.2 阿里云资源创建

#### 2.2.1 RAM 子账号

1. 进入 **访问控制 RAM** 控制台
2. 创建用户，勾选 **OpenAPI 调用访问**
3. 记录 AccessKey ID 和 Secret（关闭后无法再查看）
4. 授权策略：
   - `AliyunOSSFullAccess`
   - `AliyunContainerRegistryFullAccess`
   - `AliyunSAEFullAccess`
   - `AliyunCDNFullAccess`（备案后需要）

#### 2.2.2 OSS Bucket

1. 创建 Bucket，**读写权限设为私有**
2. **阻止公共访问**：开启（防止数据泄露）
3. 后续通过 CDN 回源授权访问

#### 2.2.3 ACR 镜像仓库

1. 开通 **个人版**（免费）
2. 设置 **Registry 登录密码**（和 AccessKey 不同）
3. 创建命名空间（如 `jjstudio`）
4. 创建镜像仓库（如 `tempo-service`）

#### 2.2.4 SAE 应用

1. 创建应用，选择 **镜像部署**
2. 网络配置：选择 **自动创建 VPC 和交换机**
3. 规格：0.5 vCPU / 1 GB 内存（最小规格）
4. 开启 **公网访问**
5. 记录 **应用 ID**（`app-xxxx-xxxx-xxxx-xxxx`）

---

### 2.3 GitHub Secrets 配置

| Secret | 值 | 说明 |
|---|---|---|
| `ALIYUN_ACCESS_KEY_ID` | RAM 子账号 AccessKey ID | 用于 SAE 部署和 CDN 刷新 |
| `ALIYUN_ACCESS_KEY_SECRET` | RAM 子账号 AccessKey Secret | 同上 |
| `ACR_REGISTRY` | `registry.cn-beijing.aliyuncs.com/jjstudio` | ACR 镜像仓库地址（不含镜像名） |
| `ACR_USERNAME` | ACR 控制台显示的用户名 | **不是** AccessKey ID |
| `ACR_PASSWORD` | ACR Registry 登录密码 | **不是** AccessKey Secret |
| `SAE_REGION` | `cn-beijing` | SAE 应用所在地域 |
| `SAE_APP_ID` | `app-xxxx-xxxx-xxxx-xxxx` | SAE 应用 ID |
| `OSS_ENDPOINT` | `oss-cn-beijing.aliyuncs.com` | OSS 访问域名 |
| `OSS_BUCKET` | `jj-tempo-web` | OSS Bucket 名称 |

**Variables（非敏感配置）**：

| Variable | 值 | 说明 |
|---|---|---|
| `CDN_DOMAIN` | 备案后填 `tempo.99tempo.cn` | CDN 域名，备案前不添加 |

---

## 三、实施过程中的问题与解决方案

### 3.1 GitHub Actions Action 不存在

**问题**：
```
Unable to resolve action aliyun/setup-aliyun-action, repository not found
Unable to resolve action manyuanrong/setup-ossutil@v3, unable to find version v3
```

**原因**：
- `aliyun/setup-aliyun-action` 这个 Action 在 GitHub 上不存在
- `setup-ossutil` 的版本号是 `v3.0`，不是 `v3`

**解决方案**：
- 阿里云 CLI 改为直接用 wget 下载安装
- `setup-ossutil` 版本改为 `v3.0`

```yaml
- name: Install Alibaba Cloud CLI
  run: |
    wget -q https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz
    tar -xzf aliyun-cli-linux-latest-amd64.tgz
    sudo mv aliyun /usr/local/bin/
```

---

### 3.2 流水线不触发

**问题**：推送代码后 GitHub Actions 没有触发

**原因**：工作流配置了 `paths` 过滤器，只监听特定路径变更

**解决方案**：添加 `workflow_dispatch` 触发器，支持手动触发

```yaml
on:
  push:
    branches: [master]
    paths:
      - 'service/**'
  workflow_dispatch:  # 添加此行
```

---

### 3.3 CDN 刷新失败

**问题**：
```
ErrorCode: InvalidObjectPath.Malformed
Message: The specified ObjectPath is invalid.
```

**原因**：域名未备案，`CDN_DOMAIN` 未配置或格式错误

**解决方案**：
1. 使用 `vars` 而非 `secrets` 在 `if` 条件中判断
2. 添加 `continue-on-error: true` 让 CDN 刷新失败不影响整体流程

```yaml
- name: Refresh CDN cache
  if: ${{ vars.CDN_DOMAIN != '' }}
  continue-on-error: true
  run: |
    # CDN 刷新命令
```

**注意**：GitHub Actions 的 `if` 条件中**不能直接访问 `secrets`**，只能访问 `vars`。

---

### 3.4 ACR 镜像推送认证失败

**问题**：
```
Error response from daemon: Get "https://***/v2/": unauthorized: authentication required
denied: requested access to the resource is denied
```

**原因**：
1. ACR 个人版使用专用的 Registry 登录凭证，**不是** RAM AccessKey
2. `ACR_REGISTRY` 地址格式错误

**解决方案**：

1. 在 ACR 控制台 → **访问凭证** 获取：
   - 用户名（格式类似 `@账号ID`）
   - Registry 登录密码

2. 正确的镜像地址格式：
   ```
   registry.cn-beijing.aliyuncs.com/jjstudio
   ```
   （不含 `https://`，不含镜像名）

3. GitHub Secrets 配置：
   - `ACR_USERNAME`：ACR 专用用户名
   - `ACR_PASSWORD`：ACR Registry 登录密码

---

### 3.5 SAE 部署参数错误

**问题**：
```
ERROR: '--AppName' is not a valid parameter or flag.
```

**原因**：SAE CLI 的 `DeployApplication` 命令参数名是 `AppId`，不是 `AppName`

**解决方案**：

```yaml
- name: Deploy to SAE
  run: |
    aliyun sae DeployApplication \
      --AppId ${{ secrets.SAE_APP_ID }} \
      --ImageUrl ${{ secrets.ACR_REGISTRY }}/tempo-service:${{ github.sha }}
```

**获取应用 ID**：SAE 控制台 → 应用详情 → 应用 ID（格式 `app-xxxx-xxxx-xxxx-xxxx`）

---

## 四、备案前可完成的工作

域名 ICP 备案需要 7-20 天，期间可以并行完成：

| 工作 | 说明 |
|---|---|
| ✅ 代码仓库准备 | Dockerfile、GitHub Actions 工作流 |
| ✅ RAM 子账号创建 | 配置最小权限 |
| ✅ OSS Bucket 创建 | 私有读写，阻止公共访问 |
| ✅ ACR 镜像仓库创建 | 个人版免费 |
| ✅ SAE 应用创建 | 用默认测试镜像先创建 |
| ✅ GitHub Secrets 配置 | 所有凭证配置完成 |
| ✅ 流水线验证 | 手动触发验证流程跑通 |
| ⏳ 域名备案 | 等待管局审核 |
| ⏳ CDN 配置 | 备案通过后配置 |
| ⏳ 自定义域名绑定 | 备案通过后配置 |
| ⏳ HTTPS 证书配置 | 备案通过后申请 |

---

## 五、成本预估

以首月低流量为基准：

| 项目 | 产品 | 预估月费 |
|---|---|---|
| 域名注册 | `.cn` | ~35 元/年 |
| 对象存储 | OSS（< 1GB） | ~5 元 |
| CDN 流量 | 下行流量（< 10GB） | ~5-15 元 |
| Serverless 计算 | SAE（0.5 vCPU / 1GB） | ~50-100 元 |
| 容器镜像 | ACR 个人版 | 免费 |
| SSL 证书 | 阿里云免费版 | 免费 |
| **合计** | | **~65-125 元/月** |

---

## 六、关键经验总结

### 6.1 GitHub Actions 最佳实践

| 实践 | 说明 |
|---|---|
| 使用 `workflow_dispatch` | 支持手动触发，方便调试 |
| `paths` 过滤器 | 只监听相关路径变更，避免无关触发 |
| `secrets` vs `vars` | 敏感信息用 `secrets`，非敏感配置用 `vars`（可在 `if` 条件中使用） |
| `continue-on-error` | 非关键步骤失败不影响整体流程 |

### 6.2 阿里云资源创建顺序

```
RAM 子账号 → OSS Bucket → ACR 仓库 → SAE 应用 → 域名备案 → CDN 配置
```

### 6.3 常见错误排查清单

| 错误类型 | 排查方向 |
|---|---|
| Action not found | 检查 Action 名称和版本是否存在 |
| unauthorized | 检查用户名密码是否正确，权限是否足够 |
| InvalidObjectPath | 检查域名格式，是否已备案 |
| parameter not valid | 检查 CLI 命令参数名是否正确 |

---

## 七、参考资料

- [阿里云 SAE 文档](https://help.aliyun.com/product/133277.html)
- [阿里云 ACR 个人版文档](https://help.aliyun.com/document_detail/60716.html)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker login-action](https://github.com/docker/login-action)
- [Docker build-push-action](https://github.com/docker/build-push-action)

---

*文档生成日期：2026-05-10*
