# Tempo 后端与前端部署上线实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Tempo 项目建立完整的阿里云 PaaS 部署体系，包含后端容器化、前端静态托管、GitHub Actions 自动流水线和 CORS 安全配置。

**Architecture:** 后端使用 Dockerfile 容器化，通过 GitHub Actions 构建镜像推送到阿里云 ACR，部署到 SAE；前端 Vue 构建产物上传到 OSS，通过 CDN 加速；FastAPI 添加生产环境 CORS 配置。

**Tech Stack:** Docker、阿里云 OSS/CDN/ACR/SAE、GitHub Actions、FastAPI CORSMiddleware

---

## 文件结构

```
service/
  Dockerfile                 ← 新增：后端容器化配置
  .env.example               ← 新增：环境变量模板
  app/core/
    middleware.py            ← 修改：生产环境 CORS 配置

web/
  .env.example               ← 新增：前端环境变量模板

.github/
  workflows/
    deploy-service.yml       ← 新增：后端自动部署流水线
    deploy-web.yml           ← 新增：前端自动部署流水线
```

---

## Task 1: 后端容器化（Dockerfile）

**Files:**
- Create: `service/Dockerfile`
- Create: `service/.dockerignore`

- [ ] **Step 1: 创建 .dockerignore 文件**

```bash
cat > service/.dockerignore << 'EOF'
__pycache__/
*.py[cod]
*$py.class
.venv/
.env
.env.*
.pytest_cache/
.pytest_cache
*.egg-info/
.eggs/
dist/
build/
EOF
```

- [ ] **Step 2: 创建 Dockerfile**

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

- [ ] **Step 3: 本地验证 Docker 镜像构建**

```bash
cd service && docker build -t tempo-service:test .
```

Expected: 构建成功，无错误输出

- [ ] **Step 4: 本地验证容器运行**

```bash
docker run --rm -p 8000:8000 --env-file .env tempo-service:test
```

Expected: 容器启动，访问 `http://localhost:8000/docs` 能看到 FastAPI Swagger 文档

- [ ] **Step 5: 提交 Dockerfile**

```bash
git add service/Dockerfile service/.dockerignore
git commit -m "feat(service): add Dockerfile for containerization

- Python 3.12-slim base image
- uv for dependency management
- gunicorn + uvicorn worker for production

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: 后端 CORS 生产环境配置

**Files:**
- Modify: `service/app/core/middleware.py`

- [ ] **Step 1: 修改 CORS 中间件，支持环境变量配置**

修改 `service/app/core/middleware.py`，将 `allow_origins` 从硬编码 `"*"` 改为从环境变量读取：

```python
import os
import uuid

from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware


async def trace_middleware(request: Request, call_next) -> None:
    trace_id = request.headers.get("x-trace-id") or str(uuid.uuid4())
    request.state.trace_id = trace_id
    response = await call_next(request)
    response.headers["x-trace-id"] = trace_id
    return response


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

- [ ] **Step 2: 验证修改**

```bash
cd service && uv run python -c "from app.core.middleware import add_cors_middleware; print('OK')"
```

Expected: 输出 `OK`

- [ ] **Step 3: 提交 CORS 配置修改**

```bash
git add service/app/core/middleware.py
git commit -m "feat(service): make CORS origins configurable via env

Production can set CORS_ORIGINS=https://tempo.99tempo.cn
Defaults to '*' for local development.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: 环境变量模板文件

**Files:**
- Create: `service/.env.example`
- Create: `web/.env.example`

- [ ] **Step 1: 创建后端环境变量模板**

```bash
cat > service/.env.example << 'EOF'
# Tempo Service 环境变量模板
# 复制为 .env 并填入实际值

# CORS 允许的前端源（生产环境必填，多个用逗号分隔）
CORS_ORIGINS=https://tempo.99tempo.cn

# OpenAI API Key（调用大模型时需要）
OPENAI_API_KEY=sk-xxx

# 运行环境标识
ENV=development
EOF
```

- [ ] **Step 2: 创建前端环境变量模板**

```bash
cat > web/.env.example << 'EOF'
# Tempo Web 前端环境变量模板
# 复制为 .env.dev（开发）或 .env.production（生产）并填入实际值

# 后端 API 地址
VITE_API_BASE_URL=http://localhost:8000
EOF
```

- [ ] **Step 3: 提交环境变量模板**

```bash
git add service/.env.example web/.env.example
git commit -m "docs: add .env.example templates for service and web

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: GitHub Actions 后端部署流水线

**Files:**
- Create: `.github/workflows/deploy-service.yml`

- [ ] **Step 1: 创建 workflows 目录**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: 创建后端部署流水线文件**

