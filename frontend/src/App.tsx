import AttentionVisualizer from './components/AttentionVisualizer';
import { sampleDatasets } from './data/sampleData';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <AttentionVisualizer datasets={sampleDatasets} />
    </div>
  );
}

export default App;