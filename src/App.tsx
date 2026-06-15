import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import MaterialsPage from '@/pages/MaterialsPage';
import RatioPage from '@/pages/RatioPage';
import ThicknessPage from '@/pages/ThicknessPage';
import ArchivePage from '@/pages/ArchivePage';
import RecipesPage from '@/pages/RecipesPage';

function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="flex min-h-screen bg-rice-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div key={loc.pathname} className="animate-fade-in-up min-h-screen px-8 py-7">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/materials" replace />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/ratio" element={<RatioPage />} />
          <Route path="/thickness" element={<ThicknessPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="*" element={<Navigate to="/materials" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
