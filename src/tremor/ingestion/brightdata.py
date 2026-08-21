"""Bright Data Scraper Studio integration — CLI wrapper and API client."""

import asyncio
import json
import logging
import os
import subprocess

import httpx

logger = logging.getLogger(__name__)

# API base
BRIGHT_DATA_API = "https://api.brightdata.com"

# Polling config
_POLL_INTERVAL = 5  # seconds
_POLL_MAX_ATTEMPTS = 60  # 5 min max wait


class BrightDataClient:
    """
    Client for Bright Data Scraper Studio.

    Supports both the HTTP API (trigger/poll) and the CLI (create/heal).
    Designed to be called only during demo — all methods are explicit, nothing runs on import.
    """

    def __init__(self, api_token: str | None = None):
        self.api_token = api_token or os.environ.get("BRIGHT_DATA_API_TOKEN", "")
        if not self.api_token:
            raise RuntimeError(
                "BRIGHT_DATA_API_TOKEN is required. "
                "Get it from Account Settings → API Tokens in Bright Data dashboard."
            )
        self._headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

    # ─── CLI Operations (create, heal) ───────────────────────────────────────

    def create_scraper(self, url: str, description: str) -> str:
        """
        Create a new scraper via Bright Data CLI.

        Args:
            url: Target URL to scrape
            description: Plain-language description of the data you want

        Returns:
            The Collector ID (c_xxxxx)

        Note: This can take 5-15 minutes for complex sites.
        """
        logger.info(f"Creating Bright Data scraper for {url}: '{description}'")
        result = subprocess.run(
            ["npx", "-p", "@brightdata/cli", "bdata", "scraper", "create", url, description],
            capture_output=True,
            text=True,
            timeout=1800,  # 30 min timeout for complex sites
            check=False,
        )

        if result.returncode != 0:
            raise RuntimeError(f"bdata scraper create failed: {result.stderr}")

        # Parse collector ID from output
        output = result.stdout.strip()
        collector_id = self._extract_collector_id(output)
        logger.info(f"Scraper created: {collector_id}")
        return collector_id

    def heal_scraper(self, collector_id: str, description: str) -> str:
        """
        Heal a broken scraper via Bright Data CLI.

        Args:
            collector_id: The c_xxxxx collector ID
            description: What broke / what to fix

        Returns:
            CLI output confirming the heal
        """
        logger.info(f"Healing scraper {collector_id}: '{description}'")
        result = subprocess.run(
            ["npx", "-p", "@brightdata/cli", "bdata", "scraper", "heal", collector_id, description],
            capture_output=True,
            text=True,
            timeout=600,
            check=False,
        )

        if result.returncode != 0:
            raise RuntimeError(f"bdata scraper heal failed: {result.stderr}")

        logger.info(f"Scraper healed: {collector_id}")
        return result.stdout.strip()

    def run_scraper_cli(self, collector_id: str, url: str) -> list[dict]:
        """
        Run a scraper via CLI and return JSON results.

        Args:
            collector_id: The c_xxxxx collector ID
            url: URL to scrape

        Returns:
            Parsed JSON results
        """
        logger.info(f"Running scraper {collector_id} on {url}")
        result = subprocess.run(
            ["npx", "-p", "@brightdata/cli", "bdata", "scraper", "run", collector_id, url, "--pretty"],
            capture_output=True,
            text=True,
            timeout=300,
            check=False,
        )

        if result.returncode != 0:
            raise RuntimeError(f"bdata scraper run failed: {result.stderr}")

        return json.loads(result.stdout)

    # ─── HTTP API Operations (trigger, poll, get results) ────────────────────

    async def trigger_collection(self, collector_id: str, urls: list[str]) -> str:
        """
        Trigger an async batch collection via the API.

        Args:
            collector_id: The c_xxxxx collector ID
            urls: List of URLs to scrape

        Returns:
            The collection_id (snapshot_id) to poll for results
        """
        inputs = [{"url": url} for url in urls]

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{BRIGHT_DATA_API}/dca/trigger",
                headers=self._headers,
                params={"collector": collector_id},
                json=inputs,
            )
            response.raise_for_status()

        data = response.json()
        collection_id = data.get("collection_id") or data.get("snapshot_id")

        if not collection_id:
            raise RuntimeError(f"No collection_id in trigger response: {data}")

        logger.info(f"Collection triggered: {collection_id} ({len(urls)} URLs)")
        return collection_id

    async def trigger_realtime(self, collector_id: str, url: str) -> str:
        """
        Trigger an async real-time scrape (single URL, faster).

        Args:
            collector_id: The c_xxxxx collector ID
            url: Single URL to scrape

        Returns:
            The response_id to fetch results
        """
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{BRIGHT_DATA_API}/dca/trigger_immediate",
                headers=self._headers,
                params={"collector": collector_id},
                json={"url": url},
            )
            response.raise_for_status()

        data = response.json()
        response_id = data.get("response_id")

        if not response_id:
            raise RuntimeError(f"No response_id in trigger_immediate response: {data}")

        logger.info(f"Real-time scrape triggered: {response_id}")
        return response_id

    async def get_results(self, collection_id: str) -> list[dict]:
        """
        Poll for and return batch collection results.

        Args:
            collection_id: The collection_id from trigger_collection

        Returns:
            List of result objects (structured JSON from the scraper)
        """
        logger.info(f"Polling for results: {collection_id}")

        for attempt in range(_POLL_MAX_ATTEMPTS):
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(
                    f"{BRIGHT_DATA_API}/dca/dataset",
                    headers=self._headers,
                    params={"id": collection_id},
                )

            if response.status_code == 200:
                data = response.json()
                if data:  # Non-empty means results are ready
                    logger.info(f"Results ready: {len(data)} records")
                    return data

            # Not ready yet
            await asyncio.sleep(_POLL_INTERVAL)

        raise TimeoutError(f"Results not ready after {_POLL_MAX_ATTEMPTS * _POLL_INTERVAL}s")

    async def get_realtime_result(self, response_id: str) -> dict:
        """
        Fetch real-time scrape result.

        Args:
            response_id: The response_id from trigger_realtime

        Returns:
            Single result object
        """
        for attempt in range(24):  # 2 min max
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(
                    f"{BRIGHT_DATA_API}/dca/get_result",
                    headers=self._headers,
                    params={"response_id": response_id},
                )

            if response.status_code == 200:
                data = response.json()
                if data:
                    logger.info("Real-time result ready")
                    return data

            await asyncio.sleep(5)

        raise TimeoutError(f"Real-time result not ready for {response_id}")

    # ─── Convenience: collect and return as raw content ──────────────────────

    async def collect_page(self, collector_id: str, url: str) -> str:
        """
        Collect a page and return its content as a string (for ingestion pipeline).

        This is the bridge between Bright Data and Tremor's ingestion layer.
        Triggers the scraper, waits for results, and returns the structured data
        as a JSON string that can be fed directly to the webhook.
        """
        response_id = await self.trigger_realtime(collector_id, url)
        result = await self.get_realtime_result(response_id)
        return json.dumps(result, indent=2)

    # ─── Helpers ─────────────────────────────────────────────────────────────

    @staticmethod
    def _extract_collector_id(output: str) -> str:
        """Extract c_xxxxx collector ID from CLI output."""
        for line in output.split("\n"):
            line = line.strip()
            if line.startswith("c_"):
                return line.split()[0]  # First token starting with c_
            if "c_" in line:
                # Find c_ anywhere in the line
                start = line.index("c_")
                end = start + 2
                while end < len(line) and (line[end].isalnum() or line[end] == "_"):
                    end += 1
                return line[start:end]
        # Fallback: return full output if we can't parse
        raise RuntimeError(f"Could not extract Collector ID from output: {output[:200]}")
