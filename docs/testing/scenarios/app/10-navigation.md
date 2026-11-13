# Navigation Scenarios

- Design: [Navigation](../../../design/app/10-navigation.md).

## Navigation Without About
- Input: BERT Attention Visualizer.
- Steps: Open /about, then follow Back to Visualizer.
- Expected result: The address is replaced by /guide, the guide content remains available and the visualizer is reachable.
- Verification 2026-11-13: Production build passed. Headless Edge verified /about redirects to /guide and models, masking, research references and return navigation remain available.
