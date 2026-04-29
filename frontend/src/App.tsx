import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import LandingPage from './pages/LandingPage';
import PredictionPage from './pages/PredictionPage';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/prediction" element={<PredictionPage />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;