"""RFP Adapter — Request for Proposal / Procurement impact analysis.

Translates generic ChangeEvents into procurement-specific alerts:
- Deadline changes (TEMPORAL_SHIFT)
- Eligibility/requirement modifications
- Budget and scope changes
- Compliance requirement additions
- Authority/ownership changes

Targets: Government procurement portals, enterprise RFP platforms
"""

from tremor.adapters.base import (
    AdapterDomain,
    BaseAdapter,
    DomainAlert,
    DomainAnalysis,
    RemediationStep,
)
from tremor.models.event import (
    ChangeCategory,
    ChangeEvent,
    SemanticShift,
)

# Fields commonly found in RFP/procurement documents
_RFP_SENSITIVE_FIELDS = {
    "deadline", "due_date", "duedate", "submission_date", "closing_date",
    "start_date", "end_date", "period", "duration", "timeline",
    "budget", "value", "amount", "funding", "cost", "price",
    "eligibility", "qualification", "requirement", "criteria", "prerequisite",
    "scope", "deliverable", "milestone", "objective",
    "contact", "authority", "issuer", "contracting_officer",
    "amendment", "addendum", "modification", "revision",
    "compliance", "certification", "license", "registration",
    "evaluation", "scoring", "weight", "criteria_weight",
    "lot", "category", "sector", "naics", "cpv",
}

# Shift types critical for procurement
_RFP_CRITICAL_SHIFTS = {
    SemanticShift.TEMPORAL_SHIFT,
    SemanticShift.BREAKING_REMOVAL,
    SemanticShift.SCOPE_NARROWED,
    SemanticShift.DEPENDENCY_ADDED,
    SemanticShift.CONSTRAINT_ADDED,
}


