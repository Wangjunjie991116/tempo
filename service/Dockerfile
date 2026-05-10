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
