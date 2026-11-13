# Navigation Design

- Input: Application entry and navigation actions.
- Output: Product views without creator About navigation.
- Code: frontend/src/App.tsx, frontend/src/components/GuidePage.tsx, frontend/src/components/layout/AppHeader.tsx, frontend/src/components/layout/InfoPanel.tsx.
- Implementation: Navigation uses Guide instead of About. Model, token, masking and visualization explanations and research references are preserved. The former /about address redirects to /guide.
- Spec: [Navigation](../../specs/app/10-navigation.md).
- Architecture: [Overview](../../architecture/10-overview.md).
- Scenarios: [Navigation](../../testing/scenarios/app/10-navigation.md).

## Example
- Input: BERT Attention Visualizer.
- Steps: Open /about, then follow Back to Visualizer.
- Expected result: The address is replaced by /guide, the guide content remains available and the visualizer is reachable.
