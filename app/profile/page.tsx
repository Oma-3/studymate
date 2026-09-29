"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/lib/AuthContext";

export default function ProfilePage() {
  const router = useRouter();

  const { user, loading: authLoading, logout } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user && !isLoggingOut) {
      router.replace("/login");
    }
  }, [authLoading, user, isLoggingOut, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user]);

  const firstName = user?.displayName?.trim().split(/\s+/)[0] || "Student";

  const initial = firstName.charAt(0).toUpperCase() || "S";

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!user) {
      return;
    }

    const cleanName = displayName.trim();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }

    if (cleanName.length < 2) {
      setError("Your name must contain at least 2 characters.");
      return;
    }

    try {
      setIsSaving(true);

      await updateProfile(user, {
        displayName: cleanName,
      });

      await user.reload();

      setDisplayName(user.displayName || cleanName);

      setSuccess("Your profile has been updated successfully.");
    } catch (profileError) {
      console.error("StudyMate profile update error:", profileError);

      setError("We couldn't update your profile right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setError("");

      sessionStorage.removeItem("studymateQuiz");
      sessionStorage.removeItem("studymateQuizSettings");
      sessionStorage.removeItem("studymateAnswers");
      sessionStorage.removeItem("studymateScore");

      await logout();

      window.location.href = "/";
    } catch (logoutError) {
      console.error("StudyMate logout error:", logoutError);

      setError("We couldn't log you out right now. Please try again.");

      setIsLoggingOut(false);
    }
  };

  if (authLoading || (!user && !isLoggingOut)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FDF8F3] px-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E9DDFC] text-2xl text-[#7C3AED]">
            ✦
          </div>

          <p className="mt-4 text-sm font-medium text-[#747184]">
            Opening your profile...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#FDF8F3] text-[#25213D]">
      {/* Navbar */}
      <nav className="relative border-b border-[#EEE6F4] bg-[#FDF8F3]/95">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              type="button"
              onClick={() => router.push("/study")}
              className="flex shrink-0 items-center gap-2"
            >
              <img
                src="/studyMate-logo.png"
                alt="StudyMate logo"
                className="h-14 w-14 shrink-0 object-contain min-[400px]:h-16 min-[400px]:w-16 sm:h-20 sm:w-20"
              />

              <span className="text-lg font-bold tracking-tight sm:text-xl">
                Study
                <span className="text-[#7C3AED]">Mate</span>
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-7 lg:flex">
              <button
                type="button"
                onClick={() => router.push("/study")}
                className="font-medium text-[#655C70] transition hover:text-[#7C3AED]"
              >
                Study
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="font-medium text-[#655C70] transition hover:text-[#7C3AED]"
              >
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => router.push("/history")}
                className="font-medium text-[#655C70] transition hover:text-[#7C3AED]"
              >
                History
              </button>

              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="font-semibold text-[#7C3AED] transition hover:text-[#5B21B6]"
              >
                Profile
              </button>
            </div>

            {/* Desktop User Area */}
            <div className="hidden items-center lg:flex">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE3FA] text-sm font-bold uppercase text-[#6D28D9]">
                  {initial}
                </div>

                <div className="min-w-0 text-left">
                  <p className="text-xs font-medium text-[#918B9B]">
                    Studying as
                  </p>
                  <p className="max-w-[150px] truncate text-sm font-bold text-[#3E3748] xl:max-w-[190px]">
                    {user.displayName || user.email}
                  </p>
                </div>
              </button>

              <div className="mx-5 h-8 w-px bg-[#DDD3E5]" />

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="shrink-0 rounded-full border border-[#D9CEE4] bg-white px-5 py-2.5 text-sm font-semibold text-[#655C70] transition hover:border-[#BDA5D9] hover:bg-[#FBF8FD] hover:text-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </button>
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
            <div className="absolute left-4 right-4 top-full z-40 mt-2 overflow-hidden rounded-3xl border border-[#E6DAF3] bg-white p-4 shadow-[0_20px_60px_rgba(68,52,91,0.16)] sm:left-6 sm:right-6 lg:hidden">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/profile");
                }}
                className="mb-3 flex w-full items-center gap-3 border-b border-[#EEE8F2] px-2 pb-4 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE3FA] text-sm font-bold uppercase text-[#6D28D9]">
                  {initial}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#918B9B]">
                    Studying as
                  </p>
                  <p className="truncate text-sm font-bold text-[#3E3748]">
                    {user.displayName || user.email}
                  </p>
                </div>
              </button>

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/study");
                  }}
                  className="rounded-xl px-4 py-3 text-left font-medium text-[#655C70] transition hover:bg-[#F8F3FC] hover:text-[#7C3AED]"
                >
                  Study
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/dashboard");
                  }}
                  className="rounded-xl px-4 py-3 text-left font-medium text-[#655C70] transition hover:bg-[#F8F3FC] hover:text-[#7C3AED]"
                >
                  Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/history");
                  }}
                  className="rounded-xl px-4 py-3 text-left font-medium text-[#655C70] transition hover:bg-[#F8F3FC] hover:text-[#7C3AED]"
                >
                  History
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/profile");
                  }}
                  className="rounded-xl bg-[#F0E7FC] px-4 py-3 text-left font-semibold text-[#6D28D9]"
                >
                  Profile
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="mt-3 w-full rounded-xl border border-[#E3D8EA] px-4 py-3 text-left font-semibold text-[#655C70] transition hover:bg-[#FBF8FD] hover:text-[#7C3AED] disabled:opacity-60"
              >
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Heading */}
        <section>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#73549B] transition hover:text-[#5D388B]"
          >
            <span>←</span>
            Back to Dashboard
          </button>

          <div className="mt-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7C3AED]">
              Your account
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1F2140] sm:text-4xl">
              Profile
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-[#777184] sm:text-base">
              Manage the details attached to your StudyMate account.
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          {/* Profile summary */}
          <section className="rounded-[30px] border border-[#E7DDF0] bg-[#F1E8FB] p-6 sm:p-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#7C3AED] text-3xl font-bold text-white shadow-[0_10px_30px_rgba(124,58,237,0.18)]">
              {initial}
            </div>

            <h2 className="mt-6 break-words text-2xl font-bold text-[#292544]">
              {user.displayName || "StudyMate Student"}
            </h2>

            <p className="mt-2 break-all text-sm text-[#746B80]">
              {user.email}
            </p>

            <div className="mt-7 border-t border-[#DCCCED] pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#7C3AED]">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-bold text-[#4F4260]">
                    StudyMate account
                  </p>

                  <p className="mt-0.5 text-xs text-[#82758E]">
                    Your progress is linked to this account.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Edit profile */}
          <section className="rounded-[30px] border border-[#E7DDF0] bg-white p-6 shadow-[0_16px_50px_rgba(67,48,98,0.06)] sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9A82B5]">
                Personal details
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#292544]">
                Edit your profile
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#7B7483]">
                Update the name StudyMate uses across your study space.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="displayName"
                  className="mb-2 block text-sm font-semibold text-[#3C3544]"
                >
                  Display name
                </label>

                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value);

                    if (success) {
                      setSuccess("");
                    }
                  }}
                  disabled={isSaving}
                  autoComplete="name"
                  className="w-full rounded-2xl border border-[#DED6E4] bg-[#FFFEFF] px-4 py-3.5 text-sm text-[#292331] outline-none transition placeholder:text-[#B0AAB5] focus:border-[#9B72D1] focus:ring-4 focus:ring-[#EEE5F8] disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#3C3544]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  readOnly
                  className="w-full cursor-not-allowed rounded-2xl border border-[#E7E0EA] bg-[#F7F4F8] px-4 py-3.5 text-sm text-[#777184] outline-none"
                />

                <p className="mt-2 text-xs leading-5 text-[#9991A1]">
                  Your login email cannot be changed from this page.
                </p>
              </div>

              {error && (
                <div className="rounded-2xl border border-[#F0D5CE] bg-[#FFF7F5] px-4 py-3 text-sm leading-6 text-[#A94F3D]">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-[#D6E8DA] bg-[#F5FBF6] px-4 py-3 text-sm leading-6 text-[#467354]">
                  <div className="flex items-start gap-2">
                    <span className="font-bold">✓</span>

                    <span>{success}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(124,58,237,0.18)] transition hover:-translate-y-0.5 hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>
        </div>

        {/* Quick links */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-[24px] border border-[#E7DDF0] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#D4BDEB]"
          >
            <p className="text-sm font-bold text-[#342D42]">
              Study Dashboard →
            </p>

            <p className="mt-1 text-xs leading-5 text-[#81798A]">
              View your quiz history, scores and learning insights.
            </p>
          </button>

          <button
            type="button"
            onClick={() => router.push("/study")}
            className="rounded-[24px] border border-[#E7DDF0] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#D4BDEB]"
          >
            <p className="text-sm font-bold text-[#342D42]">Start Studying →</p>

            <p className="mt-1 text-xs leading-5 text-[#81798A]">
              Upload notes and create another StudyMate quiz.
            </p>
          </button>
        </section>
      </div>
    </main>
  );
}
