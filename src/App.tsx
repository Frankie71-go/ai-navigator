import { Routes, Route } from "react-router-dom";

import { Footer } from "@/components/layout/Footer";

import Home from "@/app/page";
import ProfilePage from "@/app/profile/page";
import CompetitionsPage from "@/app/competitions/page";
import CompetitionDetailPage from "@/app/competitions/[id]/page";
import TeammatesPage from "@/app/teammates/page";
import ReviewPage from "@/app/review/page";
import RecommendPage from "@/app/recommend/page";
import ContactPage from "@/app/contact/page";
import StatsPage from "@/app/stats/page";
import { Navbar } from "@/components/layout/Navbar";

export default function App() {
  return (
    <div className="relative">
      {/* 顶部扫描线（赛博氛围） */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/70 to-transparent animate-scan" />
      </div>

      <Navbar />

      <main className="min-h-[calc(100vh-56px)]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/competitions" element={<CompetitionsPage />} />
          <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
          <Route path="/teammates" element={<TeammatesPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/recommend" element={<RecommendPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
