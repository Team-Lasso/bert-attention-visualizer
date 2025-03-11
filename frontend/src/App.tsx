import AttentionVisualizerPage from "./components/AttentionVisualizerPage";
import { sampleDatasets } from "./data/sampleData";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <AttentionVisualizerPage datasets={sampleDatasets} />
    </div>
  );
}

export default App;
