import logging
from urllib.parse import urlparse

import httpx
from ddgs import DDGS

logger = logging.getLogger(__name__)

# 明显低质的域名：问答社区、文库、论坛等 SEO 垃圾场
# 只保留 snippet，不浪费时间去抓取正文
_LOW_QUALITY_DOMAINS = {
    # 百度系
    "zhidao.baidu.com",
    "tieba.baidu.com",
    "wenku.baidu.com",
    "jingyan.baidu.com",
    "baijiahao.baidu.com",
    # 问答/论坛
    "zhihu.com",
    "wenda.so.com",
    "wukong.com",
    "zhidao.so.com",
    # 搜索引擎自身结果页
    "sogou.com",
    "so.com",
    "bing.com",
    "yahoo.com",
    # 低质文库
    "doc88.com",
    "docin.com",
    "book118.com",
}

# 高优先级域名：按场景分组，信息结构化、可信度高
_HIGH_PRIORITY_DOMAINS = {
    # ── 航班 ──
    "csair.com",           # 南航
    "ceair.com",           # 东航
    "airchina.com.cn",     # 国航
    "chinaeastern.com",    # 东航国际
    "hainanairlines.com",  # 海航
    "ch.com",              # 春秋航空
    "xiamenair.com",       # 厦航
    "shandongair.com",     # 山航
    "shenzhenair.com",     # 深航
    "carnoc.com",          # 民航资源网
    # ── 航班查询/OTA ──
    "flights.ctrip.com",
    "flight.qunar.com",
    "travel.qunar.com",
    "booking.com",
    "expedia.com",
    "trip.com",
    "agoda.com",
    "variflight.com",      # 飞常准
    "veryzhun.com",        # 飞常准旧域名
    "umetrip.com",         # 航旅纵横
    # ── 高铁/火车 ──
    "12306.cn",
    "gaotie.cn",           # 高铁管家
    "izhixing.cn",         # 智行
    "trains.ctrip.com",
    "train.qunar.com",
    # ── 酒店 ──
    "hotels.ctrip.com",
    "hotel.qunar.com",
    "hotel.meituan.com",
    "hotel.fliggy.com",
    "fliggy.com",
    "huazhu.com",          # 华住会
    "homeinns.com",        # 如家
    "jinjiang.com",        # 锦江
    "airbnb.com",
    "airbnb.cn",
    # ── 餐厅/美食 ──
    "dianping.com",
    "meituan.com",
    # ── 景点/旅游攻略 ──
    "you.ctrip.com",       # 携程攻略
    "mafengwo.cn",
    "travel.qunar.com",
    "lvyou.baidu.com",
    # ── 天气 ──
    "weather.com.cn",      # 中国天气网
    "tianqi.com",
    "qweather.com",        # 和风天气
    "accuweather.com",
    # ── 地图/导航 ──
    "amap.com",            # 高德
    "map.baidu.com",
    "maps.apple.com",
    # ── 演出/电影/活动 ──
    "damai.cn",
    "maoyan.com",
    "taopiaopiao.com",
    "gewara.com",
    "showstart.com",       # 秀动
    "yongle.cn",           # 永乐票务
    # ── 快递/物流（日程中可能有取件/派件） ──
    "sf-express.com",
    "jd.com",              # 京东物流
    "zto.com",
    "yto.net.cn",
    # ── 医疗预约 ──
    "guahao.com",
    "91160.com",
    # ── 通用可信百科 ──
    "wikipedia.org",
}


_JINA_TIMEOUT = 12.0
_MAX_EXTRACT_LEN = 1200
_MAX_SNIPPET_LEN = 200


def _is_low_quality(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    # 去掉 www. 前缀做匹配
    if host.startswith("www."):
        host = host[4:]
    return any(d in host for d in _LOW_QUALITY_DOMAINS)


def _is_high_priority(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    return any(d in host for d in _HIGH_PRIORITY_DOMAINS)


def _fetch_jina(url: str) -> str | None:
    """Use Jina AI Reader to fetch clean markdown of a page."""
    try:
        with httpx.Client(timeout=_JINA_TIMEOUT, follow_redirects=True) as client:
            r = client.get(f"https://r.jina.ai/http://{url}")
            if r.status_code != 200:
                return None
            text = r.text.strip()
            # Jina 返回格式：Title: ...\nURL Source: ...\nMarkdown Content: ...
            # 去掉头部元信息，只保留正文
            if "Markdown Content:\n" in text:
                text = text.split("Markdown Content:\n", 1)[1]
            elif "\n\n" in text:
                #  fallback：去掉前两行（Title + URL Source）
                lines = text.splitlines()
                if len(lines) > 2 and lines[0].startswith("Title:"):
                    text = "\n".join(lines[2:])
            if len(text) > _MAX_EXTRACT_LEN:
                text = text[:_MAX_EXTRACT_LEN] + "..."
            return text.strip()
    except Exception as e:
        logger.debug("jina_fetch_failed url=%s error=%s", url, e)
        return None


def search_web(query: str, num_results: int = 3) -> str:
    """Search the web and return rich results with both snippets and page content.

    Uses DuckDuckGo for discovery, then fetches actual page content via Jina AI Reader
    for the top results to give the LLM real information instead of SEO snippets.

    @example
    ```python
    search_web("G796 高铁时刻表", num_results=3)
    # => "1. [URL] 标题...\n   摘要: ...\n   正文: ...\n2. ..."
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

    # 按域名质量重新排序：高优先级放前面，低质量放后面
    def _sort_key(r: dict) -> int:
        href = r.get("href", "")
        if _is_high_priority(href):
            return -2
        if _is_low_quality(href):
            return 2
        return 0

    results = sorted(results, key=_sort_key)

    lines: list[str] = []
    fetched = 0
    max_fetch = 2  # 最多抓 2 个页面的正文，控制延迟

    for i, r in enumerate(results, 1):
        title = r.get("title", "")
        body = r.get("body", "")
        href = r.get("href", "")

        if len(body) > _MAX_SNIPPET_LEN:
            body = body[:_MAX_SNIPPET_LEN] + "..."

        lines.append(f"{i}. [{href}] {title}")
        lines.append(f"   摘要: {body}")

        # 尝试抓取页面正文
        if href and fetched < max_fetch and not _is_low_quality(href):
            # 高优先级域名优先抓；其余只抓第一个
            should_fetch = _is_high_priority(href) or fetched == 0
            if should_fetch:
                content = _fetch_jina(href)
                if content:
                    lines.append(f"   正文:\n{content}")
                    fetched += 1

    return "\n".join(lines)
