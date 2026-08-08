from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Union
from datetime import datetime

def to_camel(string: str) -> str:
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

class DocumentResponse(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = "Untitled Document"
    content: Optional[str] = None
    summary: Optional[str] = None
    file_type: Optional[str] = Field(default="PDF", alias="fileType")
    file_size: Optional[int] = Field(default=0, alias="fileSize")
    status: Optional[str] = Field(default="uploading", alias="status")
    tags: Optional[List[str]] = Field(default_factory=list)
    category: Optional[str] = None
    uploaded_by: Optional[str] = Field(default="system", alias="uploadedBy")
    file_path: Optional[str] = Field(default=None, alias="filePath")
    is_knowledge_base: Optional[bool] = Field(default=False, alias="isKnowledgeBase")
    created_at: Optional[Union[datetime, str]] = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: Optional[Union[datetime, str]] = Field(default_factory=datetime.utcnow, alias="updatedAt")
    chunks: Optional[int] = 0
    tokens: Optional[int] = 0
    thumbnail_url: Optional[str] = Field(default=None, alias="thumbnailUrl")
    source_url: Optional[str] = Field(default=None, alias="sourceUrl")
    checksum: Optional[str] = None
    error_message: Optional[str] = Field(default=None, alias="errorMessage")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel
    )

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
