# Architecture

- All public buyer views reuse ImportersDirectory with optional country restrictions; this keeps search, privacy masking, and company details consistent.
- Keep regional trade commentary out of the shared directory; public views focus on company records and keep filters in a collapsible panel.
- Keep Russian interface labels in a shared translation dictionary, with explicit translations for dynamic labels, so directory views use consistent terminology without changing original company records.
- Select directory languages by page scope and reset Russian to English when leaving its supported page; this prevents unsupported language state from carrying across navigation.
