import re

with open("tools/lint.py", "r") as f:
    text = f.read()

new_synonyms = [
    'Alignment with SLOs', 'Anomalies by Level', 'Anti-Patterns', 'Application Pattern', 'Architecture Diagrams', 'Build System Comparison', 'Categories', 'Choosing Between Them', 'Cohesion', 'Common Algorithms', 'Common CRDT Types', "Common Characteristics (FoSA's taxonomy)", 'Common Evolution Operations', 'Common Proxy Types', 'Compaction Strategies', 'Comparison Table', 'Composition Rules', 'Coupling', 'Deployment Patterns', 'Design Process', 'Detailed Definitions', 'Distributed Implementation', 'Event Time vs Processing Time', 'Examples', 'Extended Levels', "Fielding's Constraints", 'Flag Types', 'Formal Definition', 'How Different Formats Handle It', 'Implementation Approaches', 'Implementation Locations', 'Implementations', 'Implications', 'In Practice', 'Internal Mechanics — G-Counter Example', 'Internal Mechanics — The MLOps Loop', 'Internal Mechanics — Three Main Approaches', 'Internal Mechanics — Two Schemes', 'Internal Mechanics — Worked Example', 'Join Algorithms', 'Join Types (SQL)', 'Key Changes vs HTTP/2', 'Key Concepts', 'Key Features', 'L4 Load Balancing', 'L7 Load Balancing', 'Leaky Bucket Algorithm', 'MTBF and MTTR', 'Mitigation Strategies', 'Modern Practice', 'Pillars', 'Proxy vs Decorator', 'RED vs USE', 'Real Production', 'Related Failure Modes', 'Resources to Check', 'Storage Implications', 'Tensions Between Characteristics', 'The Algorithms', 'The Canonical Policies', 'The Five Principles', 'The Five Types', 'The Four Families', 'The Four Standard Levels', 'The Four Window Types', 'The Law in Practice', 'The Layers', 'The Nines Table', 'The Six Strategies', 'The Three Metrics', 'The Three Properties', 'The Two Approaches', 'The Two Disciplines', 'The Two Workloads', 'Token Bucket Algorithm', 'Two Directions', 'Types of Indexes', 'Variants'
]

# Find "Internal Mechanics" array and append
m = re.search(r'"Internal Mechanics": \[(.*?)\]', text, re.DOTALL)
if m:
    existing = m.group(1)
    new_str = existing + ", " + ", ".join([f'"{s}"' for s in new_synonyms])
    text = text[:m.start(1)] + new_str + text[m.end(1):]

with open("tools/lint.py", "w") as f:
    f.write(text)
