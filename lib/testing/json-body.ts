/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md.
 */

/**
 * Domain values → JSON.parse(JSON.stringify) wire shape (`Date` → ISO string).
 * Use when a Query/schema/`NextResponse.json` suite needs the HTTP body, not
 * the in-memory factory row.
 */
export const jsonBody = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value));
