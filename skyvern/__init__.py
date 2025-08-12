import re
from ddtrace import tracer
from ddtrace.trace import TraceFilter, Span
from ddtrace.ext import http

# Keep package import lightweight to avoid heavy side effects at import time.
# Move logger setup and heavy imports to runtime modules.


class FilterHeartbeat(TraceFilter):
    _HB_URL = re.compile(r"http://.*/heartbeat$")

    def process_trace(self, trace: list[Span]) -> list[Span] | None:
        for span in trace:
            url = span.get_tag(http.URL)
            if span.parent_id is None and url is not None and self._HB_URL.match(url):
                return None
        return trace


tracer.configure(trace_processors=[FilterHeartbeat()])

# Do not import heavy submodules here; runtime modules will configure logging.

__all__ = []
