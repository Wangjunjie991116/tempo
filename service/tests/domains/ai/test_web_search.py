from unittest.mock import MagicMock, patch

from app.domains.ai.web_search import search_web


def test_search_web_success():
    mock_results = [
        {"title": "G2 高铁时刻表", "body": "G2 上海虹桥-北京南 14:00-18:28"},
        {"title": "G4 高铁时刻表", "body": "G4 上海虹桥-北京南 15:00-19:36"},
    ]

    with patch("app.domains.ai.web_search.DDGS") as MockDDGS:
        instance = MagicMock()
        instance.text.return_value = mock_results
        MockDDGS.return_value.__enter__.return_value = instance

        result = search_web("上海到北京高铁", num_results=2)

        assert "G2 高铁时刻表" in result
        assert "14:00-18:28" in result
        assert "G4 高铁时刻表" in result
        instance.text.assert_called_once_with("上海到北京高铁", max_results=2)


def test_search_web_no_results():
    with patch("app.domains.ai.web_search.DDGS") as MockDDGS:
        instance = MagicMock()
        instance.text.return_value = []
        MockDDGS.return_value.__enter__.return_value = instance

        result = search_web("不存在的内容")
        assert result == "未找到相关结果。"


def test_search_web_error():
    with patch("app.domains.ai.web_search.DDGS") as MockDDGS:
        instance = MagicMock()
        instance.text.side_effect = Exception("Rate limit")
        MockDDGS.return_value.__enter__.return_value = instance

        result = search_web("查询")
        assert "搜索失败" in result
        assert "Rate limit" in result
