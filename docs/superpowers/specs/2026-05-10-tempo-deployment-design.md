# Tempo 后端与前端（Web）部署上线设计

**日期**：2026-05-10  
**范围**：`service/`（FastAPI 后端）与 `web/`（Vue 3 + Vite 前端）的国内云生产部署  
**目标**：建立一套基于阿里云 PaaS 的完整部署体系，包含域名、容器化、对象存储、CDN、Serverless 计算和 GitHub Actions 自动流水线。Tempo 是第一条入驻的产品线，未来新产品可直接复用该模板。

---

## 1. 架构总览

### 1.1 域名体系

采用**单根域名 + 产品子域名**模式，备案一次即可无限扩展。

| 层级 | 示例（Tempo） | 说明 |
|---|---|---|
| 根域名 | `99tempo.cn` | 品牌根，仅需一次 ICP 备案 |
| 前端子域名 | `tempo.99tempo.cn` | Tempo 的 H5 / WebView 页面 |
| 后端子域名 | `tempo-api.99tempo.cn` | Tempo 的 FastAPI 服务 |
| 未来扩展 | `other.99tempo.cn` + `other-api.99tempo.cn` | 新产品直接复制域名模式 |

**为什么不共用同域？**

初期曾考虑前后端共用 `tempo.99tempo.cn`，后端通过 `/api/` 路径区分。该方案在阿里云 PaaS 下需引入 CDN 多源站回源或云原生网关，配置复杂且缓存策略风险高。最终采用子域名分离，后端开启 CORS 即可，部署链路最标准、文档最丰富、故障排查最简单。

### 1.2 服务拓扑

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

- **前端**：OSS 作为源站，CDN 提供边缘加速、HTTPS 和自定义域名。
- **后端**：SAE（Serverless 应用引擎）直接运行 Docker 容器，按量计费，自动扩缩容。
- **镜像**：ACR（容器镜像服务）个人版托管后端镜像，GitHub Actions 构建后推送。

---

## 2. 云服务选型（阿里云）

| 组件 | 产品 | 用途 | 选型理由 |
|---|---|---|---|
| 域名与备案 | 阿里云域名 + ICP 备案 | `99tempo.cn` 注册与备案 | 平台内闭环，备案进度可追踪 |
| 前端静态托管 | OSS + CDN | 托管 Vue `dist/` | 国内静态站点标准方案，成本低 |
| 后端计算 | SAE | 运行 FastAPI 容器 | 零运维容器平台，支持自定义域名 |
| 镜像仓库 | ACR 个人版 | 存储 Docker 镜像 | 免费额度足够，与 SAE 内网互通 |
| CI/CD | GitHub Actions | 自动化构建与部署 | 与代码仓库原生集成，无需额外费用 |
| 证书 | 阿里云 SSL 证书（免费版） | HTTPS | CDN 和 SAE 均支持自动绑定 |

**不引入的组件**：
- 不引入云数据库（当前架构本地优先，后端仅为解析 API）。
- 不引入 API 网关（当前后端简单，无统一鉴权/限流刚需；未来产品矩阵扩大后可自然接入）。

---

## 3. 环境变量与配置管理

采用**四层分级策略**，确保敏感信息绝不进仓库，同时本地开发与线上行为一致。

### 3.1 分层定义

| 层级 | 存放位置 | 用途 | 示例 |
|---|---|---|---|
| 代码层（公开模板） | `web/.env.example`、`service/.env.example` | 告知开发者所需变量名 | `VITE_API_BASE_URL=` |
| 本地开发层 | `web/.env.dev`、`app/.env.dev` | 局域网调试 | 由 `pnpm sync:lan-env` 自动生成 |
| CI/CD 层（私密） | GitHub Secrets | 构建与部署凭证 | `ALIYUN_ACCESS_KEY_ID` |
| 线上运行时层 | SAE 环境变量 | 服务启动后读取 | `OPENAI_API_KEY` |

### 3.2 GitHub Secrets 清单

```
ALIYUN_ACCESS_KEY_ID        # RAM 子账号 AccessKey（最小权限）
ALIYUN_ACCESS_KEY_SECRET    # 对应 Secret
ACR_REGISTRY                # registry.cn-hangzhou.aliyuncs.com/jjstudio
SAE_APP_NAME                # tempo-service
SAE_NAMESPACE               # default
SAE_REGION                  # cn-hangzhou
OSS_BUCKET                  # jj-tempo-web
OSS_ENDPOINT                # oss-cn-hangzhou.aliyuncs.com
CDN_DOMAIN                  # tempo.99tempo.cn
```

### 3.3 SAE 运行时环境变量

```
ENV=production
OPENAI_API_KEY=sk-xxx
API_BASE_URL=https://tempo-api.99tempo.cn
```

**关键约束**：
- Vue 在**构建时**将 `VITE_API_BASE_URL` 编译进产物，因此前端 CI 流水线必须注入线上地址。
- FastAPI 在**运行时**读取环境变量，修改后重启容器即可，无需重新构建镜像。

---

