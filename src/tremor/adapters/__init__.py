"""Domain Adapters — pluggable vertical intelligence on top of the generic change engine."""

from tremor.adapters.base import (
    AdapterDomain,
    BaseAdapter,
    DomainAlert,
    DomainAnalysis,
    register_adapter,
)
from tremor.adapters.iga import IGAAdapter
from tremor.adapters.rfp import RFPAdapter

# Register adapters on import
register_adapter(IGAAdapter())
register_adapter(RFPAdapter())

__all__ = [
    "AdapterDomain",
    "BaseAdapter",
    "DomainAlert",
    "DomainAnalysis",
    "IGAAdapter",
    "RFPAdapter",
]
