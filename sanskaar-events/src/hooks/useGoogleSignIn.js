// src/hooks/useGoogleSignIn.js
import { useEffect, useRef } from "react";

// The Google script and initialize() must run only once per page load. Calling
// initialize() on every mount caused the "initialize() is called multiple
// times" warning, and every mount used to add another <script> tag.
let scriptPromise = null;
let initialized = false;
let activeHandler = null;

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null; // allow a retry on the next mount
      reject(new Error("Could not load Google sign-in"));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
};

// Returns a ref to attach to an empty <div>; the Google button renders inside it.
// onCredential receives Google's response ({ credential }).
const useGoogleSignIn = (onCredential, text = "continue_with") => {
  const buttonRef = useRef(null);
  const handlerRef = useRef(onCredential);

  // Always call the latest handler without re-initializing Google
  useEffect(() => {
    handlerRef.current = onCredential;
  });

  useEffect(() => {
    let cancelled = false;
    const handler = (response) => handlerRef.current?.(response);

    loadGoogleScript()
      .then(() => {
        const el = buttonRef.current;
        if (cancelled || !el || !window.google?.accounts?.id) return;

        if (!initialized) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: (response) => activeHandler?.(response),
          });
          initialized = true;
        }
        activeHandler = handler;

        el.innerHTML = "";
        window.google.accounts.id.renderButton(el, {
          theme: "outline",
          size: "large",
          width: Math.min(
            400,
            Math.max(200, Math.round(el.offsetWidth || 320)),
          ),
          text,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (activeHandler === handler) activeHandler = null;
    };
  }, [text]);

  return buttonRef;
};

export default useGoogleSignIn;
