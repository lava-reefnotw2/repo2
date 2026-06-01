"use client";

import Link from "next/link";
import { CalendarCheck, Users, GraduationCap, Building2, ArrowRight, CalendarClock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <img
          src="/frontunt.jpg"
          alt="UNT"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/70 to-slate-900/90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header / Navbar */}
        <header className="px-8 md:px-16 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-unt.png"
              alt="Logo UNT"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="text-white font-bold text-xl tracking-tight">UNT</p>
              <p className="text-blue-200 text-xs">Sistema de Horarios</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="#features" className="text-blue-100 hover:text-white font-medium text-sm transition-colors">
              Funcionalidades
            </a>
            <a href="#about" className="text-blue-100 hover:text-white font-medium text-sm transition-colors">
              Acerca De
            </a>
            <a href="#contact" className="text-blue-100 hover:text-white font-medium text-sm transition-colors">
              Contacto
            </a>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-8 md:px-16 py-12">
          <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-12">
            {/* Left Side - Text */}
            <div className="lg:w-1/2 flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="text-blue-200 text-xs font-semibold tracking-wide">
                  Sistema de Gestión de Horarios UNT
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
                Organiza y gestiona tus horarios de manera simple y eficiente
              </h1>

              <p className="text-lg md:text-xl text-blue-100/80 max-w-xl leading-relaxed">
                Plataforma moderna para la gestión de horarios de la Escuela de Ingeniería de Sistemas de la Universidad Nacional de Trujillo
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all hover:scale-105"
                >
                  Acceder al Sistema <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-4">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <p className="text-3xl font-bold text-white">100+</p>
                  <p className="text-blue-200 text-xs mt-1">Docentes</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <p className="text-3xl font-bold text-white">50+</p>
                  <p className="text-blue-200 text-xs mt-1">Cursos</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <p className="text-3xl font-bold text-white">30+</p>
                  <p className="text-blue-200 text-xs mt-1">Ambientes</p>
                </div>
              </div>
            </div>

            {/* Right Side - Features Cards */}
            <div id="features" className="lg:w-1/2 grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl hover:scale-105 transition-all">
                <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center mb-4">
                  <CalendarCheck className="w-6 h-6 text-blue-300" />
                </div>
                <h3 className="text-xl font-bold text-white">Gestión de Horarios</h3>
                <p className="text-blue-100/70 mt-2 text-sm">
                  Crea, edita y visualiza horarios de manera sencilla
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl hover:scale-105 transition-all">
                <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-300" />
                </div>
                <h3 className="text-xl font-bold text-white">Gestión de Docentes</h3>
                <p className="text-blue-100/70 mt-2 text-sm">
                  Asigna docentes a grupos y horarios de forma organizada
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl hover:scale-105 transition-all">
                <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-blue-300" />
                </div>
                <h3 className="text-xl font-bold text-white">Gestión de Cursos</h3>
                <p className="text-blue-100/70 mt-2 text-sm">
                  Administra cursos, grupos y ciclos académicos
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl hover:scale-105 transition-all">
                <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-blue-300" />
                </div>
                <h3 className="text-xl font-bold text-white">Gestión de Ambientes</h3>
                <p className="text-blue-100/70 mt-2 text-sm">
                  Controla aulas y laboratorios disponibles
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer id="contact" className="px-8 md:px-16 py-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo-unt.png" className="w-8 h-8 rounded-full" />
              <div className="text-blue-200 text-sm">
                &copy; {new Date().getFullYear()} Universidad Nacional de Trujillo
              </div>
            </div>
            <p className="text-blue-200/70 text-xs">
              Escuela de Ingeniería de Sistemas - UNT
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
