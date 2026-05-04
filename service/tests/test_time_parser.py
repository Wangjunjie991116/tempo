import pytest
from datetime import datetime
from app.services.time_parser import parse_time


def test_parse_tonight():
    ref = "2026-05-04T10:00:00+08:00"
    result = parse_time("今天晚上9:30", "Asia/Shanghai", ref)
    assert result == "2026-05-04T21:30:00+08:00"


def test_parse_day_after_tomorrow_morning():
    ref = "2026-05-04T10:00:00+08:00"
    result = parse_time("后天上午", "Asia/Shanghai", ref)
    assert result == "2026-05-06T09:00:00+08:00"


def test_parse_tomorrow_morning():
    ref = "2026-05-04T10:00:00+08:00"
    result = parse_time("明天上午", "Asia/Shanghai", ref)
    assert result == "2026-05-05T09:00:00+08:00"


def test_parse_unknown():
    ref = "2026-05-04T10:00:00+08:00"
    result = parse_time("some gibberish", "Asia/Shanghai", ref)
    assert result is None
