import React from 'react';
import { ShieldCheck, Target, Zap, Users, Award, Terminal } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          About TalentSync
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          Architecting the Future of Technical Hiring
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          TalentSync was engineered to eliminate friction in the modern software engineering recruitment lifecycle. From candidate discovery to interview orchestration, we provide transparent, high-fidelity tooling for both applicants and hiring managers.
        </p>
      </div>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: 'Radical Transparency',
            desc: 'Every candidate receives instant notification updates on application status changes and review stages.',
            icon: Zap
          },
          {
            title: 'Enterprise Role Security',
            desc: 'Multi-layered authorization and strict PostgreSQL data constraints guarantee information integrity.',
            icon: ShieldCheck
          },
          {
            title: 'Precision Sourcing',
            desc: 'Normalized relational skill mappings allow recruiters to pinpoint specialized competencies accurately.',
            icon: Target
          }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Tech Architecture Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
            <Terminal className="w-4 h-4" /> Production Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
            Engineered for Reliability and Scale
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            The platform is built as a modular monolithic architecture with Express.js, PostgreSQL with connection pooling, JWT session handling with bcrypt password hashing, and a Vite-powered React client utilizing Tailwind CSS and Recharts telemetry.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-400">
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-white block font-bold">PostgreSQL 14+</span> Relational Schema
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-white block font-bold">Node / Express</span> RESTful API
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-white block font-bold">React 19 / Vite</span> Reactive Frontend
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-white block font-bold">Audit Logging</span> Security & Telemetry
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
