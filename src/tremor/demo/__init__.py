"""Demo mode — returns mock data without external service calls."""

import os


def is_demo_mode() -> bool:
    """Check if DEMO_MODE is enabled."""
    return os.environ.get("DEMO_MODE", "true").lower() in ("true", "1", "yes")
