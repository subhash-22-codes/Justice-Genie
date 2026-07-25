import React, { createContext, useState, useEffect, useCallback } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    loggedIn: false,
    role: null,
    username: null,
    loading: true,
  });

  // Always ask the server "am I really logged in?" instead of trusting
  // localStorage. localStorage can say "logged in" long after the real
  // session has expired or been rejected by the browser — trusting it
  // blindly is what caused pages to look logged-in but silently fail.
  const verifySession = useCallback(() => {
    fetch(`/api/check-session`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("role", data.role);
          localStorage.setItem("username", data.username);
          setAuth({
            loggedIn: true,
            role: data.role,
            username: data.username,
            loading: false,
          });
        } else {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("role");
          localStorage.removeItem("username");
          setAuth({ loggedIn: false, role: null, username: null, loading: false });
        }
      })
      .catch(() => {
        // Network/server error: treat as logged-out rather than leaving the
        // app stuck showing stale "logged in" state with nothing working.
        setAuth({ loggedIn: false, role: null, username: null, loading: false });
      });
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // Any page can call this the moment an API call comes back 401, so the
  // user is treated as logged out immediately instead of being left on a
  // page that looks fine but silently fails every request.
  const clearAuth = useCallback(() => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setAuth({ loggedIn: false, role: null, username: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
