"""Notification Dispatcher — routes alerts to configured channels."""

import logging

from tremor.models.event import ChangeEvent, Severity
from tremor.notifications.slack import SlackNotifier
from tremor.notifications.telegram import TelegramNotifier
from tremor.realtime.broadcaster import broadcaster

logger = logging.getLogger(__name__)

# Only notify on these severities by default
_NOTIFY_SEVERITIES = {Severity.CRITICAL, Severity.HIGH}


class NotificationDispatcher:
    """
    Central dispatcher for all notification channels.

    Sends to all configured channels (Slack, Telegram) and broadcasts
    via WebSocket simultaneously.
    """

    def __init__(self):
        self.slack = SlackNotifier()
        self.telegram = TelegramNotifier()

    @property
    def configured_channels(self) -> list[str]:
        """List of configured notification channels."""
        channels = ["websocket"]  # Always available
        if self.slack.is_configured:
            channels.append("slack")
        if self.telegram.is_configured:
            channels.append("telegram")
        return channels

    async def notify_event(self, event: ChangeEvent) -> dict:
        """
        Send a ChangeEvent notification to all configured channels.

        Only notifies for CRITICAL and HIGH severity by default.
        Always broadcasts via WebSocket regardless of severity.
        """
        results = {"websocket": True, "slack": None, "telegram": None}

        # Always broadcast via WebSocket (frontend gets all events)
        await broadcaster.broadcast_change_event(event)

        # Only notify external channels for high-severity events
        if event.severity not in _NOTIFY_SEVERITIES:
            return results

        # Slack
        if self.slack.is_configured:
            results["slack"] = await self.slack.send_event(event)
            await broadcaster.broadcast_notification(
                "slack", "sent" if results["slack"] else "failed", event.entity.path
            )

        # Telegram
        if self.telegram.is_configured:
            results["telegram"] = await self.telegram.send_event(event)
            await broadcaster.broadcast_notification(
                "telegram", "sent" if results["telegram"] else "failed", event.entity.path
            )

        return results

    async def notify_alert_summary(self, alerts: list, domain: str) -> dict:
        """Send a domain alert summary to all channels."""
        results = {"slack": None, "telegram": None}

        if not alerts:
            return results

        if self.slack.is_configured:
            results["slack"] = await self.slack.send_alert_summary(alerts, domain)

        if self.telegram.is_configured:
            results["telegram"] = await self.telegram.send_alert_summary(alerts, domain)

        return results

    async def notify_batch(self, events: list[ChangeEvent]) -> dict:
        """
        Notify for a batch of events (e.g., after processing).

        Sends individual WebSocket events and a combined summary to Slack/Telegram.
        """
        results = {
            "events_total": len(events),
            "events_notified": 0,
            "websocket": True,
            "slack": None,
            "telegram": None,
        }

        # Broadcast all via WebSocket
        for event in events:
            await broadcaster.broadcast_change_event(event)

        # Filter to notify-worthy events
        notable = [e for e in events if e.severity in _NOTIFY_SEVERITIES]
        results["events_notified"] = len(notable)

        if not notable:
            return results

        # Send summary to external channels
        summary_text = self._build_batch_summary(notable, len(events))

        if self.slack.is_configured:
            results["slack"] = await self.slack.send_custom(summary_text)

        if self.telegram.is_configured:
            results["telegram"] = await self.telegram.send_custom(summary_text)

        return results

    def _build_batch_summary(self, notable: list[ChangeEvent], total: int) -> str:
        """Build a text summary for batch notification."""
        critical = sum(1 for e in notable if e.severity == Severity.CRITICAL)
        high = sum(1 for e in notable if e.severity == Severity.HIGH)

        lines = [
            "⚡ *Tremor — Change Intelligence Alert*",
            "",
            f"Detected *{total}* semantic changes, *{len(notable)}* requiring attention:",
            f"🔴 Critical: {critical} | 🟠 High: {high}",
            "",
        ]

        for event in notable[:5]:
            emoji = "🔴" if event.severity == Severity.CRITICAL else "🟠"
            lines.append(f"{emoji} `{event.shift.value}` — {event.entity.path}")
            lines.append(f"   {event.reasoning[:100]}")
            lines.append("")

        if len(notable) > 5:
            lines.append(f"_+ {len(notable) - 5} more high-priority changes_")

        return "\n".join(lines)


# Singleton instance
dispatcher = NotificationDispatcher()
