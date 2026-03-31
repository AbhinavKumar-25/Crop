import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import LandingPage from './pages/LandingPage';
import FarmerProfile from './pages/FarmerProfile';
import ProfessionalProfile from './pages/ProfessionalProfile';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/farmer" element={<FarmerProfile />} />
          <Route path="/pro" element={<ProfessionalProfile />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;