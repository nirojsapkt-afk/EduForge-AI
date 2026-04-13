import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import WorksheetGenerator from "./pages/WorksheetGenerator";
import QuizGenerator from "./pages/QuizGenerator";
import LessonBuilder from "./pages/LessonBuilder";
import PricingPage from "./pages/PricingPage";
import AuthPage from "./pages/AuthPage";

function AppLayout({ children }) {
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/worksheet" element={<AppLayout><WorksheetGenerator /></AppLayout>} />
          <Route path="/quiz" element={<AppLayout><QuizGenerator /></AppLayout>} />
          <Route path="/lesson" element={<AppLayout><LessonBuilder /></AppLayout>} />
          <Route path="/pricing" element={<AppLayout><PricingPage /></AppLayout>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
