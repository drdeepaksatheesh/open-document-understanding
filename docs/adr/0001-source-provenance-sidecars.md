# ADR 0001: SHA-256 source identity and local provenance sidecars

- Status: Accepted
- Milestone: v0.0.2

## Context

Future Translate, Explain and Ask outputs must remain traceable to the exact source passage that produced them. The v0.0.1 reader used a fast non-cryptographic fingerprint suitable only for UI restoration and stored one last anchor in web storage.

That is insufficient for durable provenance because it does not provide a strong document identity, does not support multiple records, and would encourage later AI features to invent their own persistence model.

## Decision

1. Identify the complete source document by SHA-256 of its bytes.
2. Normalize a selected source quote and identify that quote by SHA-256 as well.
3. Store page, PDF text-item range and character offsets in the source anchor.
4. If stored PDF text-item boundaries no longer reproduce the exact quote, search the page text layer for the same normalized quote and recover the highlight range.
5. Store document-associated provenance in a versioned JSON sidecar keyed by document SHA-256.
6. In the installed Tauri application, write sidecars to the application's data directory rather than modifying the PDF or writing beside a potentially read-only/copyrighted source file.
7. Reserve the same sidecar record model for future `translate`, `explain`, `ask` and `verify` operations.
8. Keep the browser-only development fallback in localStorage, but do not treat browser localStorage as the desktop durability mechanism.

## Consequences

### Positive

- the original document remains byte-for-byte untouched;
- provenance is tied to a strong document identity;
- multiple source/AI records can coexist;
- future AI features inherit a provenance structure instead of adding one later;
- application upgrades can evolve the sidecar independently through schema versions.

### Trade-offs

- SHA-256 adds a small local hashing delay when opening very large PDFs;
- sidecars are currently local to the application installation and are not portable/exportable yet;
- exact restoration still depends on PDF text extraction quality;
- scanned/image-only PDFs require the later OCR anchoring design.

## Explicit non-decision

A sidecar containing a translation or explanation is not automatically safe to redistribute merely because the original PDF is absent. Copyright/licensing policy for exported/shared sidecars remains a separate product/legal decision.
