"""Telegram webhook notification sender."""

import logging
import os

import httpx

from tremor.models.event import ChangeEvent

logger = logging.getLogger(__name__)

# Severity → Telegram emoji
_SEVERITY_EMOJI = {
    "CRITICAL": "🔴",
    "HIGH": "🟠",
    "MEDIUM": "🟡",
    "LOW": "🟢",
    "INFO": "⚪",
}

TELEGRAM_API = "https://api.telegram.org"


class TelegramNotifier:
    """Sends alerts to Telegram via Bot API."""

    def __init__(self, bot_token: str | None = None, chat_id: str | None = None):
        self.bot_token = bot_token or os.environ.get("TELEGRAM_BOT_TOKEN", "")
        self.chat_id = chat_id or os.environ.get("TELEGRAM_CHAT_ID", "")

    @property
    def is_configured(self) -> bool:
        return bool(self.bot_token and self.chat_id)

    async def send_event(self, event: ChangeEvent) -> bool:
        """Send a single ChangeEvent as a Telegram message."""
        if not self.is_configured:
            return False

        emoji = _SEVERITY_EMOJI.get(event.severity.value, "❓")
        message = self._format_event(event, emoji)
        return await self._send(message)

    async def send_alert_summary(self, alerts: list, domain: str) -> bool:
        """Send a summary of domain alerts."""
        if not self.is_configured:
            return False

        critical = sum(1 for a in alerts if a.severity == "CRITICAL")
        high = sum(1 for a in alerts if a.severity == "HIGH")

        lines = [
            f"⚡ *Tremor — {domain} Alert Summary*",
            "",
            f"📊 *{len(alerts)} change(s) detected*",
            f"🔴 Critical: {critical} | 🟠 High: {high}",
            "",
            "─────────────────────────",
        ]

        for alert in alerts[:5]:
            emoji = _SEVERITY_EMOJI.get(alert.severity, "⚪")
            lines.append(f"{emoji} *{alert.title}*")
            lines.append(f"  {alert.summary[:150]}")
            if alert.affected_systems:
                lines.append(f"  _Affected: {', '.join(alert.affected_systems[:3])}_")
            lines.append("")

        if len(alerts) > 5:
            lines.append(f"_\\+ {len(alerts) - 5} more alerts_")

        message = "\n".join(lines)
        return await self._send(message)

    async def send_custom(self, text: str) -> bool:
        """Send a custom text message."""
        if not self.is_configured:
            return False
        return await self._send(text)

    def _format_event(self, event: ChangeEvent, emoji: str) -> str:
        """Format a ChangeEvent as a Telegram message."""
        return (
            f"⚡ *Tremor — Change Detected*\n"
            f"\n"
            f"{emoji} *{event.severity.value}* — `{event.shift.value}`\n"
            f"\n"
            f"📍 *Entity:* `{event.entity.path}`\n"
            f"🏢 *Application:* {event.application}\n"
            f"\n"
            f"*Before:* `{event.before.value}`\n"
            f"*After:* `{event.after.value}`\n"
            f"\n"
            f"_{event.reasoning}_"
        )

    async def _send(self, text: str) -> bool:
        """Send message via Telegram Bot API."""
        try:
            url = f"{TELEGRAM_API}/bot{self.bot_token}/sendMessage"
            payload = {
                "chat_id": self.chat_id,
                "text": text,
                "parse_mode": "Markdown",
                "disable_web_page_preview": True,
            }

            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    logger.info("Telegram notification sent")
                    return True
                logger.warning(f"Telegram API returned {response.status_code}: {response.text}")
                return False
        except Exception as e:  # noqa: BLE001
            logger.error(f"Telegram notification failed: {e}")
            return False
