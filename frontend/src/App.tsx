import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

import { AnalysisPage } from './pages/AnalysisPage';
import { ResultPage } from './pages/ResultPage';
import { ShowcasePage } from './pages/ShowcasePage';

function App() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 border-b border-hairline bg-canvas px-6 py-3 text-nav-link">
        <Link to="/" className="text-ink">
          Analysis
        </Link>
        <Link to="/result" className="text-ink">
          Result
        </Link>
        <Link to="/showcase" className="text-ink">
          Showcase
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<AnalysisPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
