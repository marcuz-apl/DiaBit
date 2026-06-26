'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Disc, Award, Code, Globe, Shield } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-6 max-w-5xl mx-auto">
          <Link 
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workspace
          </Link>
          <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
            About DiaBit
          </span>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            v1.0.0 Release
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 flex flex-col items-center text-center space-y-8">
        
        {/* App Logo Big */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl dark:bg-blue-600 animate-pulse">
          <Disc className="h-12 w-12 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
            DiaBit Directional Surveying
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">
            Product Version 1.0.0 • Build 2026.06.25
          </p>
        </div>

        <p className="text-xs text-slate-650 dark:text-slate-400 max-w-lg leading-relaxed">
          DiaBit is a lightweight, responsive engineering dashboard engineered by <strong>Alfazen Inc.</strong> to compute spatial coordinates for directional wellbore trajectories. By providing instantaneous calculations, 3D plots, and CSV import/export capabilities, DiaBit streamlines operations for well plan modeling and deviation surveys.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left pt-6">
          <div className="bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl p-4 shadow-sm text-xs space-y-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Code className="h-4 w-4 text-blue-500" />
              Developer Tech Stack
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Built on React, Next.js (App Router), Tailwind CSS, Plotly.js, and SQLite3. Fully packaged as a containerized Docker build.
            </p>
          </div>

          <div className="bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl p-4 shadow-sm text-xs space-y-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-emerald-500" />
              Calculations Quality
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Validates 3D well geometries using the highly accurate Minimum Curvature Method (MCM), supporting meters or feet.
            </p>
          </div>

          <div className="bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl p-4 shadow-sm text-xs space-y-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-indigo-500" />
              User Profile Control
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Secure administrative credentials enable data registry modifications and user profile additions in the admin panel.
            </p>
          </div>

          <div className="bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl p-4 shadow-sm text-xs space-y-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-sky-500" />
              Corporate Sponsorship
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Proudly engineered and supported by Alfazen Inc. under global exploration software licensing programs.
            </p>
          </div>
        </div>

        {/* Divider and Footer copyright */}
        <div className="border-t border-slate-200 dark:border-slate-850 w-full pt-6 text-[10px] text-slate-500 dark:text-slate-500">
          <p>© 2026 Alfazen Inc. All rights reserved.</p>
          <p className="mt-1">For sales or corporate licensing agreements, please consult alfazen.com/licensing.</p>
        </div>
      </main>
    </div>
  );
}
