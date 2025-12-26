from fastapi import FastAPI
from pydantic import BaseModel
from .core.speech_to_text import speech_to_text
from .core.intent_parser import parse_command
from .core.tenant_context import get_tenant_context

app = FastAPI(title="AI Command Service")

class CommandRequest(BaseModel):
    tenant_id: str
    command: str | None = None
    audio_base64: str | None = None
    user_context: dict

class CommandResponse(BaseModel):
    structured: dict
    summary: str
    transcript: str

@app.post("/commands", response_model=CommandResponse)
async def process_command(payload: CommandRequest):
    tenant_config = get_tenant_context(payload.tenant_id)
    transcript = payload.command or speech_to_text(payload.audio_base64)
    structured, summary = parse_command(transcript, tenant_config)
    return CommandResponse(structured=structured, summary=summary, transcript=transcript)
