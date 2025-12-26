import base64

def speech_to_text(audio_base64: str | None) -> str:
    if not audio_base64:
        return ""
    try:
        base64.b64decode(audio_base64)
        return "decoded speech placeholder"
    except Exception:
        return ""
