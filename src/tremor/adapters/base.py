"""Adapter base class and registry — domain-specific impact interpretation."""

from abc import ABC, abstractmethod
from enum import StrEnum

from pydantic import BaseModel, Field

from tremor.models.event import ChangeEvent


class AdapterDomain(StrEnum):
    """Available adapter domains."""

    IGA = "IGA"
    RFP = "RFP"


class RemediationStep(BaseModel):
    """A single actionable step to remediate an impact."""

    priority: int  # 1 = highest
    action: str  # What to do
    system: str  # Where to do it
    assignee_hint: str | None = None  # e.g. "IAM Team", "Procurement"
    effort: str | None = None  # e.g. "30 min", "2 hours", "1 sprint"


class DomainAlert(BaseModel):
    """A domain-specific alert generated from a ChangeEvent."""

    domain: AdapterDomain
    title: str
    severity: str
    entity: str  # What changed
    shift: str  # Shift type
    summary: str  # Human-readable impact summary
    affected_systems: list[str] = Field(default_factory=list)
    remediation: list[RemediationStep] = Field(default_factory=list)
    risk_score: float = 0.0  # 0.0 to 1.0
    tags: list[str] = Field(default_factory=list)  # e.g. ["provisioning", "breaking"]


class DomainAnalysis(BaseModel):
    """Full analysis from an adapter for a set of events."""

    domain: AdapterDomain
    total_events: int
    critical_count: int = 0
    high_count: int = 0
    alerts: list[DomainAlert] = Field(default_factory=list)
    executive_summary: str = ""


class BaseAdapter(ABC):
    """
    Base class for domain adapters.

    Adapters translate generic ChangeEvents into domain-specific
    impact assessments with actionable remediation steps.
    """

    domain: AdapterDomain

    @abstractmethod
    def analyze(self, events: list[ChangeEvent]) -> DomainAnalysis:
        """Analyze a list of ChangeEvents through the domain lens."""
        ...

    @abstractmethod
    def is_relevant(self, event: ChangeEvent) -> bool:
        """Check if this event is relevant to this adapter's domain."""
        ...


# ─── Adapter Registry ────────────────────────────────────────────────────────

_REGISTRY: dict[AdapterDomain, BaseAdapter] = {}


def register_adapter(adapter: BaseAdapter) -> None:
    """Register an adapter instance."""
    _REGISTRY[adapter.domain] = adapter


def get_adapter(domain: AdapterDomain) -> BaseAdapter | None:
    """Get a registered adapter by domain."""
    return _REGISTRY.get(domain)


def get_all_adapters() -> dict[AdapterDomain, BaseAdapter]:
    """Get all registered adapters."""
    return _REGISTRY.copy()


def analyze_with_all(events: list[ChangeEvent]) -> list[DomainAnalysis]:
    """Run all registered adapters on a set of events."""
    results = []
    for adapter in _REGISTRY.values():
        relevant = [e for e in events if adapter.is_relevant(e)]
        if relevant:
            results.append(adapter.analyze(relevant))
    return results
