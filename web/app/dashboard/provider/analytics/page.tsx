"use client";

import { ProviderGuard } from "@/components/ProviderGuard";
import { BarChart3, TrendingUp, Users, CalendarDays, Euro, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useEffect, useState } from "react";

// Mock data since we don't have an analytics endpoint yet
const MOCK_DATA = {
  totalRevenue: 14250,
  revenueGrowth: "+12.5%",
  totalBookings: 128,
  bookingsGrowth: "+5.2%",
  upcomingGuests: 45,
  avgRating: 4.8,
  revenueData: [650, 400, 900, 1100, 850, 1200, 1400], // Last 7 days
  topExperiences: [
    { title: "Pottery Workshop", bookings: 42, revenue: 5040 },
    { title: "Wine Tasting Tour", bookings: 38, revenue: 3800 },
    { title: "Team Baking Challenge", bookings: 25, revenue: 3750 },
  ],
};

function ProviderAnalyticsContent() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API load
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 w-full rounded-[2.5rem] lg:col-span-2" />
          <Skeleton className="h-96 w-full rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...MOCK_DATA.revenueData);

  return (
    <div className="pb-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-navy-900 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-purple-500" />
          Analytics & Insights
        </h1>
        <p className="mt-2 text-lg font-bold text-navy-500">
          Track your experience performance and earnings.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-[2rem] bg-green-100 p-6 border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white p-3 rounded-2xl border-2 border-navy-900 shadow-sm">
              <Euro className="h-6 w-6 text-green-600" />
            </div>
            <span className="flex items-center gap-1 text-sm font-extrabold text-green-700 bg-green-200 px-3 py-1 rounded-full border-2 border-green-300">
              <TrendingUp className="h-3 w-3" />
              {MOCK_DATA.revenueGrowth}
            </span>
          </div>
          <p className="text-sm font-extrabold text-navy-600 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="font-display text-4xl font-bold text-navy-900">€{MOCK_DATA.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="rounded-[2rem] bg-blue-100 p-6 border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white p-3 rounded-2xl border-2 border-navy-900 shadow-sm">
              <CalendarDays className="h-6 w-6 text-blue-600" />
            </div>
            <span className="flex items-center gap-1 text-sm font-extrabold text-blue-700 bg-blue-200 px-3 py-1 rounded-full border-2 border-blue-300">
              <TrendingUp className="h-3 w-3" />
              {MOCK_DATA.bookingsGrowth}
            </span>
          </div>
          <p className="text-sm font-extrabold text-navy-600 uppercase tracking-widest mb-1">Total Bookings</p>
          <p className="font-display text-4xl font-bold text-navy-900">{MOCK_DATA.totalBookings}</p>
        </div>

        <div className="rounded-[2rem] bg-yellow-100 p-6 border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white p-3 rounded-2xl border-2 border-navy-900 shadow-sm">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm font-extrabold text-navy-600 uppercase tracking-widest mb-1">Upcoming Guests</p>
          <p className="font-display text-4xl font-bold text-navy-900">{MOCK_DATA.upcomingGuests}</p>
        </div>

        <div className="rounded-[2rem] bg-pink-100 p-6 border-4 border-navy-900 shadow-[4px_4px_0_theme(colors.navy.900)] transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white p-3 rounded-2xl border-2 border-navy-900 shadow-sm">
              <Star className="h-6 w-6 text-pink-600" />
            </div>
          </div>
          <p className="text-sm font-extrabold text-navy-600 uppercase tracking-widest mb-1">Avg. Rating</p>
          <p className="font-display text-4xl font-bold text-navy-900">{MOCK_DATA.avgRating}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-[2.5rem] bg-white p-8 border-4 border-navy-900 shadow-[8px_8px_0_theme(colors.navy.900)] relative blob-shape-3">
          <h2 className="font-display text-2xl font-bold text-navy-900 mb-8">Revenue (Last 7 Days)</h2>
          
          <div className="flex items-end gap-2 sm:gap-4 h-64 mt-4 relative z-10">
            {MOCK_DATA.revenueData.map((val, i) => {
              const heightPct = (val / maxRevenue) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-navy-900 text-white text-xs font-bold py-1 px-2 rounded-lg relative">
                    €{val}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-navy-900 rotate-45"></div>
                  </div>
                  <div 
                    className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-2xl border-4 border-b-0 border-navy-900 transition-all duration-500 hover:from-purple-400 hover:to-purple-300"
                    style={{ height: `${heightPct}%` }}
                  ></div>
                  <div className="mt-3 text-sm font-extrabold text-navy-400">Day {i+1}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Experiences List */}
        <div className="rounded-[2.5rem] bg-orange-400 p-8 border-4 border-navy-900 shadow-[8px_8px_0_theme(colors.navy.900)]">
          <h2 className="font-display text-2xl font-bold text-navy-900 mb-6 bg-white inline-block px-4 py-1 rounded-xl border-2 border-navy-900 shadow-sm -rotate-2">
            Top Experiences
          </h2>
          
          <div className="space-y-4">
            {MOCK_DATA.topExperiences.map((exp, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border-4 border-navy-900 shadow-sm hover:shadow-playful hover:-translate-y-1 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-navy-900 max-w-[70%] truncate">{exp.title}</h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 border-2 border-orange-200 text-orange-700 font-extrabold flex-shrink-0">
                    #{i + 1}
                  </div>
                </div>
                <div className="flex justify-between items-end mt-4 pt-4 border-t-2 border-navy-50">
                  <div>
                    <p className="text-xs font-extrabold text-navy-400 uppercase tracking-widest">Bookings</p>
                    <p className="font-bold text-navy-700">{exp.bookings}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-navy-400 uppercase tracking-widest">Revenue</p>
                    <p className="font-bold text-green-600">€{exp.revenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderAnalyticsPage() {
  return (
    <ProviderGuard>
      <ProviderAnalyticsContent />
    </ProviderGuard>
  );
}
