# Automotive Intelligence Command Center MVP

## Product outcome
Build a connected, locally runnable demonstration application for automotive operations. It will use one deterministic synthetic dataset to power its KPIs, charts, traceability, analytical answers, agents, workflows, pipeline runs, audit history, and reports. The product will clearly identify synthetic data and simulated execution and will not imply Force Motors endorsement or real factory operations.

## Implementation plan
1. **Establish the shared foundation**
   - Keep the existing TanStack Start, React, TypeScript, Tailwind, shadcn/ui, and Recharts stack; do not replace it with the brief's preferred Next.js stack.
   - Create typed automotive domain models, a deterministic relational seed generator, repository/query functions, tested KPI calculations, and a resettable local demonstration state.
   - Include the seeded quality incident with linked inspections, component lots, suppliers, production orders, shifts, and vehicle builds, plus comparison batches.

2. **Build the connected product shell and priority journey**
   - Replace the placeholder home page with the Executive Command Center, a compact collapsible navigation, persistent Demonstration Environment and synthetic-data indicators, configurable display identity, and the uploaded PibyThree logo as a small app mark.
   - Build the primary quality investigation experience first: alert details, affected-versus-comparison analysis, linked evidence and traceability, investigation timeline, ranked non-conclusive hypotheses, recommended checks, and printable report.
   - Add working manufacturing and supply-chain views with filters, record drill-downs, and shared calculations.

3. **Complete the demonstration modules**
   - Add the AI Intelligence Room with deterministic supported-query handlers and evidence links, using multiple browser-local conversation threads with thread-specific URLs and reload-safe history.
   - Add analytical agent runs with visible steps, inputs, evidence, results, errors, and run history; label them as simulated analytical functions.
   - Add executable, resettable workflows that update alerts and audit/activity history; add a pipeline simulation that validates actual seeded rows and reports counts, failures, lineage, and run logs.
   - Add provider-neutral cloud architecture and synthetic cost estimates, governance and demonstration role-aware navigation, guided demo mode, and report printing/PDF via the browser print dialog.

4. **Verify and document**
   - Add focused tests for KPI formulas, seeded traceability, pipeline validation, and workflow state changes; run relevant tests and the project's lint/build checks.
   - Exercise key user journeys, including a supported and unsupported analytical question, agent run, workflow run, pipeline run, thread reload, guided-demo reset, and responsive layouts.
   - Replace the starter README with setup, data/reset guidance, implemented-versus-simulated boundaries, and a concise architecture diagram. Include the requested ten-slide executive presentation outline and five-to-seven-minute demo script in project documentation.
   - Give every content route its own app-specific title and description metadata; set the favicon from the uploaded logo.

## Technical details
- Use the current TanStack Start file-route structure and semantic design tokens; keep business logic outside presentation files.
- Keep the baseline independent of Lovable Cloud, customer credentials, external APIs, and paid services. Chat history and resettable demo activity remain local to the browser.
- Use stable seeded identifiers and explicit reporting windows/formulas; unsupported questions and unavailable metrics must state their limitations instead of inventing values.
- Keep the brand independent: small PibyThree app mark only, with no Force Motors marks or claims of endorsement.
