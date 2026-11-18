# Architecture

- All public buyer views reuse ImportersDirectory with optional country restrictions; this keeps search, privacy masking, and company details consistent.
- Keep regional trade commentary out of the shared directory; public views focus on company records and keep filters in a collapsible panel.
