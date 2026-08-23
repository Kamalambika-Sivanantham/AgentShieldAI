import React from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./theme";
import { Sidebar, MobileNav } from "./components";
import { Dashboard, Agents, EvaluationPage, ReportPage, RegressionPage, SettingsPage } from "./pages";

export default function App() {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-base text-ink-hi font-body transition-colors duration-200">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6 max-w-[1400px]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/evaluate" element={<EvaluationPage />} />
            <Route path="/report/:id" element={<ReportPage />} />
            <Route path="/regression" element={<RegressionPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </ThemeProvider>
  );
}
