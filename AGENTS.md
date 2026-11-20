# Architecture

- All public buyer views reuse ImportersDirectory with optional country restrictions; this keeps search, privacy masking, and company details consistent.
- Keep regional trade commentary out of the shared directory; public views focus on company records and keep filters in a collapsible panel.
- Keep Russian interface labels in a shared translation dictionary, with explicit translations for dynamic labels, so directory views use consistent terminology without changing original company records.
- Select directory languages by page scope and reset Russian to English when leaving its supported page; this prevents unsupported language state from carrying across navigation.
- Keep Central Asia's visual identity in a presentation-only module and scoped CSS tokens; shared directory search, filters, and records remain unchanged across regions.
- Keep uploaded Central Asia records in a separately bundled server-read dataset selected only by the Central Asia page scope; never overwrite shared importer records, and preserve product provenance in public results.
