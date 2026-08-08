from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from app.schemas.user import UserResponse

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: Optional[str] = Field(default=None, alias="confirmPassword")

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    user: UserResponse
    token: str
    refresh_token: str = Field(alias="refreshToken")

    model_config = ConfigDict(populate_by_name=True)

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    reset_token: str = Field(alias="resetToken")
    new_password: str = Field(alias="newPassword")
