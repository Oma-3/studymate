"use client";

import { useState } from "react";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FDF8F3] text-[#25213D]">
      {/* NAVBAR */}
      <nav className="relative border-b border-[#EEE6F4] bg-[#FDF8F3]/95">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between">
            {/* StudyMate Logo */}
            <a
              href="#home"
              className="flex shrink-0 items-center gap-1 sm:gap-2"
            >
              <img
                src="/studyMate-logo.png"
                alt="StudyMate logo"
                className="h-14 w-14 shrink-0 object-contain min-[400px]:h-16 min-[400px]:w-16 sm:h-20 sm:w-20"
              />

              <span className="text-lg font-bold tracking-tight min-[400px]:text-xl sm:text-2xl">
                Study
                <span className="text-[#7C3AED]">Mate</span>
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-8 text-sm font-medium lg:flex">
              <a href="#home" className="transition hover:text-[#7C3AED]">
                Home
              </a>

              <a
                href="#how-it-works"
                className="transition hover:text-[#7C3AED]"
              >
                How It Works
              </a>

              <a href="#features" className="transition hover:text-[#7C3AED]">
                Features
              </a>
            </div>

            {/* Desktop Account Buttons */}
            <div className="hidden items-center gap-3 lg:flex">
              <a
                href="/login"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[#D8C6F3] px-5 py-2.5 text-sm font-semibold transition hover:bg-[#F2EAFE]"
              >
                Log In
              </a>

              <a
                href="/signup"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6D28D9]"
              >
                Start Studying
              </a>
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DED3E7] bg-white text-[#4B4355] transition hover:border-[#BDA5D9] hover:text-[#7C3AED] lg:hidden"
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <span className="text-2xl leading-none">×</span>
              ) : (
                <span className="flex flex-col gap-1.5">
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                </span>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="absolute left-4 right-4 top-full z-50 mt-2 overflow-hidden rounded-3xl border border-[#E6DAF3] bg-white p-4 shadow-[0_20px_60px_rgba(68,52,91,0.16)] sm:left-6 sm:right-6 lg:hidden">
              <div className="flex flex-col gap-1">
                <a
                  href="#home"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl bg-[#F0E7FC] px-4 py-3 font-semibold text-[#6D28D9]"
                >
                  Home
                </a>

                <a
                  href="#how-it-works"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 font-medium text-[#655C70] transition hover:bg-[#F8F3FC] hover:text-[#7C3AED]"
                >
                  How It Works
                </a>

                <a
                  href="#features"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 font-medium text-[#655C70] transition hover:bg-[#F8F3FC] hover:text-[#7C3AED]"
                >
                  Features
                </a>
              </div>

              <div className="my-3 h-px bg-[#EEE8F2]" />

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl border border-[#D8C6F3] px-4 py-3 text-sm font-semibold text-[#5A4A70] transition hover:bg-[#F8F3FC]"
                >
                  Log In
                </a>

                <a
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl bg-[#7C3AED] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
                >
                  Start Studying
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section
        id="home"
        className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:min-h-[650px] lg:grid-cols-2 lg:gap-12 lg:px-10 lg:pb-20 lg:pt-12"
      >
        {/* Left side */}
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full bg-[#F0E7FC] px-3.5 py-2 text-xs font-semibold text-[#6D28D9] sm:mb-6 sm:px-4 sm:text-sm">
            <span className="shrink-0">✦</span>

            <span>Your study buddy, whenever you need it</span>
          </div>

          <h1 className="text-[2.6rem] font-bold leading-[1.06] tracking-tight text-[#1F2140] min-[400px]:text-5xl sm:text-6xl lg:text-7xl">
            Turn your notes into
            <span className="block text-[#7C3AED]">study sessions.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-[#66657A] sm:mt-7 sm:text-lg sm:leading-8 lg:mx-0">
            Upload your notes and StudyMate turns them into personalised
            practice questions, helping you test what you know and discover what
            needs a little more attention.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 lg:justify-start">
            <a
              href="/signup"
              className="rounded-full bg-[#7C3AED] px-7 py-3.5 text-center font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#6D28D9]"
            >
              Start Studying
            </a>

            <a
              href="#how-it-works"
              className="rounded-full border border-[#D8C6F3] bg-white/60 px-7 py-3.5 text-center font-semibold text-[#4C3A68] transition hover:bg-[#F0E7FC]"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-2.5 text-sm text-[#747184] min-[450px]:flex-row min-[450px]:flex-wrap min-[450px]:gap-x-5 sm:mt-10 lg:justify-start">
            <span>✓ PDF &amp; DOCX notes</span>

            <span>✓ Personalised quizzes</span>

            <span>✓ Instant results</span>
          </div>
        </div>

        {/* Illustration area */}
        <div className="relative mx-auto flex min-h-[360px] w-full max-w-[540px] items-center justify-center sm:min-h-[450px] lg:min-h-[520px] lg:max-w-none">
          {/* Lavender background shape */}
          <div className="absolute h-[280px] w-[280px] rounded-[40%_60%_55%_45%] bg-[#EEE5FB] min-[400px]:h-[320px] min-[400px]:w-[320px] sm:h-[390px] sm:w-[390px] lg:h-[430px] lg:w-[430px]" />

          {/* Progress card */}
          <div className="absolute left-0 top-5 z-20 rounded-2xl bg-white px-3.5 py-3 shadow-lg min-[400px]:left-2 min-[400px]:top-8 sm:left-6 sm:top-14 sm:px-5 sm:py-4 lg:top-20">
            <p className="text-[10px] font-medium text-[#8B8798] sm:text-xs">
              Today&apos;s progress
            </p>

            <p className="mt-1 text-base font-bold text-[#1F2140] sm:text-xl">
              8 / 10
            </p>

            <div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-[#EEE9F5] sm:mt-3 sm:h-2 sm:w-28">
              <div className="h-full w-4/5 rounded-full bg-[#8B5CF6]" />
            </div>
          </div>

          {/* Quiz streak card */}
          <div className="absolute bottom-5 right-0 z-20 rounded-2xl bg-white px-3.5 py-3 shadow-lg min-[400px]:bottom-8 min-[400px]:right-2 sm:bottom-16 sm:px-5 sm:py-4 lg:bottom-24">
            <p className="text-[10px] font-medium text-[#8B8798] sm:text-xs">
              Quiz streak
            </p>

            <p className="mt-1 text-sm font-bold text-[#7C3AED] sm:text-lg">
              5 days ✦
            </p>
          </div>

          {/* Student illustration */}
          <div className="relative z-10 w-[310px] min-[400px]:w-[350px] sm:w-full sm:max-w-[460px] lg:max-w-[500px]">
            <img
              src="/Studying-cuate.svg"
              alt="Student studying with books and a computer"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="relative overflow-hidden bg-[#F5EEFC] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          {/* Section heading */}
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#7C3AED] shadow-sm sm:text-sm">
              <span>✦</span>
              Simple to use
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-[#1F2140] sm:text-4xl lg:text-5xl">
              From notes to practice in
              <span className="text-[#7C3AED]"> three steps.</span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#6F6B7D] sm:mt-5 sm:text-lg sm:leading-8">
              No complicated setup. Bring your notes, choose how you want to
              study, and let StudyMate prepare your practice session.
            </p>
          </div>

          {/* Steps */}
          <div className="relative mt-10 grid gap-5 sm:mt-14 md:grid-cols-3 md:gap-5 lg:mt-16 lg:gap-6">
            {/* Step 1 */}
            <div className="group relative rounded-[26px] bg-[#FFFDFC] p-6 shadow-[0_12px_40px_rgba(75,55,110,0.08)] transition duration-300 hover:-translate-y-2 sm:rounded-[32px] sm:p-8">
              <div className="absolute right-5 top-4 text-4xl font-bold text-[#EEE5FB] sm:right-6 sm:top-5 sm:text-5xl">
                01
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9DDFC] text-xl sm:h-14 sm:w-14 sm:text-2xl">
                📄
              </div>

              <h3 className="mt-6 text-xl font-bold text-[#1F2140] sm:mt-7">
                Upload your notes
              </h3>

              <p className="mt-3 leading-7 text-[#747184]">
                Add your PDF or DOCX study material. StudyMate uses your own
                notes as the foundation for your quiz.
              </p>

              <div className="mt-6 rounded-2xl border border-dashed border-[#CDB7EF] bg-[#FAF7FE] p-4 sm:mt-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                    📚
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#403A54]">
                      My Biology Notes
                    </p>

                    <p className="text-xs text-[#9691A3]">
                      PDF • Ready to study
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative rounded-[26px] bg-[#7C3AED] p-6 text-white shadow-[0_12px_40px_rgba(124,58,237,0.18)] transition duration-300 hover:-translate-y-2 sm:rounded-[32px] sm:p-8 md:mt-8">
              <div className="absolute right-5 top-4 text-4xl font-bold text-white/10 sm:right-6 sm:top-5 sm:text-5xl">
                02
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl sm:h-14 sm:w-14 sm:text-2xl">
                ✦
              </div>

              <h3 className="mt-6 text-xl font-bold sm:mt-7">
                Create your quiz
              </h3>

              <p className="mt-3 leading-7 text-[#E8DEFA]">
                StudyMate turns your material into personalised multiple choice
                questions based on what you uploaded.
              </p>

              <div className="mt-6 rounded-2xl bg-white/10 p-4 sm:mt-7">
                <p className="text-xs font-medium text-[#DDD0F7]">
                  GENERATING QUIZ
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-3/4 rounded-full bg-white" />
                </div>

                <p className="mt-3 text-sm font-medium">
                  Preparing your study session...
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative rounded-[26px] bg-[#FFFDFC] p-6 shadow-[0_12px_40px_rgba(75,55,110,0.08)] transition duration-300 hover:-translate-y-2 sm:rounded-[32px] sm:p-8">
              <div className="absolute right-5 top-4 text-4xl font-bold text-[#EEE5FB] sm:right-6 sm:top-5 sm:text-5xl">
                03
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9DDFC] text-xl sm:h-14 sm:w-14 sm:text-2xl">
                ✓
              </div>

              <h3 className="mt-6 text-xl font-bold text-[#1F2140] sm:mt-7">
                See what you know
              </h3>

              <p className="mt-3 leading-7 text-[#747184]">
                Complete your quiz, get your score and see which topics deserve
                another look.
              </p>

              <div className="mt-6 rounded-2xl bg-[#F7F2FC] p-4 sm:mt-7">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#9691A3]">
                      YOUR SCORE
                    </p>

                    <p className="mt-1 text-3xl font-bold text-[#7C3AED]">
                      8/10
                    </p>
                  </div>

                  <div className="rounded-full bg-[#E3F6EA] px-3 py-1 text-xs font-semibold text-[#38865A]">
                    Great work!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="bg-[#FDF8F3] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#F0E7FC] px-4 py-2 text-xs font-semibold text-[#6D28D9] sm:mb-6 sm:text-sm">
              <span>✦</span>
              Made for better studying
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-[#1F2140] sm:text-4xl lg:text-5xl">
              More than just
              <span className="text-[#7C3AED]"> questions.</span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#6F6D7E] sm:mt-5">
              StudyMate helps you practise, understand your results and focus
              your time where it matters most.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-5 md:grid-cols-2">
            <div className="group rounded-[26px] border border-[#E8DDF5] bg-[#F3ECFC] p-6 transition duration-300 hover:-translate-y-1 sm:rounded-[32px] sm:p-8">
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm sm:mb-10">
                ✦
              </div>

              <p className="mb-2 text-xs font-semibold text-[#7C3AED] sm:text-sm">
                YOUR MATERIAL
              </p>

              <h3 className="text-xl font-bold text-[#1F2140] sm:text-2xl">
                Questions from your notes
              </h3>

              <p className="mt-3 max-w-md leading-7 text-[#6F6D7E]">
                Your uploaded material becomes the foundation for your practice
                questions, so your study session stays focused on what you are
                learning.
              </p>
            </div>

            <div className="group rounded-[26px] border border-[#E8E5ED] bg-white p-6 transition duration-300 hover:-translate-y-1 sm:rounded-[32px] sm:p-8">
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3ECFC] text-xl sm:mb-10">
                ✓
              </div>

              <p className="mb-2 text-xs font-semibold text-[#7C3AED] sm:text-sm">
                INSTANT FEEDBACK
              </p>

              <h3 className="text-xl font-bold text-[#1F2140] sm:text-2xl">
                Know why an answer is right
              </h3>

              <p className="mt-3 max-w-md leading-7 text-[#6F6D7E]">
                Review your answers after each quiz with clear explanations that
                help you understand the material, not just memorise a score.
              </p>
            </div>

            <div className="group rounded-[26px] border border-[#E8E5ED] bg-white p-6 transition duration-300 hover:-translate-y-1 sm:rounded-[32px] sm:p-8">
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3ECFC] text-xl sm:mb-10">
                ◎
              </div>

              <p className="mb-2 text-xs font-semibold text-[#7C3AED] sm:text-sm">
                WEAK AREAS
              </p>

              <h3 className="text-xl font-bold text-[#1F2140] sm:text-2xl">
                See what needs another look
              </h3>

              <p className="mt-3 max-w-md leading-7 text-[#6F6D7E]">
                Spot the topics you struggle with so you know exactly what to go
                back and revise before your next test.
              </p>
            </div>

            <div className="group rounded-[26px] bg-[#292544] p-6 text-white transition duration-300 hover:-translate-y-1 sm:rounded-[32px] sm:p-8">
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl sm:mb-10">
                ↗
              </div>

              <p className="mb-2 text-xs font-semibold text-[#CBB5F5] sm:text-sm">
                YOUR PROGRESS
              </p>

              <h3 className="text-xl font-bold sm:text-2xl">
                Watch yourself improve
              </h3>

              <p className="mt-3 max-w-md leading-7 text-[#D5D1DF]">
                Keep track of your quiz performance and see how your
                understanding develops as you continue studying.
              </p>

              <div className="mt-8 flex items-end gap-2">
                <div className="h-8 w-7 rounded-t-lg bg-white/20 sm:w-8" />

                <div className="h-14 w-7 rounded-t-lg bg-white/30 sm:w-8" />

                <div className="h-20 w-7 rounded-t-lg bg-[#A78BFA] sm:w-8" />

                <div className="h-28 w-7 rounded-t-lg bg-[#C4B5FD] sm:w-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#FDF8F3] px-4 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-8 lg:px-10 lg:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[28px] bg-[#EDE3FA] px-5 py-12 text-center sm:rounded-[40px] sm:px-12 sm:py-16 lg:py-20">
            <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#DCCAF5] opacity-60 sm:h-40 sm:w-40" />

            <div className="absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-[#D8C3F4] opacity-60 sm:h-52 sm:w-52" />

            <div className="relative z-10 mx-auto max-w-2xl">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm sm:mb-6 sm:h-14 sm:w-14 sm:text-2xl">
                ✦
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-[#1F2140] sm:text-4xl lg:text-5xl">
                Your next study session
                <span className="block text-[#7C3AED]">
                  starts with your notes.
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#68647A] sm:text-lg sm:leading-8">
                Bring your PDF or DOCX notes and turn what you are already
                learning into a practice session made for you.
              </p>

              <a
                href="/signup"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#7C3AED] px-8 py-4 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#6D28D9] sm:w-auto"
              >
                Start Studying
              </a>

              <p className="mt-4 text-sm leading-6 text-[#817A91]">
                Upload your notes. Choose your quiz. Start practising.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#EEE6F4] bg-[#FDF8F3] px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-1">
              <img
                src="/studyMate-logo.png"
                alt="StudyMate logo"
                className="h-16 w-16 shrink-0 object-contain"
              />

              <span className="text-xl font-bold tracking-tight text-[#1F2140]">
                Study
                <span className="text-[#7C3AED]">Mate</span>
              </span>
            </div>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#777284]">
              Turn your notes into practice and make every study session count.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#625D70] sm:gap-x-8">
            <a href="#home" className="transition hover:text-[#7C3AED]">
              Home
            </a>

            <a href="#how-it-works" className="transition hover:text-[#7C3AED]">
              How It Works
            </a>

            <a href="#features" className="transition hover:text-[#7C3AED]">
              Features
            </a>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-[#EEE6F4] pt-6">
          <p className="text-sm leading-6 text-[#918B9B]">
            © 2026 StudyMate. Built for better study sessions.
          </p>
        </div>
      </footer>
    </main>
  );
}
