"""WebSocket endpoint for real-time event streaming."""

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from tremor.realtime.broadcaster import broadcaster

logger = logging.getLogger(__name__)

router = APIRouter(tags=["realtime"])


@router.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    """
    WebSocket endpoint for real-time event streaming.

    Clients connect here and receive:
    - change_detected: When a new ChangeEvent is produced
    - impact_analyzed: When impact graph traversal completes
    - domain_alert: When a domain adapter generates an alert
    - notification_sent: When a Slack/Telegram notification fires

    Message format:
    {
        "type": "change_detected",
        "data": { ... event payload ... }
    }
    """
    await broadcaster.connect(websocket)
    try:
        while True:
            # Keep connection alive — client can send pings
            data = await websocket.receive_text()
            # Echo back as acknowledgment
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)


@router.get("/ws/status")
async def websocket_status():
    """Check how many WebSocket clients are connected."""
    return {
        "connected_clients": broadcaster.client_count,
        "endpoint": "/ws/events",
    }
