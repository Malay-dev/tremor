"""IGA Adapter — Identity Governance & Administration impact analysis.

Translates generic ChangeEvents into IGA-specific alerts:
- Connector attribute mapping failures
- Provisioning rule breakage
- Correlation key changes
- Access decision impacts
- Lifecycle workflow disruptions

Targets: SailPoint, Saviynt, Okta, Microsoft Entra
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
    EntityKind,
    SemanticShift,
    Severity,
)

# Fields commonly used in IGA connectors
_IGA_SENSITIVE_FIELDS = {
    "status", "isactive", "is_active", "active", "enabled", "disabled",
    "email", "mail", "username", "login", "samaccountname",
    "department", "title", "jobtitle", "job_title",
    "manager", "managerid", "manager_id",
    "employeetype", "employee_type", "usertype", "user_type",
    "startdate", "start_date", "enddate", "end_date", "terminationdate",
    "role", "roles", "groups", "entitlements", "permissions",
    "firstname", "first_name", "lastname", "last_name", "displayname",
    "phone", "mobile", "address", "location", "office",
    "costcenter", "cost_center", "division", "company",
}

# Shift types that are critical in IGA context
_IGA_BREAKING_SHIFTS = {
    SemanticShift.BREAKING_REMOVAL,
    SemanticShift.TYPE_CHANGED,
    SemanticShift.STATE_SPACE_CONTRACTED,
    SemanticShift.BEHAVIOR_INVERSION,
}

_IGA_WARNING_SHIFTS = {
    SemanticShift.STATE_SPACE_EXPANDED,
    SemanticShift.NULLABILITY_CHANGED,
    SemanticShift.CARDINALITY_CHANGED,
    SemanticShift.SEMANTIC_RENAME,
}


class IGAAdapter(BaseAdapter):
    """Adapter for Identity Governance & Administration systems."""

    domain = AdapterDomain.IGA

    def is_relevant(self, event: ChangeEvent) -> bool:
        """An event is IGA-relevant if it touches identity-related fields or auth."""
        # Auth changes are always IGA-relevant
        if event.category == ChangeCategory.SECURITY:
            return True

        # Check if the entity path contains IGA-sensitive fields
        field_name = event.entity.path.split(".")[-1].lower()
        if field_name in _IGA_SENSITIVE_FIELDS:
            return True

        # Any breaking change to an API object is relevant
        if event.shift in _IGA_BREAKING_SHIFTS and event.entity.kind in (
            EntityKind.FIELD,
            EntityKind.ENDPOINT,
            EntityKind.OBJECT,
        ):
            return True

        # Deprecations are relevant (plan ahead)
        return event.shift == SemanticShift.DEPRECATION_ANNOUNCED

    def analyze(self, events: list[ChangeEvent]) -> DomainAnalysis:
        """Produce IGA-specific analysis with connector impact and remediation."""
        alerts: list[DomainAlert] = []

        for event in events:
            alert = self._event_to_alert(event)
            if alert:
                alerts.append(alert)

        # Sort by severity
        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
        alerts.sort(key=lambda a: severity_order.get(a.severity, 5))

        critical = sum(1 for a in alerts if a.severity == "CRITICAL")
        high = sum(1 for a in alerts if a.severity == "HIGH")

        summary = self._build_summary(alerts, critical, high)

        return DomainAnalysis(
            domain=AdapterDomain.IGA,
            total_events=len(events),
            critical_count=critical,
            high_count=high,
            alerts=alerts,
            executive_summary=summary,
        )

    def _event_to_alert(self, event: ChangeEvent) -> DomainAlert | None:
        """Convert a ChangeEvent to an IGA-specific DomainAlert."""
        field_name = event.entity.path.split(".")[-1].lower()

        # Determine IGA-specific context
        if field_name in ("status", "isactive", "is_active", "active", "enabled"):
            return self._lifecycle_field_alert(event)
        elif field_name in ("email", "mail", "username", "login", "samaccountname"):
            return self._correlation_field_alert(event)
        elif field_name in ("role", "roles", "groups", "entitlements", "permissions"):
            return self._entitlement_field_alert(event)
        elif field_name in ("department", "title", "manager", "employeetype", "division"):
            return self._governance_field_alert(event)
        elif event.category == ChangeCategory.SECURITY:
            return self._auth_change_alert(event)
        elif event.shift == SemanticShift.DEPRECATION_ANNOUNCED:
            return self._deprecation_alert(event)
        elif event.shift in _IGA_BREAKING_SHIFTS:
            return self._generic_breaking_alert(event)
        else:
            return self._generic_iga_alert(event)

    # ─── Alert generators by field type ──────────────────────────────────────

    def _lifecycle_field_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for changes to account lifecycle fields (status, isActive)."""
        remediation = []

        if event.shift == SemanticShift.STATE_SPACE_EXPANDED:
            remediation = [
                RemediationStep(
                    priority=1,
                    action=f"Update connector attribute mapping to handle new states: {event.after.value}",
                    system="SailPoint IdentityNow / Saviynt",
                    assignee_hint="IAM Engineering",
                    effort="2–4 hours",
                ),
                RemediationStep(
                    priority=2,
                    action="Add transformation rules for new states → enable/disable/suspend decisions",
                    system="Provisioning Policy",
                    assignee_hint="IAM Engineering",
                    effort="1–2 hours",
                ),
                RemediationStep(
                    priority=3,
                    action="Update lifecycle workflows (JML) to handle new state transitions",
                    system="Lifecycle Manager",
                    assignee_hint="IAM Ops",
                    effort="4 hours",
                ),
                RemediationStep(
                    priority=4,
                    action="Add monitoring for unhandled states in provisioning logs",
                    system="SIEM / Splunk",
                    assignee_hint="Security Operations",
                    effort="30 min",
                ),
            ]
        elif event.shift == SemanticShift.TYPE_CHANGED:
            remediation = [
                RemediationStep(
                    priority=1,
                    action=f"Rewrite connector transformation: {event.before.value} → {event.after.value}",
                    system="Connector Attribute Mapping",
                    assignee_hint="IAM Engineering",
                    effort="2 hours",
                ),
                RemediationStep(
                    priority=2,
                    action="Update all provisioning rules referencing this field's old type",
                    system="Provisioning Policy Engine",
                    assignee_hint="IAM Engineering",
                    effort="3 hours",
                ),
            ]
        elif event.shift == SemanticShift.BREAKING_REMOVAL:
            remediation = [
                RemediationStep(
                    priority=1,
                    action="URGENT: Identify replacement field or alternative lifecycle signal",
                    system="Vendor API Documentation",
                    assignee_hint="IAM Engineering",
                    effort="1 hour",
                ),
                RemediationStep(
                    priority=2,
                    action="Disable provisioning rules depending on removed field to prevent errors",
                    system="Provisioning Policy",
                    assignee_hint="IAM Ops",
                    effort="30 min",
                ),
                RemediationStep(
                    priority=3,
                    action="Implement temporary manual lifecycle process until connector is updated",
                    system="Service Desk",
                    assignee_hint="IAM Ops",
                    effort="Ongoing",
                ),
            ]

        return DomainAlert(
            domain=AdapterDomain.IGA,
            title=f"Lifecycle field changed: {event.entity.path}",
            severity=event.severity.value,
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                f"Account lifecycle field '{event.entity.path}' changed ({event.shift.value}). "
                f"This directly affects enable/disable provisioning decisions. "
                f"Before: {event.before.value} → After: {event.after.value}"
            ),
            affected_systems=[
                "Provisioning Connector",
                "Lifecycle Workflows (JML)",
                "Access Certification",
                "Audit Reports",
            ],
            remediation=remediation,
            risk_score=0.9 if event.severity in (Severity.CRITICAL, Severity.HIGH) else 0.6,
            tags=["lifecycle", "provisioning", "breaking" if event.shift in _IGA_BREAKING_SHIFTS else "warning"],
        )

    def _correlation_field_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for changes to identity correlation fields (email, username)."""
        return DomainAlert(
            domain=AdapterDomain.IGA,
            title=f"Correlation key changed: {event.entity.path}",
            severity=event.severity.value,
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                f"Identity correlation field '{event.entity.path}' changed ({event.shift.value}). "
                f"This may break account matching between systems. "
                f"Orphaned accounts or duplicate identities may result."
            ),
            affected_systems=[
                "Identity Correlation Engine",
                "Account Aggregation",
                "Joiner Process",
                "Access Reviews",
            ],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Verify correlation rule still resolves identities correctly",
                    system="Correlation Config",
                    assignee_hint="IAM Engineering",
                    effort="1 hour",
                ),
                RemediationStep(
                    priority=2,
                    action="Run test aggregation and check for orphan/duplicate accounts",
                    system="Identity Governance Platform",
                    assignee_hint="IAM Ops",
                    effort="2 hours",
                ),
                RemediationStep(
                    priority=3,
                    action="Update correlation rule if field name or format changed",
                    system="Source Configuration",
                    assignee_hint="IAM Engineering",
                    effort="1 hour",
                ),
            ],
            risk_score=0.8,
            tags=["correlation", "identity-matching"],
        )

    def _entitlement_field_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for changes to entitlement/role fields."""
        return DomainAlert(
            domain=AdapterDomain.IGA,
            title=f"Entitlement field changed: {event.entity.path}",
            severity=event.severity.value,
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                f"Entitlement/role field '{event.entity.path}' changed ({event.shift.value}). "
                f"Role assignments and access request catalogs may be affected. "
                f"Before: {event.before.value} → After: {event.after.value}"
            ),
            affected_systems=[
                "Access Request Catalog",
                "Role Model",
                "Entitlement Provisioning",
                "Certification Campaigns",
            ],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Audit role model for broken entitlement references",
                    system="Role/Entitlement Config",
                    assignee_hint="IAM Engineering",
                    effort="2 hours",
                ),
                RemediationStep(
                    priority=2,
                    action="Update access request catalog if entitlement names/values changed",
                    system="Access Request Portal",
                    assignee_hint="IAM Ops",
                    effort="1 hour",
                ),
            ],
            risk_score=0.75,
            tags=["entitlements", "access-control"],
        )

    def _governance_field_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for changes to governance fields (department, manager, etc)."""
        return DomainAlert(
            domain=AdapterDomain.IGA,
            title=f"Governance attribute changed: {event.entity.path}",
            severity=event.severity.value,
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                f"Governance attribute '{event.entity.path}' changed ({event.shift.value}). "
                f"May affect access policies, segregation of duties, and reporting."
            ),
            affected_systems=[
                "Access Policies (ABAC)",
                "Segregation of Duties",
                "Manager Certification",
                "Org-based Provisioning",
            ],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Review ABAC policies referencing this attribute",
                    system="Policy Engine",
                    assignee_hint="IAM Engineering",
                    effort="1 hour",
                ),
                RemediationStep(
                    priority=2,
                    action="Verify SoD rules still evaluate correctly with new field contract",
                    system="SoD Engine",
                    assignee_hint="GRC Team",
                    effort="2 hours",
                ),
            ],
            risk_score=0.5,
            tags=["governance", "compliance"],
        )

    def _auth_change_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for authentication/security changes."""
        return DomainAlert(
            domain=AdapterDomain.IGA,
            title=f"Authentication change: {event.entity.path}",
            severity="CRITICAL",
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                f"Authentication mechanism changed ({event.shift.value}). "
                f"Connector authentication will fail if not updated immediately. "
                f"Before: {event.before.value} → After: {event.after.value}"
            ),
            affected_systems=[
                "All Connectors for this source",
                "Service Accounts",
                "Scheduled Aggregation Jobs",
                "Provisioning Operations",
            ],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Update connector authentication configuration immediately",
                    system="Source Connection Config",
                    assignee_hint="IAM Engineering",
                    effort="1 hour",
                ),
                RemediationStep(
                    priority=2,
                    action="Rotate service account credentials to new auth method",
                    system="Secret Management",
                    assignee_hint="IAM Ops",
                    effort="30 min",
                ),
                RemediationStep(
                    priority=3,
                    action="Test aggregation and provisioning with new auth",
                    system="Identity Platform",
                    assignee_hint="IAM Engineering",
                    effort="1 hour",
                ),
            ],
            risk_score=1.0,
            tags=["auth", "breaking", "urgent"],
        )

    def _deprecation_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for deprecated fields/endpoints."""
        return DomainAlert(
            domain=AdapterDomain.IGA,
            title=f"Deprecation notice: {event.entity.path}",
            severity="MEDIUM",
            entity=event.entity.path,
            shift=event.shift.value,
            summary=(
                f"'{event.entity.path}' is deprecated and will be removed in a future version. "
                f"Plan migration before removal causes connector failure."
            ),
            affected_systems=["Connector Attribute Mapping", "Transformation Rules"],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Identify replacement field in vendor documentation",
                    system="Vendor API Docs",
                    assignee_hint="IAM Engineering",
                    effort="30 min",
                ),
                RemediationStep(
                    priority=2,
                    action="Schedule connector update in next maintenance window",
                    system="Change Management",
                    assignee_hint="IAM Ops",
                    effort="Plan: 1 sprint",
                ),
            ],
            risk_score=0.4,
            tags=["deprecation", "plan-ahead"],
        )

    def _generic_breaking_alert(self, event: ChangeEvent) -> DomainAlert:
        """Alert for any other breaking change."""
        return DomainAlert(
            domain=AdapterDomain.IGA,
            title=f"Breaking change: {event.entity.path}",
            severity=event.severity.value,
            entity=event.entity.path,
            shift=event.shift.value,
            summary=f"Breaking change detected: {event.reasoning}",
            affected_systems=["Connector", "Provisioning Rules"],
            remediation=[
                RemediationStep(
                    priority=1,
                    action="Assess connector compatibility with the change",
                    system="Source Configuration",
                    assignee_hint="IAM Engineering",
                    effort="1–2 hours",
                ),
            ],
            risk_score=0.7,
            tags=["breaking"],
        )

    def _generic_iga_alert(self, event: ChangeEvent) -> DomainAlert:
        """Generic IGA alert for relevant but non-critical changes."""
        return DomainAlert(
            domain=AdapterDomain.IGA,
            title=f"API change detected: {event.entity.path}",
            severity=event.severity.value,
            entity=event.entity.path,
            shift=event.shift.value,
            summary=event.reasoning,
            affected_systems=["Monitor"],
            remediation=[],
            risk_score=0.2,
            tags=["informational"],
        )

    def _build_summary(self, alerts: list[DomainAlert], critical: int, high: int) -> str:
        """Build executive summary."""
        if not alerts:
            return "No IGA-relevant changes detected."

        parts = [f"Detected {len(alerts)} IGA-relevant change(s)."]
        if critical:
            parts.append(f"{critical} CRITICAL requiring immediate action.")
        if high:
            parts.append(f"{high} HIGH priority items for this sprint.")

        # Highlight most important
        top = alerts[0]
        parts.append(f"Top concern: {top.title}")

        return " ".join(parts)
