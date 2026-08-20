# Runtime V4 v0.3.1 adoption

## Decision

SALIDA CyL pins `agent-orchestration-starter` v0.3.1 at commit
`ae1640e2a7d6151bc6a331be62c6e196d7852c66`. The repository remains
`BOUNDED_LOCAL`; Runtime V4 is activated only for analysis and configuration
readiness. Publication stays disabled.

The earlier analysis branch based on v0.2.0 is historical and must not be
cherry-picked: its installation and activation hashes describe a different
runtime and repository state.

## Adopted locally

- NAN batch concurrency defaults to one. An explicit override up to five is
  retained for independently justified workloads.
- Failed validations carry a command hash, validation class and normalized
  failure signature. Raw validation commands are not copied into diagnostics.
- `lint` and `format` failures create bounded, hash-bound repair packets before
  Frontier review and relaunch one fresh NAN context when budget remains.
- A repeated static-quality signature terminates as `NO_PROGRESS`.
- Tests, build, data and other deterministic failures continue to require an
  independent Frontier `ACCEPT`, `RETRY` or `ESCALATE` decision.

## Explicitly not enabled

- isolated or certified execution;
- autonomous dispatch or publication;
- signed delegation provenance or `REQUIRED` enforcement;
- broker-owned commit, push, pull request or deployment;
- secrets, signing keys or provider credentials in the repository.

The analysis activation may report missing host composition, sandbox,
credential-isolation or capability evidence. Those are expected warnings and
must never be interpreted as execution authority.

The generated `.codex/config.toml` MCP binding is deliberately not retained:
the analysis installation has no trusted host driver and `runtime doctor`
returns `CAPABILITY_UNVERIFIED`. Reintroduce the managed MCP binding only as
part of a separately authorized and certified host activation.

## Activation inputs

- Repository policy: `policies/repository-policy.yaml`
- Runtime profile: `profiles/runtime-2026-08-16.yaml`
- Target: `ANALYSIS_ONLY`
- Runtime source: v0.3.1 / `ae1640e2a7d6151bc6a331be62c6e196d7852c66`
- Installation hash: `dc6738a8e8f6dad24f0f9d9d5df13819e7756e1d0cd553b8ba0fbef99fb97b1a`
- Activation hash: `277ce2ab6a8af496a4654d2760e1ae741a65bf673769e75df660fa1a3be085b1`
- Host composition hash: `null` (no certified execution host)
- Publication: disabled in repository policy and local PowerShell supervisor

Changing the runtime, profile, policy, model binding, harness or host
composition requires a new installation/activation identity and a fresh
readiness report.
