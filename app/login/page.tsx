"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setIsLoggingIn(true);

      await signInWithEmailAndPassword(auth, cleanEmail, password);

      router.push("/study");
    } catch (firebaseError: unknown) {
      console.error("StudyMate login error:", firebaseError);

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

      if (errorCode === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (
        errorCode === "auth/invalid-credential" ||
        errorCode === "auth/wrong-password" ||
        errorCode === "auth/user-not-found"
      ) {
        setError("The email or password you entered is incorrect.");
      } else if (errorCode === "auth/too-many-requests") {
        setError(
          "There have been too many login attempts. Please wait a little and try again.",
        );
      } else if (errorCode === "auth/network-request-failed") {
        setError(
          "We couldn't connect right now. Check your internet connection and try again.",
        );
      } else {
        setError("We couldn't log you in. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError(
        "Enter your email address above first, then select Forgot password.",
      );
      return;
    }

    try {
      setIsSendingReset(true);

      await sendPasswordResetEmail(auth, cleanEmail);

      setSuccess(
        "Password reset email sent. Check your inbox and follow the link to choose a new password.",
      );
    } catch (firebaseError: unknown) {
      console.error("StudyMate password reset error:", firebaseError);

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

      if (errorCode === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (errorCode === "auth/network-request-failed") {
        setError(
          "We couldn't connect right now. Check your internet connection and try again.",
        );
      } else if (errorCode === "auth/too-many-requests") {
        setError(
          "Too many reset requests were made. Please wait a little and try again.",
        );
      } else {
        setError(
          "We couldn't send the password reset email right now. Please try again.",
        );
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  const formBusy = isLoggingIn || isSendingReset;

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

            <span className="text-lg font-bold tracking-tight sm:text-xl">
              Study
              <span className="text-[#7C3AED]">Mate</span>
            </span>
          </a>

          <p className="hidden text-sm text-[#777184] sm:block">
            New to StudyMate?{" "}
            <a
              href="/signup"
              className="font-bold text-[#6D28D9] transition hover:text-[#5B21B6]"
            >
              Create an account
            </a>
          </p>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 py-12 sm:py-16 lg:px-10">
        <div className="pointer-events-none absolute left-[-120px] top-[100px] h-[300px] w-[300px] rounded-full bg-[#EDE1FB] opacity-70 blur-3xl" />

        <div className="pointer-events-none absolute bottom-[-100px] right-[-80px] h-[320px] w-[320px] rounded-full bg-[#F3E6FA] opacity-70 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E2D4F1] bg-white/70 px-4 py-2 text-xs font-bold text-[#6D28D9]">
              <span>✦</span>
              WELCOME BACK
            </div>

            <h1 className="mt-6 max-w-lg text-5xl font-bold leading-[1.08] tracking-[-0.04em]">
              Pick up where
              <br />
              you left off.
              <br />
              <span className="text-[#7C3AED]">Your notes are waiting.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-[#716B7A]">
              Come back to your StudyMate space, create another quiz and keep
              building on what you already know.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[520px]">
            <div className="rounded-[32px] border border-[#E7DCEF] bg-white p-6 shadow-[0_24px_80px_rgba(68,52,91,0.09)] sm:p-9">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE3FA] text-xl text-[#7C3AED]">
                  ✦
                </div>

                <h2 className="mt-6 text-3xl font-bold tracking-tight">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#817A89]">
                  Log in and get back to studying.
                </p>
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
                    onChange={(event) => {
                      setEmail(event.target.value);

                      if (success) {
                        setSuccess("");
                      }
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={formBusy}
                    className="w-full rounded-2xl border border-[#DED6E4] bg-[#FFFEFF] px-4 py-3.5 text-sm text-[#292331] outline-none transition placeholder:text-[#B0AAB5] focus:border-[#9B72D1] focus:ring-4 focus:ring-[#EEE5F8] disabled:opacity-60"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-[#3C3544]"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={formBusy}
                      className="text-xs font-semibold text-[#7C3AED] transition hover:text-[#5B21B6] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSendingReset ? "Sending..." : "Forgot password?"}
                    </button>
                  </div>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={formBusy}
                    className="w-full rounded-2xl border border-[#DED6E4] bg-[#FFFEFF] px-4 py-3.5 text-sm text-[#292331] outline-none transition placeholder:text-[#B0AAB5] focus:border-[#9B72D1] focus:ring-4 focus:ring-[#EEE5F8] disabled:opacity-60"
                  />
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
                  disabled={formBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 py-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(124,58,237,0.20)] transition hover:-translate-y-0.5 hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0"
                >
                  {isLoggingIn && <span className="button-spinner" />}

                  {isLoggingIn ? "Opening your space..." : "Log In"}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#EEE8F1]" />

                <span className="text-xs text-[#A19AA8]">new here?</span>

                <div className="h-px flex-1 bg-[#EEE8F1]" />
              </div>

              <a
                href="/signup"
                className="flex w-full items-center justify-center rounded-full border border-[#D9CEE4] bg-white px-6 py-3.5 text-sm font-bold text-[#5E526B] transition hover:border-[#BDA5D9] hover:bg-[#FBF8FD] hover:text-[#6D28D9]"
              >
                Create an Account
              </a>
            </div>

            <p className="mt-6 text-center text-sm text-[#817A89] sm:hidden">
              New to StudyMate?{" "}
              <a href="/signup" className="font-bold text-[#6D28D9]">
                Create an account
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
