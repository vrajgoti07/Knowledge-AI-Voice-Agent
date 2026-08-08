from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

def to_camel(string: str) -> str:
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

class UserBase(BaseModel):
    name: str
    email: str
    avatar: Optional[str] = None
    role: str = "user"
    plan: str = "pro"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel
    )
