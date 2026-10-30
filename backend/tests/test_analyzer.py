from types import SimpleNamespace

from backend.app.services import analyzer


def test_analysis_without_consent_never_calls_ai_provider(monkeypatch):
    monkeypatch.setattr(analyzer, "get_settings", lambda: SimpleNamespace(openai_api_key="configured"))

    def forbidden_provider(**kwargs):
        raise AssertionError("Provider must not be constructed without consent")

    monkeypatch.setattr(analyzer, "OpenAI", forbidden_provider)
    report, mode = analyzer.analyze("Skills\nPython", ai_consent=False)
    assert mode == "demo_local"
    assert report.programming_languages == ["Python"]


def test_invalid_ai_response_falls_back_to_local_analysis(monkeypatch):
    monkeypatch.setattr(
        analyzer,
        "get_settings",
        lambda: SimpleNamespace(openai_api_key="configured", openai_model="test-model"),
    )
    completion = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content="{invalid json"))])
    client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(create=lambda **kwargs: completion),
        ),
    )
    monkeypatch.setattr(analyzer, "OpenAI", lambda **kwargs: client)

    report, mode = analyzer.analyze("Skills\nPython", ai_consent=True)
    assert mode == "local_fallback"
    assert report.programming_languages == ["Python"]