```yaml
name: Deploy Service

on:
  push:
    branches: [master]
    paths:
      - 'service/**'
      - 'pyproject.toml'
      - 'uv.lock'

env:
  ACR_REGISTRY: ${{ secrets.ACR_REGISTRY }}

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
          username: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          password: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v6
        with:
          context: ./service
          push: true
          tags: |
            ${{ secrets.ACR_REGISTRY }}/tempo-service:${{ github.sha }}
            ${{ secrets.ACR_REGISTRY }}/tempo-service:latest

      - name: Install Alibaba Cloud CLI
        uses: aliyun/setup-aliyun-action@v1

      - name: Deploy to SAE
        run: |
          aliyun sae DeployApplication \
            --RegionId ${{ secrets.SAE_REGION }} \
            --AppName ${{ secrets.SAE_APP_NAME }} \
            --ImageUrl ${{ secrets.ACR_REGISTRY }}/tempo-service:${{ github.sha }}
        env:
          ALICLOUD_ACCESS_KEY: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          ALICLOUD_SECRET_KEY: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}
```

- [ ] **Step 3: 提交后端部署流水线**

```bash
git add .github/workflows/deploy-service.yml
git commit -m "ci: add GitHub Actions workflow for service deployment

- Run pytest before building
- Build and push Docker image to ACR
- Deploy to Alibaba Cloud SAE

Required secrets: ACR_REGISTRY, ALIYUN_ACCESS_KEY_ID,
ALIYUN_ACCESS_KEY_SECRET, SAE_REGION, SAE_APP_NAME

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: GitHub Actions 前端部署流水线

**Files:**
- Create: `.github/workflows/deploy-web.yml`

- [ ] **Step 1: 创建前端部署流水线文件**

```yaml
name: Deploy Web

on:
  push:
    branches: [master]
    paths:
      - 'web/**'
      - 'pnpm-lock.yaml'

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
        uses: manyuanrong/setup-ossutil@v3
        with:
          endpoint: ${{ secrets.OSS_ENDPOINT }}
          access-key-id: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          access-key-secret: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}

      - name: Upload to OSS
        run: ossutil cp -rf web/dist/ oss://${{ secrets.OSS_BUCKET }}/ --update

      - name: Install Alibaba Cloud CLI
        uses: aliyun/setup-aliyun-action@v1

      - name: Refresh CDN cache
        run: |
          aliyun cdn RefreshObjectCaches \
            --ObjectPath https://${{ secrets.CDN_DOMAIN }}/ \
            --ObjectType Directory
        env:
          ALICLOUD_ACCESS_KEY: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          ALICLOUD_SECRET_KEY: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}
```

- [ ] **Step 2: 提交前端部署流水线**

```bash
git add .github/workflows/deploy-web.yml
git commit -m "ci: add GitHub Actions workflow for web deployment

- Build Vue app with production API URL
- Upload dist/ to Alibaba Cloud OSS
- Refresh CDN cache

Required secrets: OSS_ENDPOINT, OSS_BUCKET, CDN_DOMAIN,
ALIYUN_ACCESS_KEY_ID, ALIYUN_ACCESS_KEY_SECRET

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: 更新 .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: 确认 .gitignore 包含环境变量文件**

检查 `.gitignore` 是否已包含 `.env` 相关规则，如未包含则添加：

```bash
# 检查是否已存在
grep -q "\.env" .gitignore || echo -e "\n# Environment variables\n.env\n.env.*\n!.env.example" >> .gitignore
```

- [ ] **Step 2: 提交 .gitignore 更新（如有变更）**

```bash
git add .gitignore
git diff --cached --quiet || git commit -m "chore: ensure .env files are ignored

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: 推送所有变更到远程仓库

- [ ] **Step 1: 查看待推送的提交**

```bash
git log origin/master..HEAD --oneline
```

- [ ] **Step 2: 推送到远程仓库**

```bash
git push origin master
```

Expected: 所有提交成功推送

---

## 执行后检查清单

完成上述任务后，需要在阿里云控制台完成以下配置（不在本代码仓库范围内）：

- [ ] 注册域名 `99tempo.cn` 并完成 ICP 备案
- [ ] 创建阿里云 RAM 子账号，配置最小权限策略
- [ ] 开通 OSS，创建 Bucket `jj-tempo-web`
- [ ] 开通 ACR 个人版，创建命名空间和镜像仓库
- [ ] 开通 SAE，创建应用 `tempo-service`
- [ ] 配置 GitHub Secrets（见设计文档 3.2 节）
- [ ] 在 SAE 配置运行时环境变量（见设计文档 3.3 节）
- [ ] 绑定自定义域名到 CDN 和 SAE
- [ ] 申请并配置 SSL 证书

---

## 回滚策略

| 场景 | 操作 |
|---|---|
| 前端回滚 | 在 GitHub 上 revert 提交，合并到 master，流水线自动重新部署 |
| 后端回滚 | 阿里云 SAE 控制台 → 应用详情 → 修改镜像地址为上一个 SHA |
| 流水线失败 | 查看 GitHub Actions 日志，修复后重新推送 |