class RFPAdapter(BaseAdapter):
    """Adapter for RFP/Procurement monitoring."""

    domain = AdapterDomain.RFP

    def is_relevant(self, event: ChangeEvent) -> bool:
        """An event is RFP-relevant if it touches procurement-related fields."""
        field_name = event.entity.path.split(".")[-1].lower()

        # Direct field match
        if field_name in _RFP_SENSITIVE_FIELDS:
            return True

        # Temporal shifts are always RFP-relevant
        if event.shift == SemanticShift.TEMPORAL_SHIFT:
            return True

        # Authority changes
        if event.shift == SemanticShift.AUTHORITY_CHANGED:
            return True

        # Requirement/policy changes
        if event.category == ChangeCategory.REQUIREMENT:
            return True
        if event.category == ChangeCategory.POLICY:
            return True

        # Scope changes
        if event.shift in (SemanticShift.SCOPE_NARROWED, SemanticShift.SCOPE_WIDENED):
            return True

        # Dependency changes (new prerequisites)
        return event.shift in (SemanticShift.DEPENDENCY_ADDED, SemanticShift.DEPENDENCY_REMOVED)

    def analyze(self, events: list[ChangeEvent]) -> DomainAnalysis:
        """Produce RFP-specific analysis with procurement impact."""
        alerts: list[DomainAlert] = []

        for event in events:
            alert = self._event_to_alert(event)
            if alert:
                alerts.append(alert)

        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
        alerts.sort(key=lambda a: severity_order.get(a.severity, 5))

        critical = sum(1 for a in alerts if a.severity == "CRITICAL")
        high = sum(1 for a in alerts if a.severity == "HIGH")

        summary = self._build_summary(alerts, critical, high)

        return DomainAnalysis(
            domain=AdapterDomain.RFP,
            total_events=len(events),
            critical_count=critical,
            high_count=high,
            alerts=alerts,
            executive_summary=summary,
        )

    def _event_to_alert(self, event: ChangeEvent) -> DomainAlert | None:
        """Convert a ChangeEvent to an RFP-specific DomainAlert."""
        field_name = event.entity.path.split(".")[-1].lower()

        if event.shift == SemanticShift.TEMPORAL_SHIFT or field_name in (
            "deadline", "due_date", "duedate", "submission_date", "closing_date"
        ):
            return self._deadline_alert(event)
        elif field_name in ("eligibility", "qualification", "requirement", "criteria", "prerequisite"):
            return self._eligibility_alert(event)
        elif field_name in ("budget", "value", "amount", "funding", "cost"):
            return self._budget_alert(event)
        elif field_name in ("scope", "deliverable", "milestone", "objective"):
            return self._scope_alert(event)
        elif field_name in ("compliance", "certification", "license", "registration"):
            return self._compliance_alert(event)
        elif event.shift == SemanticShift.AUTHORITY_CHANGED or field_name in ("contact", "authority", "issuer"):
            return self._authority_alert(event)
        elif event.shift in (SemanticShift.DEPENDENCY_ADDED, SemanticShift.CONSTRAINT_ADDED):
            return self._new_requirement_alert(event)
        else:
            return self._generic_rfp_alert(event)

    # ─── Alert generators ────────────────────────────────────────────────────

    def _deadline_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for deadline/timeline changes."""
        return DomainAlert(
            domain=AdapterDomain.RFP,
            title=f"Deadline changed: {event.entity.path}",
            severity="CRITICAL",
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                f"Submission deadline changed for '{event.entity.path}'. "
                f"Before: {event.before.value} → After: {event.after.value}. "
                f"All internal timelines must be recalculated immediately."
            ),
            affected_systems=[
                "Proposal Timeline",
                "Review Schedule",
                "Partner Coordination",
                "Resource Allocation",
            ],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Recalculate internal submission timeline and notify all contributors",
                    system="Project Management",
                    assignee_hint="Bid Manager",
                    effort="1 hour",
                ),
                RemediationStep(
                    priority=2,
                    action="Update partner/subcontractor deadlines",
                    system="Partner Portal",
                    assignee_hint="Partner Manager",
                    effort="30 min",
                ),
                RemediationStep(
                    priority=3,
                    action="Reassess resource allocation if timeline shortened",
                    system="Resource Planning",
                    assignee_hint="Program Manager",
                    effort="2 hours",
                ),
            ],
            risk_score=0.95,
            tags=["deadline", "urgent", "timeline"],
        )

    def _eligibility_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for eligibility/qualification changes."""
        is_narrowed = event.shift in (
            SemanticShift.SCOPE_NARROWED,
            SemanticShift.CONSTRAINT_ADDED,
            SemanticShift.DEPENDENCY_ADDED,
        )

        return DomainAlert(
            domain=AdapterDomain.RFP,
            title=f"Eligibility requirement changed: {event.entity.path}",
            severity="HIGH" if is_narrowed else "MEDIUM",
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                f"Eligibility criteria changed for '{event.entity.path}' ({event.shift.value}). "
                f"{'New restrictions may disqualify your bid.' if is_narrowed else 'Requirements relaxed — may open new opportunities.'} "
                f"Before: {event.before.value} → After: {event.after.value}"
            ),
            affected_systems=[
                "Bid/No-Bid Decision",
                "Compliance Matrix",
                "Qualification Documentation",
            ],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Re-evaluate bid eligibility against new criteria",
                    system="Compliance Matrix",
                    assignee_hint="Contracts Manager",
                    effort="2 hours",
                ),
                RemediationStep(
                    priority=2,
                    action="Gather additional qualification evidence if new requirements added",
                    system="Document Management",
                    assignee_hint="Proposal Team",
                    effort="4 hours",
                ),
            ],
            risk_score=0.8 if is_narrowed else 0.4,
            tags=["eligibility", "qualification", "bid-risk" if is_narrowed else "opportunity"],
        )

    def _budget_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for budget/value changes."""
        return DomainAlert(
            domain=AdapterDomain.RFP,
            title=f"Budget/value changed: {event.entity.path}",
            severity="HIGH",
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                f"Contract value or budget changed for '{event.entity.path}'. "
                f"Before: {event.before.value} → After: {event.after.value}. "
                f"Pricing strategy may need revision."
            ),
            affected_systems=[
                "Pricing Model",
                "Financial Approval",
                "Cost Estimate",
            ],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Revise pricing strategy against new budget ceiling",
                    system="Pricing Tool",
                    assignee_hint="Pricing Analyst",
                    effort="4 hours",
                ),
                RemediationStep(
                    priority=2,
                    action="Re-obtain financial approval if bid value changes significantly",
                    system="Approval Workflow",
                    assignee_hint="Finance Director",
                    effort="1 day",
                ),
            ],
            risk_score=0.7,
            tags=["budget", "pricing"],
        )

    def _scope_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for scope/deliverable changes."""
        return DomainAlert(
            domain=AdapterDomain.RFP,
            title=f"Scope changed: {event.entity.path}",
            severity="HIGH",
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                f"Project scope or deliverables changed ({event.shift.value}). "
                f"Technical proposal and resource plan may need updates."
            ),
            affected_systems=[
                "Technical Proposal",
                "Work Breakdown Structure",
                "Resource Plan",
                "Risk Register",
            ],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Gap analysis: compare current proposal against new scope",
                    system="Proposal Document",
                    assignee_hint="Technical Lead",
                    effort="3 hours",
                ),
                RemediationStep(
                    priority=2,
                    action="Update WBS and resource estimates",
                    system="Project Plan",
                    assignee_hint="Program Manager",
                    effort="4 hours",
                ),
            ],
            risk_score=0.7,
            tags=["scope", "deliverables"],
        )

    def _compliance_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for compliance/certification changes."""
        return DomainAlert(
            domain=AdapterDomain.RFP,
            title=f"Compliance requirement changed: {event.entity.path}",
            severity="HIGH",
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                f"Compliance or certification requirement changed ({event.shift.value}). "
                f"Verify your organization still meets mandatory certifications."
            ),
            affected_systems=["Compliance Matrix", "Certification Registry"],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Verify current certifications against new requirements",
                    system="Compliance Registry",
                    assignee_hint="Compliance Officer",
                    effort="1 hour",
                ),
                RemediationStep(
                    priority=2,
                    action="Initiate certification process if new cert required",
                    system="Certification Body",
                    assignee_hint="Quality Manager",
                    effort="Weeks–Months",
                ),
            ],
            risk_score=0.85,
            tags=["compliance", "certification"],
        )

    def _authority_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for authority/ownership changes."""
        return DomainAlert(
            domain=AdapterDomain.RFP,
            title=f"Authority changed: {event.entity.path}",
            severity="MEDIUM",
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                "Contracting authority or point of contact changed. "
                "Update all communications and submission addresses."
            ),
            affected_systems=["Contact Database", "Communication Plan"],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Update contracting officer contact details",
                    system="CRM / Contact DB",
                    assignee_hint="Bid Manager",
                    effort="15 min",
                ),
                RemediationStep(
                    priority=2,
                    action="Verify submission portal/address hasn't changed",
                    system="Submission System",
                    assignee_hint="Proposal Coordinator",
                    effort="15 min",
                ),
            ],
            risk_score=0.3,
            tags=["authority", "contact"],
        )

    def _new_requirement_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for newly added requirements/dependencies."""
        return DomainAlert(
            domain=AdapterDomain.RFP,
            title=f"New requirement added: {event.entity.path}",
            severity="HIGH",
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                f"New requirement or prerequisite added ({event.shift.value}). "
                f"Evaluate feasibility and update proposal accordingly. "
                f"Detail: {event.after.value}"
            ),
            affected_systems=["Compliance Matrix", "Technical Proposal", "Cost Estimate"],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Assess ability to meet new requirement",
                    system="Technical Review",
                    assignee_hint="Subject Matter Expert",
                    effort="2 hours",
                ),
                RemediationStep(
                    priority=2,
                    action="Update compliance matrix and proposal sections",
                    system="Proposal Document",
                    assignee_hint="Proposal Writer",
                    effort="3 hours",
                ),
            ],
            risk_score=0.7,
            tags=["new-requirement", "amendment"],
        )

    def _generic_rfp_alert(self, event: ChangeEvent) -> DomainAlert:
        """Generic RFP alert."""
        return DomainAlert(
            domain=AdapterDomain.RFP,
            title=f"RFP change detected: {event.entity.path}",
            severity=event.severity.value,
            entity=event.entity.path,
            shift=event.shift.value,
            summary=event.reasoning,
            affected_systems=["Proposal Team"],
            remediation=[],
            risk_score=0.2,
            tags=["informational"],
        )

    def _build_summary(self, alerts: list[DomainAlert], critical: int, high: int) -> str:
        """Build executive summary."""
        if not alerts:
            return "No procurement-relevant changes detected."

        parts = [f"Detected {len(alerts)} procurement-relevant change(s)."]
        if critical:
            parts.append(f"{critical} CRITICAL — immediate action required (likely deadline changes).")
        if high:
            parts.append(f"{high} HIGH priority — review before next proposal milestone.")

        return " ".join(parts)
