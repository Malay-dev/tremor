"""Slack webhook notification sender."""

import logging
import os

import httpx

from tremor.models.event import ChangeEvent

logger = logging.getLogger(__name__)

# Severity → Slack emoji
_SEVERITY_EMOJI = {
    "CRITICAL": ":red_circle:",
    "HIGH": ":large_orange_circle:",
    "MEDIUM": ":large_yellow_circle:",
    "LOW": ":large_green_circle:",
    "INFO": ":white_circle:",
}


class SlackNotifier:
    """Sends alerts to Slack via incoming webhook."""

    def __init__(self, webhook_url: str | None = None):
        self.webhook_url = webhook_url or os.environ.get("SLACK_WEBHOOK_URL", "")

    @property
    def is_configured(self) -> bool:
        return bool(self.webhook_url)

    async def send_event(self, event: ChangeEvent) -> bool:
        """Send a single ChangeEvent as a Slack message."""
        if not self.is_configured:
            return False

        emoji = _SEVERITY_EMOJI.get(event.severity.value, ":grey_question:")
        blocks = self._build_event_blocks(event, emoji)

        return await self._send({"blocks": blocks})

    async def send_alert_summary(self, alerts: list, domain: str) -> bool:
        """Send a summary of domain alerts."""
        if not self.is_configured:
            return False

        critical = sum(1 for a in alerts if a.severity == "CRITICAL")
        high = sum(1 for a in alerts if a.severity == "HIGH")

        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"⚡ Tremor — {domain} Alert Summary"},
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": (
                        f"*{len(alerts)} change(s) detected*\n"
                        f":red_circle: Critical: {critical} | "
                        f":large_orange_circle: High: {high}"
                    ),
                },
            },
            {"type": "divider"},
        ]

        # Top 3 alerts
        for alert in alerts[:3]:
            emoji = _SEVERITY_EMOJI.get(alert.severity, ":white_circle:")
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": (
                        f"{emoji} *{alert.title}*\n"
                        f"{alert.summary[:200]}\n"
                        f"_Affected: {', '.join(alert.affected_systems[:3])}_"
                    ),
                },
            })

        if len(alerts) > 3:
            blocks.append({
                "type": "context",
                "elements": [{"type": "mrkdwn", "text": f"_+ {len(alerts) - 3} more alerts_"}],
            })

        return await self._send({"blocks": blocks})

    async def send_custom(self, text: str) -> bool:
        """Send a custom text message."""
        if not self.is_configured:
            return False
        return await self._send({"text": text})

    def _build_event_blocks(self, event: ChangeEvent, emoji: str) -> list:
        """Build Slack Block Kit blocks for a ChangeEvent."""
        return [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "⚡ Tremor — Change Detected"},
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Severity:*\n{emoji} {event.severity.value}"},
                    {"type": "mrkdwn", "text": f"*Shift:*\n`{event.shift.value}`"},
                    {"type": "mrkdwn", "text": f"*Entity:*\n`{event.entity.path}`"},
                    {"type": "mrkdwn", "text": f"*Application:*\n{event.application}"},
                ],
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": (
                        f"*Before:* `{event.before.value}`\n"
                        f"*After:* `{event.after.value}`\n\n"
                        f"_{event.reasoning}_"
                    ),
                },
            },
            {"type": "divider"},
        ]

    async def _send(self, payload: dict) -> bool:
        """Send payload to Slack webhook."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(self.webhook_url, json=payload)
                if response.status_code == 200:
                    logger.info("Slack notification sent")
                    return True
                logger.warning(f"Slack webhook returned {response.status_code}: {response.text}")
                return False
        except Exception as e:  # noqa: BLE001
            logger.error(f"Slack notification failed: {e}")
            return False
