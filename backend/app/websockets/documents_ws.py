import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/documents/{user_id}")
async def websocket_documents(websocket: WebSocket, user_id: str):
    await websocket.accept()
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass

@router.websocket("/voice/{user_id}")
async def websocket_voice(websocket: WebSocket, user_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            msg_type = payload.get("type")

            if msg_type == "audio_chunk":
                await websocket.send_text(json.dumps({
                    "type": "partial_transcript",
                    "text": "Listening to voice input..."
                }))
            elif msg_type == "barge_in":
                await websocket.send_text(json.dumps({
                    "type": "interrupted"
                }))
    except WebSocketDisconnect:
        pass
