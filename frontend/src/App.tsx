import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AttentionVisualizerPage from "./components/AttentionVisualizerPage";
import GuidePage from "./components/GuidePage";
import ModelComparisonPage from "./components/ModelComparisonPage";


function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Router>
        <Routes>
          <Route path="/" element={<AttentionVisualizerPage datasets={[]} />} />
          <Route path="/compare" element={<ModelComparisonPage />} />
          <Route path="/about" element={<Navigate to="/guide" replace />} />
          <Route path="/guide" element={<GuidePage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
