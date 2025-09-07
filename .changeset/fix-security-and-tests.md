---
"turborepo-template-upgrade": patch
---

Fix security vulnerabilities and improve test maintainability

- Fix CWE-117 log injection vulnerability in config.ts by sanitizing log output
- Update test mocks to include execFileSync alongside execSync for proper testing
- Refactor CLI tests to eliminate code duplication and improve maintainability
- Add proper TypeScript interfaces and error handling for CLI argument parsing
- Add validation for numeric inputs in CLI options