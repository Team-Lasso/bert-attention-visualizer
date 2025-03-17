import AttentionVisualizerPage from "./components/AttentionVisualizerPage";
// Remove the import for sample datasets
// import { sampleDatasets } from "./data/sampleData";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Start with an empty array instead of sample datasets */}
      <AttentionVisualizerPage datasets={[]} />
    </div>
  );
}

export default App;