## 4. CI/CD 流水线设计

### 4.1 触发策略

拆分为两条完全独立的流水线，避免无关变更触发全量部署。

| 流水线 | 监听路径 | 触发条件 |
|---|---|---|
| `deploy-web.yml` | `web/**`、`pnpm-lock.yaml` | `main` 分支且前端代码变更 |
| `deploy-service.yml` | `service/**`、`pyproject.toml`、`uv.lock` | `main` 分支且后端代码变更 |

### 4.2 前端流水线（deploy-web.yml）

```yaml
on:
  push:
    branches: [main]
    paths: ['web/**', 'pnpm-lock.yaml']

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with: { version: 10.10.0 }

      - name: Setup Node
        uses: actions/setup-node@v4
        with: { node-version: 24, cache: 'pnpm' }

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check and build
        run: pnpm --filter web build
        env:
          VITE_API_BASE_URL: https://tempo-api.99tempo.cn

      - name: Upload to OSS
        uses: manyuanrong/setup-ossutil@v3
        with:
          endpoint: ${{ secrets.OSS_ENDPOINT }}
          access-key-id: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          access-key-secret: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}
      - run: ossutil cp -rf web/dist/ oss://${{ secrets.OSS_BUCKET }}/

      - name: Refresh CDN cache
        run: |
          aliyun cdn RefreshObjectCaches \
            --ObjectPath https://${{ secrets.CDN_DOMAIN }}/ \
            --ObjectType Directory
```

**设计要点**：
- 构建前执行 `vue-tsc -b`，类型错误直接阻断部署。
- `ossutil cp -rf` 全量覆盖上传，确保旧文件被清理。
- CDN 刷新根目录（`Directory` 类型），保证用户立即加载新版本。

### 4.3 后端流水线（deploy-service.yml）

```yaml
on:
  push:
    branches: [main]
    paths: ['service/**', 'pyproject.toml', 'uv.lock']

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run backend tests
        working-directory: service
        run: |
          pip install uv
          uv sync --no-dev
          uv run pytest

      - name: Login to ACR
        uses: docker/login-action@v3
        with:
          registry: ${{ secrets.ACR_REGISTRY }}
          username: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          password: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}

      - name: Build and push image
        uses: docker/build-push-action@v6
        with:
          context: ./service
          push: true
          tags: |
            ${{ secrets.ACR_REGISTRY }}/tempo-service:${{ github.sha }}
            ${{ secrets.ACR_REGISTRY }}/tempo-service:latest

      - name: Deploy to SAE
        run: |
          aliyun sae UpdateApplication \
            --RegionId ${{ secrets.SAE_REGION }} \
            --NamespaceId ${{ secrets.SAE_NAMESPACE }} \
            --AppName ${{ secrets.SAE_APP_NAME }} \
            --ImageUrl ${{ secrets.ACR_REGISTRY }}/tempo-service:${{ github.sha }}
```

**设计要点**：
- 测试（`pytest`）在构建镜像前执行，失败即终止，避免问题代码上线。
- 镜像标签使用 `${{ github.sha }}`，实现**不可变部署**；同时打 `latest` 标签便于本地拉取。
- SAE 更新应用时指向具体 SHA 镜像，出问题可在控制台秒级回滚到上一个版本。

### 4.4 回滚策略

| 场景 | 操作 |
|---|---|
| 前端回滚 | 在 GitHub 上 revert 提交，合并到 `main`，流水线自动重新部署旧版本 |
| 后端回滚 | 阿里云 SAE 控制台 → 应用详情 → 修改镜像地址为上一个 SHA，30 秒内完成 |
| 紧急回滚 | 两条流水线独立，前端/后端可分别回滚，互不影响 |

---

## 5. 容器化（service/Dockerfile）

后端需要补充容器化配置，这是 SAE 部署的前提。

```dockerfile
FROM python:3.12-slim
WORKDIR /app

# 安装 uv
RUN pip install --no-cache-dir uv

# 复制依赖定义并安装
COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev --frozen

# 复制业务代码
COPY app/ ./app/

# 暴露端口
EXPOSE 8000

# 启动：使用 gunicorn + uvicorn worker
CMD ["uv", "run", "gunicorn", "app.main:app", \
     "-w", "4", "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000"]
```

**说明**：
- 使用 `uv sync --no-dev --frozen` 安装生产依赖，确保与 `uv.lock` 完全锁定一致。
- Gunicorn 作为进程管理器，Uvicorn worker 运行 ASGI，4 个 worker 适配 SAE 最小实例规格。
- 镜像体积控制在 200MB 以内（slim 基础镜像 + 不缓存 pip）。

---

## 6. 安全策略

### 6.1 访问控制

- **RAM 子账号**：CI/CD 使用的 `ALIYUN_ACCESS_KEY_ID` 必须是 RAM 子账号，权限策略最小化：
  - `AliyunSAEFullAccess`（或更细粒度的自定义策略）
  - `AliyunContainerRegistryFullAccess`
  - `AliyunOSSFullAccess`
  - `AliyunCDNFullAccess`
