from fastapi import APIRouter, Depends
from app.models.user import User
from app.schemas.user import UserResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    name: str = None,
    avatar: str = None,
    current_user: User = Depends(get_current_user)
):
    if name:
        current_user.name = name
    if avatar:
        current_user.avatar = avatar
    return UserResponse.model_validate(current_user)

@router.get("/notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    return {"emailAlerts": True, "ragDigest": "daily", "securityAlerts": True}

@router.patch("/notifications")
async def update_notifications(prefs: dict, current_user: User = Depends(get_current_user)):
    return {"message": "Notification preferences saved"}

@router.get("/voice")
async def get_voice_settings(current_user: User = Depends(get_current_user)):
    return {"speechRate": 1.0, "voiceStyle": "Conversational Natural", "autoListen": True}

@router.patch("/voice")
async def update_voice_settings(prefs: dict, current_user: User = Depends(get_current_user)):
    return {"message": "Voice settings saved"}
