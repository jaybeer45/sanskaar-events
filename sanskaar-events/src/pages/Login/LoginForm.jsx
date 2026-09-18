// src/pages/Login/LoginPage.jsx
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, otpLogin, googleLogin } from "../../features/auth/slices/authSlice";
import { ROUTES } from "../../constants/routes";
import Input from "../../components/ui/Input/Input";
import OTP from "../../components/ui/OTP/OTP";
import { authService } from "../../services/auth.service";

const LoginPage = () => {
  const [authError, setAuthError] = useState("");
  const [mode, setMode] = useState("password"); // "password" | "otp"
  const [otpStage, setOtpStage] = useState("idle"); // "idle" | "sent" | "verifying"
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const googleBtnRef = useRef(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

  const redirectAfterLogin = (roles = []) => {
    const redirectTo = location.state?.from?.pathname;
    if (redirectTo) return navigate(redirectTo, { replace: true });
    if (roles.includes("admin")) return navigate(ROUTES.ADMIN, { replace: true });
    if (roles.includes("organizer")) return navigate(ROUTES.ORGANIZER_SUBMIT, { replace: true });
    navigate(ROUTES.HOME, { replace: true });
  };

  const handleGoogleCredential = async (response) => {
    setAuthError("");
    try {
      const result = await dispatch(googleLogin(response.credential)).unwrap();
      redirectAfterLogin(result.user.roles);
    } catch (err) {
      setAuthError(err || "Google sign-in failed.");
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
  }, []);

  // Password-based login (existing flow)
  const handlePasswordLogin = async (data) => {
    setAuthError("");
    try {
      const result = await dispatch(
        login({ email: data.emailOrPhone, password: data.password })
      ).unwrap();
      redirectAfterLogin(result.user.roles);
    } catch (err) {
      setAuthError(err || "Invalid email/phone or password.");
    }
  };



  const handleSendOtp = async () => {
    const emailOrPhone = getValues("emailOrPhone");
    if (!emailOrPhone) {
      setAuthError("Please enter your email or phone first.");
      return;
    }
    setAuthError("");
    setOtpError("");
    try {
      await authService.sendOtp(emailOrPhone);
      setOtpStage("sent");
    } catch (err) {
      setOtpError(err?.message || "Could not send OTP.");
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      setOtpError("Enter the complete 6-digit code.");
      return;
    }
    setOtpError("");
    setOtpStage("verifying");
    try {
      const emailOrPhone = getValues("emailOrPhone");
      const result = await dispatch(
        otpLogin({ identifier: emailOrPhone, code: otpValue })
      ).unwrap();
      redirectAfterLogin(result.user.roles);
    } catch (err) {
      setOtpError(err?.message || err || "Invalid or expired code.");
      setOtpStage("sent");
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-xl">
        {/* Branding panel */}
        <div className="hidden md:flex flex-col justify-center bg-brand-red text-white p-10">
          <span className="text-2xl font-bold tracking-tight mb-8">
            SANSKAAR<span className="text-red-300">.</span>
          </span>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            What&apos;s happening around you, today.
          </h1>
          <p className="text-red-100 text-sm leading-relaxed">
            Sign in to save events, book tickets and manage your bookings.
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white p-8 sm:p-10 flex flex-col justify-center">
          <div className="text-center md:text-left mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to continue exploring events around you.
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600"
            >
              {authError}
            </div>
          )}

          {/* Mode toggle: Password vs OTP */}
          <div className="mb-5 flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => { setMode("password"); setOtpStage("idle"); setAuthError(""); }}
              className={`flex-1 rounded-md py-2 transition-colors ${mode === "password" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setMode("otp"); setAuthError(""); }}
              className={`flex-1 rounded-md py-2 transition-colors ${mode === "otp" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
            >
              OTP
            </button>
          </div>

          <form onSubmit={handleSubmit(handlePasswordLogin)} noValidate className="space-y-5">
            {/* Email or phone — combined field, PRD spec */}
            <Input
              label="Email or phone"
              type="text"
              placeholder="you@email.com or 98765xxxxx"
              required
              error={errors.emailOrPhone?.message}
              disabled={mode === "otp" && otpStage !== "idle"}
              {...register("emailOrPhone", {
                required: "Email or phone is required",
                validate: (value) => {
                  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                  const isPhone = /^[6-9]\d{9}$/.test(value);
                  return isEmail || isPhone || "Enter a valid email or 10-digit phone number";
                },
              })}
            />

            {/* PASSWORD MODE */}
            {mode === "password" && (
              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  error={errors.password?.message}
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 8, message: "Password must be at least 8 characters" },
                  })}
                />
                <div className="mt-1.5 text-right">
                  <Link to="/forgot-password" className="text-xs font-medium text-brand-red hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}

            {/* OTP MODE */}
            {mode === "otp" && (
              <div>
                {otpStage === "idle" && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:border-gray-500 transition-colors"
                  >
                    Send OTP
                  </button>
                )}

                {(otpStage === "sent" || otpStage === "verifying") && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Enter 6-digit code
                    </label>
                    <OTP
                      value={otpValue}
                      onChange={setOtpValue}
                      error={otpError}
                      disabled={otpStage === "verifying"}
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="mt-2 text-xs font-medium text-brand-red hover:underline"
                    >
                      Resend code
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Submit button — mode ke hisaab se alag action */}
            {mode === "password" ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-brand-red py-3 font-semibold text-white transition hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            ) : (
              otpStage !== "idle" && (
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpStage === "verifying"}
                  className="w-full rounded-lg bg-brand-red py-3 font-semibold text-white transition hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {otpStage === "verifying" ? "Verifying..." : "Verify & Sign In"}
                </button>
              )
            )}
          </form>

          {/* Google button */}
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div ref={googleBtnRef} className="mt-5 flex w-full justify-center" />

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-brand-red font-medium hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;