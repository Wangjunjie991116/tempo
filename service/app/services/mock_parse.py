from app.schemas import ScheduleDraft


def mock_parse_schedule(text: str, timezone: str | None, locale: str | None) -> ScheduleDraft:
    _ = timezone, locale
    title = text.strip()[:80] or "未命名日程"
    return ScheduleDraft(
        title=title,
        start_at="2026-05-01T07:00:00.000Z",
        end_at="2026-05-01T08:00:00.000Z",
        all_day=False,
        confidence=0.0,
        notes=None,
    )
