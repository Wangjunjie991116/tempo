from ddgs import DDGS


def search_web(query: str, num_results: int = 3) -> str:
    """Search the web using DuckDuckGo and return formatted results.

    @example
    ```python
    search_web("G796 高铁时刻表", num_results=3)
    # => "1. G796次列车时刻表 - 发车时间14:30...\n   2. ..."
    ```
    """
    num_results = min(max(num_results, 1), 5)
    try:
        with DDGS() as ddgs:
            results = ddgs.text(query, max_results=num_results)
    except Exception as e:
        return f"搜索失败：{e}"

    if not results:
        return "未找到相关结果。"

    lines = []
    for i, r in enumerate(results, 1):
        title = r.get("title", "")
        body = r.get("body", "")
        # Truncate body to avoid overwhelming the LLM with long snippets
        if len(body) > 200:
            body = body[:200] + "..."
        lines.append(f"{i}. {title} — {body}")
    return "\n".join(lines)
