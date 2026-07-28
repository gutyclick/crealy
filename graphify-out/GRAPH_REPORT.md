# Graph Report - .  (2026-07-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 57 nodes · 89 edges · 10 communities (6 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9

## God Nodes (most connected - your core abstractions)
1. `DesignSystemGenerator` - 11 edges
2. `search()` - 9 edges
3. `_search_csv()` - 8 edges
4. `generate_design_system()` - 8 edges
5. `BM25` - 7 edges
6. `persist_design_system()` - 6 edges
7. `_generate_intelligent_overrides()` - 5 edges
8. `search_stack()` - 4 edges
9. `format_page_override_md()` - 4 edges
10. `_load_csv()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `_generate_intelligent_overrides()` --calls--> `search()`  [EXTRACTED]
  .codex/skills/ui-ux-pro-max/scripts/design_system.py → .codex/skills/ui-ux-pro-max/scripts/core.py

## Import Cycles
- None detected.

## Communities (10 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (12): detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search stack-specific guidelines, search() (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.28
Nodes (5): BM25, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, BM25 ranking algorithm for text search

### Community 2 - "Community 2"
Cohesion: 0.33
Nodes (6): _detect_page_type(), format_page_override_md(), _generate_intelligent_overrides(), Detect page type from context and search results., Format a page-specific override file with intelligent AI-generated content., Generate intelligent overrides based on page type using layered search. Uses…

### Community 3 - "Community 3"
Cohesion: 0.38
Nodes (6): format_ascii_box(), format_markdown(), generate_design_system(), Format design system as ASCII box with emojis (MCP-style)., Format design system as markdown., Main entry point for design system generation. Args: query: Search query (e.g.,…

### Community 4 - "Community 4"
Cohesion: 0.50
Nodes (3): DesignSystemGenerator, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV.

### Community 7 - "Community 7"
Cohesion: 0.50
Nodes (4): format_master_md(), persist_design_system(), Persist design system to design-system/<project>/ folder using Master +…, Format design system as MASTER.md with hierarchical override logic.

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DesignSystemGenerator` connect `Community 4` to `Community 3`, `Community 5`, `Community 6`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.284) - this node is a cross-community bridge._
- **Why does `search()` connect `Community 0` to `Community 8`, `Community 2`, `Community 3`, `Community 6`?**
  _High betweenness centrality (0.257) - this node is a cross-community bridge._
- **Why does `_search_csv()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._