- **主账号 AccessKey 严禁泄露**：绝不配置在 GitHub Secrets 中。

### 6.2 网络安全

- **HTTPS 强制**：CDN 和 SAE 自定义域名均绑定 SSL 证书，拒绝 HTTP 明文访问。
- **CORS 配置**：FastAPI 添加 `CORSMiddleware`，只允许 `https://tempo.99tempo.cn` 跨域：
  ```python
  from fastapi.middleware.cors import CORSMiddleware
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["https://tempo.99tempo.cn"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
- **OSS Bucket 策略**：关闭公共读，仅允许 CDN 回源身份访问（通过 OSS 的 Bucket Policy 授权给 CDN 服务账号）。

### 6.3 密钥管理

- `OPENAI_API_KEY` 仅存在于 SAE 环境变量，不写入 `Dockerfile`、不进入 GitHub 日志。
- GitHub Actions 开启 `mask-secrets: true`（默认行为），确保 Secrets 在日志中自动脱敏。

---

## 7. 成本预估

以**首月低流量**（个人项目 / 内测阶段）为基准：

| 项目 | 产品 | 预估月费 |
|---|---|---|
| 域名注册 | `.cn` | ~35 元/年（折合 ~3 元/月） |
| ICP 备案 | 阿里云备案服务 | 0 元 |
| 对象存储 | OSS 标准存储（< 1GB） | ~5 元 |
| CDN 流量 | 下行流量（< 10GB） | ~5-15 元 |
| Serverless 计算 | SAE（0.5 vCPU / 1GB，按量） | ~50-100 元（无请求时接近 0） |
| 容器镜像 | ACR 个人版 | 免费 |
| SSL 证书 | 阿里云免费版（DV） | 免费 |
| **合计** | | **~65-125 元/月** |

> 流量增长后成本主要随 CDN 下行流量和 SAE 实例规格线性增长。如需精确控制预算，可为 SAE 设置最小实例数为 0（冷启动稍慢，但无流量时费用极低）。

---

## 8. 执行里程碑

**关键路径**：ICP 备案是硬等待，不可并行。备案期间可完成所有技术配置。

| 阶段 | 任务 | 预计耗时 | 依赖 |
|---|---|---|---|
| **Phase 1** | 注册 `99tempo.cn`，提交 ICP 备案 | 7-20 天 | 无 |
| **Phase 2** | 开通阿里云 OSS、ACR、SAE；创建 RAM 子账号 | 2 小时 | 阿里云账号 |
| **Phase 3** | 编写 `service/Dockerfile`，本地验证构建 | 1 小时 | 无 |
| **Phase 4** | 配置 GitHub Secrets；编写 `.github/workflows/deploy-*.yml` | 2-3 小时 | Phase 2 |
| **Phase 5** | 首次部署：用阿里云默认测试域名验证前后端 | 2-3 小时 | Phase 3-4 |
| **Phase 6** | 备案通过后，绑定自定义域名 + HTTPS 证书 | 1 小时 | Phase 1 |
| **Phase 7** | App 配置更新：替换 `EXPO_PUBLIC_API_BASE_URL` 和 `EXPO_PUBLIC_WEB_BASE_URL` 为生产地址 | 30 分钟 | Phase 6 |

**备案等待期的建议**：
Phase 1 提交备案后，不要空等。利用阿里云提供的默认域名（如 SAE 的测试域名、OSS 的 Bucket 内网域名）把 Phase 2-5 全部跑通。等备案通过，Phase 6 只需在控制台把自定义域名切上去，零风险。

---

## 9. 未来扩展预留

本设计为新产品预留了以下扩展点，Tempo 实施时一次性搭好，后续零改造成本：

- **域名模板**：`{product}.99tempo.cn` + `{product}-api.99tempo.cn`。
- **CI/CD 模板**：新增产品时，复制 `deploy-web.yml` 和 `deploy-service.yml`，修改 `VITE_API_BASE_URL`、镜像名、SAE 应用名即可。
- **统一 API 入口**：当产品数量 > 3 或需要统一鉴权时，可在 `api.99tempo.cn` 引入阿里云 MSE 云原生网关，将现有 `tempo-api.99tempo.cn` 作为上游服务接入，对 Tempo 本身无影响。
- **数据库接入**：未来后端需要持久化时，可在 SAE 同一 VPC 内开通阿里云 RDS 或 PolarDB，仅修改 SAE 环境变量中的 `DATABASE_URL` 即可。

---

## 附录：相关文件变更清单

实施本设计需要新增/修改的文件：

```
service/
  Dockerfile              ← 新增：后端容器化

.github/
  workflows/
    deploy-web.yml        ← 新增：前端自动部署
    deploy-service.yml    ← 新增：后端自动部署

web/.env.example          ← 新增：前端环境变量模板
service/.env.example      ← 新增：后端环境变量模板
```

> 注：本设计不涉及 `app/`（Expo 客户端）的构建与分发。App 上线（TestFlight / App Store）需要额外的 EAS Build 配置，不在本文档范围内。
