import os
from typing import Optional


class Settings:
    app_name: str = "Tempo Service"
    openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://gpt-agent.cc/v1")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "deepseek-v4-pro")

    cors_allow_origins: list[str] = ["*"]

    auth_whitelist: dict[str, str] = {
        "2638241171@qq.com": "Wjj13055578801---",
    }


settings = Settings()
