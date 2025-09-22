import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    loggedIn: false,
    role: null,
    username: null,
    loading: true,
  });

  useEffect(() => {
    // Check localStorage first
    const storedLoggedIn = localStorage.getItem("isLoggedIn");
    const storedRole = localStorage.getItem("role");
    const storedUsername = localStorage.getItem("username");

    if (storedLoggedIn === "true" && storedRole && storedUsername) {
      setAuth({ loggedIn: true, role: storedRole, username: storedUsername, loading: false });
    } else {
      // Optional: fetch backend once if nothing in localStorage
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/check-session`, {
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
            setAuth({ loggedIn: false, role: null, username: null, loading: false });
          }
        })
        .catch(() => setAuth({ loggedIn: false, role: null, username: null, loading: false }));
    }
  }, []);

  return <AuthContext.Provider value={{ auth, setAuth }}>{children}</AuthContext.Provider>;
};
