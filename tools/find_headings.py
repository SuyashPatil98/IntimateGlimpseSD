import re
from pathlib import Path

files = [
    "Architecture Characteristics", "Architecture Fitness Functions", "Availability Math", "BASE", 
    "Backward and Forward Compatibility", "Beyoncé Rule", "Build Systems", "CRDTs", "Cache Stampede", 
    "Cache Strategies", "Compaction", "Dependency Management", "Distributed Transactions", 
    "Domain-Driven Design", "ETL vs ELT", "Eviction Policies", "Factory", "Feature Flags", 
    "First Principles of SE", "HTTP-3", "Hybrid Logical Clocks", "Hyrum's Law", "Idempotency", "Indexes", 
    "Isolation Levels", "Joins", "L4 vs L7 Load Balancing", "Load Balancing Algorithms", "Logical Clocks", 
    "MLOps", "Modularity", "NoSQL", "OLTP vs OLAP", "Proxy", "RED Method", "REST", "Rate Limiting", 
    "SOLID", "Schema Evolution", "Serializability", "Stream Windowing", "Test Doubles", "Testing Pyramid", 
    "Token Bucket", "USE Method", "Vector Clocks"
]

out = set()
for md in Path("knowledge/SystemDesign").rglob("*.md"):
    if md.stem in files:
        text = md.read_text()
        headers = [m.group(1).strip() for m in re.finditer(r"^##\s+(.+)$", text, re.MULTILINE)]
        for h in headers:
            if h not in ["Executive Summary", "Why This Exists", "Core Intuition", "Design Tradeoffs", "Real Production Examples", "Interview Perspective", "Related Concepts", "Misconceptions", "Failure Scenarios", "Practical Engineering Heuristics", "Active Recall Questions", "Feynman Test", "Mastery Checklist"]:
                out.add(h)

print(sorted(list(out)))
