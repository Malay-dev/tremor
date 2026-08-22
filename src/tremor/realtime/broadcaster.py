"""Event Broadcaster — manages WebSocket connections and pushes events to all clients."""

import json
import logging
from dataclasses import dataclass, field

from fastapi import WebSocket

logger = logging.getLogger(__name__)


@dataclass
class EventBroadcaster:
    """
    Manages active WebSocket connections and broadcasts events to all.

    Usage:
        # In your pipeline, after detecting events:
        await broadcaster.broadcast_event(event_data)

        # Clients connect via WebSocket and receive events in real-time.
    """

    _connections: list[WebSocket] = field(default_factory=list)

    async def connect(self, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self._connections.append(websocket)
        logger.info(f"WebSocket client connected. Total: {len(self._connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a disconnected WebSocket."""
        if websocket in self._connections:
            self._connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total: {len(self._connections)}")

    @property
    def client_count(self) -> int:
        return len(self._connections)

    async def broadcast_event(self, event_type: str, data: dict) -> None:
        """
        Broadcast an event to all connected WebSocket clients.

        Args:
            event_type: Type of event (e.g., "change_detected", "impact_analyzed")
            data: Event payload
        """
        if not self._connections:
            return

        message = json.dumps({"type": event_type, "data": data}, default=str)
        dead: list[WebSocket] = []

        for ws in self._connections:
            try:
                await ws.send_text(message)
            except Exception:  # noqa: BLE001
                dead.append(ws)

        # Clean up dead connections
        for ws in dead:
            self.disconnect(ws)

    async def broadcast_change_event(self, event) -> None:
        """Broadcast a ChangeEvent to all clients."""
        await self.broadcast_event("change_detected", {
            "event_id": str(event.event_id),
            "timestamp": event.timestamp.isoformat(),
            "application": event.application,
            "shift": event.shift.value,
            "severity": event.severity.value,
            "entity": event.entity.path,
            "reasoning": event.reasoning,
            "before": event.before.value,
            "after": event.after.value,
        })

    async def broadcast_impact(self, analysis) -> None:
        """Broadcast an ImpactAnalysis to all clients."""
        await self.broadcast_event("impact_analyzed", {
            "event_id": analysis.event_id,
            "source_entity": analysis.source_entity,
            "application": analysis.application,
            "affected_systems": analysis.affected_systems,
            "risk_score": analysis.total_risk_score,
            "recommendations": analysis.recommendations,
            "path_count": len(analysis.paths),
        })

    async def broadcast_alert(self, alert) -> None:
        """Broadcast a DomainAlert to all clients."""
        await self.broadcast_event("domain_alert", {
            "domain": alert.domain.value,
            "title": alert.title,
            "severity": alert.severity,
            "entity": alert.entity,
            "summary": alert.summary,
            "affected_systems": alert.affected_systems,
            "risk_score": alert.risk_score,
        })

    async def broadcast_notification(self, channel: str, status: str, message: str) -> None:
        """Broadcast that a notification was sent."""
        await self.broadcast_event("notification_sent", {
            "channel": channel,
            "status": status,
            "message": message,
        })


# Singleton instance
broadcaster = EventBroadcaster()
