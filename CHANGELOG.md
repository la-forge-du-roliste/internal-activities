# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-05

### Added

- Mark D&D5e activities as internal and hide them from the multiple-activity choice dialog.
- Preserve normal Item use and explicit execution through `activity.use()`, macros, Midi-QOL, SC – More Activities, and other automations.
- Add a GM-only eye button to manage internal activities from the Item activity list.
- Expose public read and write API methods for integrations and macros.
- Validate, normalize, and clean Item flags, including identifiers for deleted activities.
- Serialize local writes per Item to prevent concurrent local updates from overwriting one another.
- Provide English and French translations.
- Support Foundry VTT V14 and D&D5e 5.3, tested with D&D5e 5.3.3.

[1.1.0]: https://github.com/theorikkdk/internal-activities/releases/tag/v1.1.0
