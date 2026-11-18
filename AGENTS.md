# Architecture

- All public buyer views reuse ImportersDirectory with optional country restrictions; this keeps search, privacy masking, and company details consistent.
- Keep regional trade commentary out of the shared directory; public views focus on company records and keep filters in a collapsible panel.
- Keep Russian interface labels in a shared translation dictionary, with explicit translations for dynamic labels, so directory views use consistent terminology without changing original company records.
- Show the shared Korean/English/Russian selector on public buyer directories, except the Vietnam-specific selector; language availability must not depend on the current language or regional URL.
