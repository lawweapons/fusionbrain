// Minimal flat config — Next 16's `next/core-web-vitals` + `next/typescript`
// presets are not compatible with ESLint 9.x via FlatCompat (circular config
// JSON error). Keeping this as a no-op until the broader lint stack is
// rewritten with @typescript-eslint flat configs directly. Typecheck still
// runs in CI and catches the issues that matter day-to-day.
export default [
  { ignores: ["ingest/**", ".next/**", "node_modules/**", "**/*.d.ts"] },
];
