# loops

Use this command to force a completion loop for any feature request.

When I ask for a feature with `/loops`, follow this process and do not stop early:

1. Understand the feature request and inspect the codebase for the correct integration points.
2. For **Digital Detox Timer**, read `.cursor/prompts/digital-detox-timer-build.md` and work the active milestone with review gates.
3. Implement the feature end-to-end (not partial scaffolding).
4. Run relevant validation (build, tests, lint, typecheck, or project-specific checks).
5. If any check fails, fix and re-run checks in a loop until they pass.
6. Verify behavior against the requested acceptance criteria.
7. After each milestone: self-review, then run **Bugbot** subagent for code quality.
8. Ensure the branch is in a PR-ready state:
   - no TODO placeholders for core feature logic,
   - no known failing checks caused by your changes,
   - clear summary of what was changed and how to verify.
9. Stop only when the feature is fully complete and ready for me to push and open a PR.

Execution rules:
- Be proactive and autonomous. Do not stop at analysis-only unless blocked by missing requirements.
- Follow Adaptive Orchestrator principles: read context, plan, implement, test, learn.
- Use subagents where useful (adaptive-orchestrator for planning, bugbot for code review), but keep ownership of final integration and validation.
- If blocked, state the exact blocker and the minimum input needed to continue.
