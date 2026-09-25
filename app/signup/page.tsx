"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setIsCreating(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      );

      await updateProfile(userCredential.user, {
        displayName: cleanName,
      });

      router.push("/study");
    } catch (firebaseError: unknown) {
      console.error("StudyMate sign up error:", firebaseError);

      const errorCode =
        typeof firebaseError === "object" &&
        firebaseError !== null &&
        "code" in firebaseError
          ? String(
              (
                firebaseError as {
                  code: unknown;
                }
              ).code,
            )
          : "";

      if (errorCode === "auth/email-already-in-use") {
        setError(
          "An account already exists with this email. Try logging in instead.",
        );
      } else if (errorCode === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (errorCode === "auth/weak-password") {
        setError("Please choose a stronger password.");
      } else if (errorCode === "auth/network-request-failed") {
        setError(
          "We couldn't connect right now. Check your internet connection and try again.",
        );
      } else {
        setError("We couldn't create your account. Please try again.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDF8F3] text-[#1F2140]">
      <nav className="border-b border-[#EEE5F3] bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/studyMate-logo.png"
              alt="StudyMate logo"
              className="h-14 w-14 shrink-0 object-contain min-[400px]:h-16 min-[400px]:w-16 sm:h-20 sm:w-20"
            />

            <span className="text-xl font-bold tracking-tight">
              Study
              <span className="text-[#7C3AED]">Mate</span>
            </span>
          </a>

          <p className="hidden text-sm text-[#777184] sm:block">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-bold text-[#6D28D9] transition hover:text-[#5B21B6]"
            >
              Log in
            </a>
          </p>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 py-12 sm:py-16 lg:px-10">
        <div className="pointer-events-none absolute left-[-120px] top-[80px] h-[300px] w-[300px] rounded-full bg-[#EDE1FB] opacity-70 blur-3xl" />

        <div className="pointer-events-none absolute bottom-[-120px] right-[-80px] h-[320px] w-[320px] rounded-full bg-[#F3E6FA] opacity-70 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E2D4F1] bg-white/70 px-4 py-2 text-xs font-bold text-[#6D28D9]">
              <span>✦</span>
              YOUR STUDY SPACE
            </div>

            <h1 className="mt-6 max-w-lg text-5xl font-bold leading-[1.08] tracking-[-0.04em]">
              Your notes.
              <br />
              Your quizzes.
              <br />
              <span className="text-[#7C3AED]">Your progress.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-[#716B7A]">
              Create your StudyMate account to keep your study sessions together
              and see how your understanding grows over time.
            </p>

            <div className="mt-9 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEE4FB] text-[#7C3AED]">
                  ✦
                </div>

                <div>
                  <p className="text-sm font-bold">
                    Quizzes made from your notes
                  </p>

                  <p className="mt-1 text-xs text-[#918B9B]">
                    Study the material that actually matters to you.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEE4FB] text-[#7C3AED]">
                  ↗
                </div>

                <div>
                  <p className="text-sm font-bold">
                    Understand your weak areas
                  </p>

                  <p className="mt-1 text-xs text-[#918B9B]">
                    See what deserves another look after each quiz.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEE4FB] text-[#7C3AED]">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-bold">Watch yourself improve</p>

                  <p className="mt-1 text-xs text-[#918B9B]">
                    Your account will keep your progress in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[520px]">
            <div className="rounded-[32px] border border-[#E7DCEF] bg-white p-6 shadow-[0_24px_80px_rgba(68,52,91,0.09)] sm:p-9">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE3FA] text-xl text-[#7C3AED]">
                  ✦
                </div>

                <h2 className="mt-6 text-3xl font-bold tracking-tight">
                  Create your account
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#817A89]">
                  A little home for your notes, quizzes and progress.
                </p>
              </div>

              <form onSubmit={handleSignUp} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-[#3C3544]"
                  >
                    Your name
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="What should we call you?"
                    autoComplete="name"
                    disabled={isCreating}
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
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={isCreating}
                    className="w-full rounded-2xl border border-[#DED6E4] bg-[#FFFEFF] px-4 py-3.5 text-sm text-[#292331] outline-none transition placeholder:text-[#B0AAB5] focus:border-[#9B72D1] focus:ring-4 focus:ring-[#EEE5F8] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-[#3C3544]"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    disabled={isCreating}
                    className="w-full rounded-2xl border border-[#DED6E4] bg-[#FFFEFF] px-4 py-3.5 text-sm text-[#292331] outline-none transition placeholder:text-[#B0AAB5] focus:border-[#9B72D1] focus:ring-4 focus:ring-[#EEE5F8] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-[#3C3544]"
                  >
                    Confirm password
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Type your password again"
                    autoComplete="new-password"
                    disabled={isCreating}
                    className="w-full rounded-2xl border border-[#DED6E4] bg-[#FFFEFF] px-4 py-3.5 text-sm text-[#292331] outline-none transition placeholder:text-[#B0AAB5] focus:border-[#9B72D1] focus:ring-4 focus:ring-[#EEE5F8] disabled:opacity-60"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-[#F0D5CE] bg-[#FFF7F5] px-4 py-3 text-sm leading-6 text-[#A94F3D]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 py-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(124,58,237,0.20)] transition hover:-translate-y-0.5 hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0"
                >
                  {isCreating && <span className="button-spinner" />}

                  {isCreating ? "Creating your space..." : "Create My Account"}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#EEE8F1]" />

                <span className="text-xs text-[#A19AA8]">
                  already studying with us?
                </span>

                <div className="h-px flex-1 bg-[#EEE8F1]" />
              </div>

              <a
                href="/login"
                className="flex w-full items-center justify-center rounded-full border border-[#D9CEE4] bg-white px-6 py-3.5 text-sm font-bold text-[#5E526B] transition hover:border-[#BDA5D9] hover:bg-[#FBF8FD] hover:text-[#6D28D9]"
              >
                Log In
              </a>

              <p className="mt-6 text-center text-xs leading-5 text-[#AAA3AF]">
                By creating an account, you&apos;re creating your personal
                StudyMate study space.
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-[#817A89] sm:hidden">
              Already have an account?{" "}
              <a href="/login" className="font-bold text-[#6D28D9]">
                Log in
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
