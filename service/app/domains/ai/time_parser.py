import re
from datetime import datetime, timedelta

import dateparser


def _parse_chinese_time(expression: str, base: datetime) -> datetime | None:
    """Handle common Chinese time expressions deterministically."""
    expr = expression.strip()

    # Relative day keywords
    day_map = {
        "今天": 0,
        "明天": 1,
        "后天": 2,
        "大后天": 3,
    }

    # Time-of-day keywords
    tod_map = {
        "上午": (9, 0),
        "中午": (12, 0),
        "下午": (14, 0),
        "晚上": (19, 0),
        "凌晨": (5, 0),
        "清晨": (6, 0),
        "傍晚": (18, 0),
    }

    # Weekday keywords
    weekday_map = {
        "周一": 0,
        "星期一": 0,
        "周二": 1,
        "星期二": 1,
        "周三": 2,
        "星期三": 2,
        "周四": 3,
        "星期四": 3,
        "周五": 4,
        "星期五": 4,
        "周六": 5,
        "星期六": 5,
        "周日": 6,
        "星期天": 6,
        "星期日": 6,
    }

    # Extract explicit time like "9:30", "9点30", "9点", "21:30"
    time_match = re.search(
        r"(\d{1,2})[:\：](\d{1,2})|(\d{1,2})点(\d{1,2})分?|(\d{1,2})点",
        expr,
    )
    explicit_hour = None
    explicit_minute = None
    if time_match:
        if time_match.group(1) and time_match.group(2):
            explicit_hour = int(time_match.group(1))
            explicit_minute = int(time_match.group(2))
        elif time_match.group(3) and time_match.group(4):
            explicit_hour = int(time_match.group(3))
            explicit_minute = int(time_match.group(4))
        elif time_match.group(5):
            explicit_hour = int(time_match.group(5))
            explicit_minute = 0

    # Determine target date
    target_date = base.date()
    day_offset = None
    matched_day_keyword = None

    for keyword, offset in day_map.items():
        if keyword in expr:
            day_offset = offset
            matched_day_keyword = keyword
            break

    if day_offset is not None:
        target_date = (base + timedelta(days=day_offset)).date()
    elif "下周" in expr:
        # Match "下周X" or "下周星期X"
        week_match = re.search(
            r"下周(?:星期)?([一二三四五六日天])",
            expr,
        )
        if week_match:
            day_char = week_match.group(1)
            wd_map = {"一": 0, "二": 1, "三": 2, "四": 3, "五": 4, "六": 5, "日": 6, "天": 6}
            target_wd = wd_map.get(day_char, 0)
            days_ahead = target_wd - base.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            target_date = (base + timedelta(days=days_ahead)).date()
    else:
        for keyword, wd in weekday_map.items():
            if keyword in expr:
                days_ahead = wd - base.weekday()
                if days_ahead <= 0:
                    days_ahead += 7
                target_date = (base + timedelta(days=days_ahead)).date()
                break

    # Month/day explicit
    md_match = re.search(
        r"(\d{1,2})月(\d{1,2})[号日]?",
        expr,
    )
    if md_match:
        month = int(md_match.group(1))
        day = int(md_match.group(2))
        year = base.year
        # If the date has already passed this year, assume next year
        try:
            candidate = datetime(year, month, day)
            if candidate.date() < base.date():
                year += 1
            target_date = datetime(year, month, day).date()
        except ValueError:
            pass

    # Adjust explicit hour for PM contexts in Chinese
    if explicit_hour is not None:
        if any(k in expr for k in ("下午", "晚上", "傍晚")) and explicit_hour < 12:
            explicit_hour += 12
        elif "中午" in expr and explicit_hour < 12:
            explicit_hour = 12

    # Determine target time
    target_hour = explicit_hour if explicit_hour is not None else base.hour
    target_minute = explicit_minute if explicit_minute is not None else base.minute

    # Check for time-of-day keywords (only if no explicit time)
    if explicit_hour is None:
        for keyword, (h, m) in tod_map.items():
            if keyword in expr:
                target_hour = h
                target_minute = m
                break

    # If we matched nothing meaningful, return None to fallback to dateparser
    matched_something = (
        matched_day_keyword is not None
        or explicit_hour is not None
        or md_match is not None
        or any(k in expr for k in tod_map)
        or any(k in expr for k in weekday_map)
        or "下周" in expr
    )
    if not matched_something:
        return None

    # If no explicit time and no time-of-day keyword, default to start of day
    # unless the expression is clearly asking for a specific day without time
    if explicit_hour is None and not any(k in expr for k in tod_map):
        # If expression is just a day reference ("明天", "后天"), default to 09:00
        if matched_day_keyword and not md_match:
            target_hour = 9
            target_minute = 0

    # Construct datetime
    tzinfo = base.tzinfo
    try:
        result = datetime(
            target_date.year,
            target_date.month,
            target_date.day,
            target_hour,
            target_minute,
            0,
            tzinfo=tzinfo,
        )
    except ValueError:
        return None

    # If the resulting time is in the past (and no explicit date was given),
    # assume next occurrence for time-of-day references
    if result < base and matched_day_keyword is None and md_match is None:
        # Only shift if it's a pure time reference (e.g., "上午" without day)
        if any(k in expr for k in tod_map) and not any(k in expr for k in day_map):
            result += timedelta(days=1)

    return result


def parse_time(expression: str, timezone: str, reference_time: str) -> str | None:
    """Parse natural language time expression into ISO8601 string."""
    try:
        base = datetime.fromisoformat(reference_time)
    except ValueError:
        return None

    # Try Chinese deterministic parser first
    dt = _parse_chinese_time(expression, base)
    if dt is not None:
        return dt.isoformat()

    # Fallback to dateparser
    settings = {
        "RELATIVE_BASE": base,
        "TIMEZONE": timezone,
        "RETURN_AS_TIMEZONE_AWARE": True,
        "PREFER_DATES_FROM": "future",
    }
    dt = dateparser.parse(expression, settings=settings)
    if dt:
        return dt.isoformat()
    return None
