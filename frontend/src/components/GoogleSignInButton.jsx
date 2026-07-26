import React, { useEffect, useRef, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";

/**
 * Drop-in "Sign in with Google" button, used on both the Login and
 * Register pages. Handles three outcomes from the backend:
 *  - existing account (any signup method) -> logged straight in
 *  - brand-new account, no username collision -> account created, logged in
 *  - brand-new account, auto-generated username was taken -> shows a small
 *    one-time "pick a username" form before finishing account creation
 */
const GoogleSignInButton = () => {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext);

  const [pendingEmail, setPendingEmail] = useState(null);
  const [chosenUsername, setChosenUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const finishLogin = (data) => {
    // A previous account's cached name/photo must never survive into a new
    // login - this is exactly what caused chat.jsx to keep showing the old
    // user's name/photo after signing in as someone new via Google.
    sessionStorage.removeItem("userData");

    setAuth({
      loggedIn: true,
      role: data.role,
      username: data.username,
      loading: false,
    });
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("role", data.role);
    localStorage.setItem("username", data.username);
    navigate(data.role === "admin" ? "/admin" : "/chat", { replace: true });
  };

  const handleCredentialResponse = async (response) => {
    try {
      const res = await fetch(`/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Google sign-in failed. Please try again.");
        return;
      }

      if (data.needsUsername) {
        setPendingEmail(data.email);
        setChosenUsername(data.suggestedUsername || "");
        return;
      }

      toast.success(data.message || "Signed in with Google!");
      finishLogin(data);
    } catch (err) {
      toast.error("Something went wrong with Google sign-in. Please try again.");
    }
  };

  useEffect(() => {
    if (!window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCompleteSignup = async (e) => {
    e.preventDefault();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(chosenUsername)) {
      toast.error("Username must be 3-20 characters: letters, numbers, or underscores only.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/google/complete-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: pendingEmail, username: chosenUsername }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Could not create your account. Please try again.");
        setSubmitting(false);
        return;
      }

      toast.success("Account created!");
      finishLogin(data);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (pendingEmail) {
    return (
      <div className="w-full mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <p className="text-sm text-slate-700 mb-3">
          That username's taken — pick another for <span className="font-medium">{pendingEmail}</span>:
        </p>
        <form onSubmit={handleCompleteSignup} className="flex flex-col gap-3">
          <input
            type="text"
            value={chosenUsername}
            onChange={(e) => setChosenUsername(e.target.value)}
            placeholder="Choose a username"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            maxLength={20}
            autoFocus
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-md transition disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Continue"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={buttonRef} className="flex justify-center my-2" />
      <p className="text-center text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-manrope mt-1">
        By continuing with Google, you agree to our{' '}
        <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
          Terms
        </a>{' '}
        &{' '}
        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
};

export default GoogleSignInButton;
