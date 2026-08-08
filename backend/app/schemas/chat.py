from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List

def to_camel(string: str) -> str:
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

class CitationResponse(BaseModel):
    id: Optional[str] = None
    document_id: Optional[str] = Field(default="", alias="documentId")
    document_title: Optional[str] = Field(default="Document", alias="documentTitle")
    excerpt: Optional[str] = ""
    page: Optional[int] = None
    chunk: Optional[int] = None
    score: Optional[float] = None
    url: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel
    )

class MessageResponse(BaseModel):
    id: str
    role: str # 'user' | 'assistant' | 'system'
    content: str
    citations: Optional[List[CitationResponse]] = Field(default_factory=list)
    timestamp: str
    is_streaming: Optional[bool] = Field(default=False, alias="isStreaming")
    model: Optional[str] = "Gemini 2.5 Flash"
    tokens: Optional[int] = 0
    error: Optional[str] = None
    provider: Optional[str] = None
    degraded: Optional[bool] = False
    speech_text: Optional[str] = Field(default=None, alias="speechText")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel
    )

class ConversationResponse(BaseModel):
    id: str
    title: str
    messages: List[MessageResponse] = Field(default_factory=list)
    document_ids: List[str] = Field(default_factory=list, alias="documentIds")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")
    model: Optional[str] = "Gemini 2.5 Flash"
    pinned: Optional[bool] = False

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel
    )

class CreateMessageRequest(BaseModel):
    content: Optional[str] = Field(default=None)
    message: Optional[str] = Field(default=None)
    query: Optional[str] = Field(default=None)
    context_document_ids: Optional[List[str]] = Field(default=None, alias="contextDocumentIds")

    model_config = ConfigDict(populate_by_name=True)

    def get_content(self) -> str:
        return (self.content or self.message or self.query or "").strip()
