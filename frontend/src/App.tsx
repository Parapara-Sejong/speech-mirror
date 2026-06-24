import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

import { AnalysisPage } from './pages/AnalysisPage';
import { InterviewPage } from './pages/InterviewPage';
import { HomePage } from './pages/HomePage';
import { QuestionsPage } from './pages/QuestionsPage';
import { ResultPage } from './pages/ResultPage';
import { SetupPage } from './pages/SetupPage';
import { ShowcasePage } from './pages/ShowcasePage';
import { UploadPage } from './pages/UploadPage';

function App() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 border-b border-hairline bg-canvas px-6 py-3 text-nav-link">
        <Link to="/" className="text-ink">
          Home
        </Link>
        <Link to="/result" className="text-ink">
          Result
        </Link>
        <Link to="/showcase" className="text-ink">
          Showcase
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="/dev" element={<AnalysisPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
