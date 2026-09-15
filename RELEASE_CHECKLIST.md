# Release validation checklist

A build is not a release merely because CI compiled it. This checklist defines the evidence required before calling a Windows milestone validated.

## Automated checks

- [ ] application/package/Tauri versions agree (`npm run check:version`)
- [ ] unit tests pass
- [ ] production web build passes
- [ ] dependency audit has no critical npm advisory
- [ ] Windows Tauri build succeeds
- [ ] exactly one NSIS installer is produced
- [ ] installer is larger than the minimum sanity threshold
- [ ] CI emits a SHA-256 checksum manifest beside the installer
- [ ] CI uploads the validated installer + checksum as one artifact

## Clean-machine Windows smoke test

Use a Windows machine/environment that is not the CI workspace and does not rely on developer tooling.

1. Install the generated NSIS `.exe`.
2. Launch Open Document Understanding from the installed application.
3. Confirm the displayed application version matches the release version.
4. Open a selectable-text PDF from local storage.
5. Confirm the document renders and remains selectable.
6. Select a source passage and confirm the right panel shows the exact source.
7. Change page/zoom, then use **Return to source** and confirm the source is restored/highlighted.
8. Close the application, reopen it, reopen the same PDF, and confirm the source record restores from the local sidecar.
9. Toggle dark mode, restart the application, and confirm the theme preference persists.
10. Confirm the application still displays **LOCAL ONLY** and that no online verification feature is present in this milestone.

## Evidence to record

For each validated milestone, record in the issue or release notes:

- CI run identifier;
- installer filename;
- installer SHA-256;
- clean-machine operating system;
- smoke-test result;
- known limitations.

Do not claim a clean-machine validation unless the GUI workflow was actually exercised.
