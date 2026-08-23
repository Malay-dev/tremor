"""Mock data for demo mode — returns realistic responses without external calls."""

MOCK_VERSIONS = {
    "salesforce": [
        {"file": "accounts-v3.html", "status": "old"},
        {"file": "accounts-v4.html", "status": "previous"},
        {"file": "account-v5.html", "status": "new"},
    ],
    "sam.gov": [
        {"file": "solicitation-v1.html", "status": "old"},
        {"file": "amendment-001.html", "status": "previous"},
        {"file": "amendment-002.html", "status": "new"},
    ],
    "stripe": [
        {"file": "charges-2024-12.html", "status": "old"},
        {"file": "charges-2025-06.html", "status": "previous"},
        {"file": "charges-2025-08.html", "status": "new"},
    ],
}

MOCK_SCRAPING = {
    "collector_id": "c_8f2a91b4",
    "mode": "real-time",
    "extraction_time_ms": 1847,
    "self_healed": False,
    "status": "healthy",
    "content_changed": True,
    "hash_before": "a3f8c1e7d2",
    "hash_after": "b9e4f21a8c",
    "content_size_before": 847,
    "content_size_after": 1204,
}

MOCK_ANALYSIS = {
    "salesforce": {
        "events_detected": 6,
        "processing_time_ms": 3241,
        "entities_extracted": 11,
        "endpoints_extracted": 3,
        "events": [
            {"shift": "BREAKING_REMOVAL", "entity": "auth_flows", "severity": "CRITICAL", "before": "API Key", "after": "OAuth 2.0", "confidence": 0.95},
            {"shift": "STATE_SPACE_EXPANDED", "entity": "User.status", "severity": "HIGH", "before": "BOOLEAN", "after": "ENUM(ACTIVE,INACTIVE,SUSPENDED)", "confidence": 0.95},
            {"shift": "NULLABILITY_CHANGED", "entity": "User.department", "severity": "HIGH", "before": "optional", "after": "required", "confidence": 0.9},
            {"shift": "NULLABILITY_CHANGED", "entity": "User.manager_id", "severity": "HIGH", "before": "optional", "after": "required", "confidence": 0.9},
            {"shift": "DEPRECATION_ANNOUNCED", "entity": "User.phone", "severity": "MEDIUM", "before": "active", "after": "deprecated", "confidence": 0.85},
            {"shift": "SCOPE_WIDENED", "entity": "POST /User/{id}/lifecycle", "severity": "INFO", "before": "absent", "after": "added", "confidence": 0.9},
        ],
    },
    "sam.gov": {
        "events_detected": 4,
        "processing_time_ms": 2890,
        "entities_extracted": 8,
        "endpoints_extracted": 0,
        "events": [
            {"shift": "TEMPORAL_SHIFT", "entity": "submission_deadline", "severity": "CRITICAL", "before": "2026-09-01", "after": "2026-08-25", "confidence": 0.95},
            {"shift": "DEPENDENCY_ADDED", "entity": "certification_required", "severity": "HIGH", "before": "none", "after": "ISO 27001 required", "confidence": 0.9},
            {"shift": "SCOPE_NARROWED", "entity": "eligible_vendors", "severity": "HIGH", "before": "all NAICS 541512", "after": "small business only", "confidence": 0.85},
            {"shift": "CONSTRAINT_ADDED", "entity": "budget_ceiling", "severity": "MEDIUM", "before": "$5M", "after": "$3.5M (reduced)", "confidence": 0.9},
        ],
    },
    "stripe": {
        "events_detected": 4,
        "processing_time_ms": 2150,
        "entities_extracted": 6,
        "endpoints_extracted": 4,
        "events": [
            {"shift": "DEPRECATION_ANNOUNCED", "entity": "POST /v1/charges", "severity": "HIGH", "before": "active", "after": "deprecated (use PaymentIntents)", "confidence": 0.95},
            {"shift": "BREAKING_REMOVAL", "entity": "source_field", "severity": "CRITICAL", "before": "string", "after": "removed", "confidence": 0.95},
            {"shift": "TYPE_CHANGED", "entity": "amount", "severity": "MEDIUM", "before": "integer (cents)", "after": "integer (minor units)", "confidence": 0.8},
            {"shift": "SCOPE_WIDENED", "entity": "POST /v1/payment_intents/confirm", "severity": "INFO", "before": "existing", "after": "new params added", "confidence": 0.85},
        ],
    },
}

MOCK_ALERTS = {
    "salesforce": {
        "domain": "IGA",
        "alerts": [
            {"title": "Auth flow removed", "severity": "CRITICAL", "entity": "auth_flows", "summary": "Connector authentication will fail immediately", "remediation": "Update connector auth to OAuth 2.0", "effort": "1 hour"},
            {"title": "Status field expanded", "severity": "HIGH", "entity": "User.status", "summary": "Provisioning rules won't handle SUSPENDED state", "remediation": "Update attribute mapping for new states", "effort": "2-4 hours"},
            {"title": "Department now required", "severity": "HIGH", "entity": "User.department", "summary": "Integrations not providing it will fail", "remediation": "Review ABAC policies referencing this attribute", "effort": "1 hour"},
            {"title": "Phone field deprecated", "severity": "MEDIUM", "entity": "User.phone", "summary": "Plan migration before removal", "remediation": "Schedule connector update in next maintenance", "effort": "1 sprint"},
        ],
    },
    "sam.gov": {
        "domain": "RFP",
        "alerts": [
            {"title": "Deadline moved up", "severity": "CRITICAL", "entity": "submission_deadline", "summary": "Submission deadline shortened by 7 days", "remediation": "Recalculate internal timeline immediately", "effort": "1 hour"},
            {"title": "New certification required", "severity": "HIGH", "entity": "certification_required", "summary": "ISO 27001 now mandatory for eligibility", "remediation": "Verify certification status, update compliance matrix", "effort": "2 hours"},
            {"title": "Eligibility narrowed", "severity": "HIGH", "entity": "eligible_vendors", "summary": "Now restricted to small business set-aside", "remediation": "Re-evaluate bid/no-bid decision", "effort": "30 min"},
            {"title": "Budget reduced", "severity": "MEDIUM", "entity": "budget_ceiling", "summary": "Contract ceiling reduced from $5M to $3.5M", "remediation": "Revise pricing strategy", "effort": "4 hours"},
        ],
    },
    "stripe": {
        "domain": "API",
        "alerts": [
            {"title": "Charges endpoint deprecated", "severity": "HIGH", "entity": "POST /v1/charges", "summary": "Migrate to PaymentIntents before removal", "remediation": "Update all charge creation flows to use PaymentIntents API", "effort": "1-2 days"},
            {"title": "Source field removed", "severity": "CRITICAL", "entity": "source_field", "summary": "Breaking change — field no longer accepted", "remediation": "Replace source with payment_method parameter", "effort": "4 hours"},
            {"title": "Amount unit clarification", "severity": "MEDIUM", "entity": "amount", "summary": "Now documented as minor units (may affect non-USD)", "remediation": "Verify currency handling in billing service", "effort": "2 hours"},
        ],
    },
}
