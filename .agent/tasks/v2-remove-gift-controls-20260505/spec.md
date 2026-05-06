# Task Spec: v2-remove-gift-controls-20260505

## Goal
Remove the V2 owner-facing Gift Controls section and its mutation behavior because the controls are not needed for the current owner settings experience.

## Acceptance Criteria
- AC1: List Settings no longer renders the Gift Controls section or toggle controls.
- AC2: List Settings PATCH no longer accepts or updates gift-control flags.
- AC3: Create List no longer exposes or submits gift-control flags.
- AC4: V2 contribution checkout no longer blocks based on a hidden per-list `allow_contributions` flag.
- AC5: Existing database columns/defaults remain untouched for compatibility.
- AC6: Lint, typecheck, build, and unit tests pass or failures are documented.
