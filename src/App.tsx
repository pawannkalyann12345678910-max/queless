import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { OrgDetailPage } from './pages/OrgDetailPage';
import { MyTokensPage } from './pages/MyTokensPage';
import { StaffPage } from './pages/StaffPage';
import { AdminPage } from './pages/AdminPage';
import { RegisterOrgPage } from './pages/RegisterOrgPage';
import { HDMIDisplayPage } from './pages/HDMIDisplayPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* HDMI Display — standalone fullscreen without app header/footer */}
          <Route path="/display/:queueId" element={<HDMIDisplayPage />} />

          {/* Core Routes with AppShell */}
          <Route
            path="/*"
            element={
              <AppShell>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/org/:orgId" element={<OrgDetailPage />} />
                  <Route path="/my-tokens" element={<MyTokensPage />} />
                  <Route path="/staff" element={<StaffPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/register" element={<RegisterOrgPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
