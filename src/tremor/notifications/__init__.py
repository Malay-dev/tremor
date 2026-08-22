"""Notifications module — Slack, Telegram, and extensible webhook delivery."""

from tremor.notifications.dispatcher import NotificationDispatcher, dispatcher

__all__ = ["NotificationDispatcher", "dispatcher"]
