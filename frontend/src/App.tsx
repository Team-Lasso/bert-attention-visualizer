import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AttentionVisualizerPage from "./components/AttentionVisualizerPage";
import AboutPage from "./components/AboutPage";
import ModelComparisonPage from "./components/ModelComparisonPage";


function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Router>
        <Routes>
          <Route path="/" element={<AttentionVisualizerPage datasets={[]} />} />
          <Route path="/compare" element={<ModelComparisonPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
