// src/pages/Login/LoginForm.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, otpLogin, googleLogin } from "../../features/auth/slices/authSlice";
import { ROUTES } from "../../constants/routes";
import Input from "../../components/ui/Input/Input";
import OTP from "../../components/ui/OTP/OTP";
import { authService } from "../../services/auth.service";
import useGoogleSignIn from "../../hooks/useGoogleSignIn";
import AuthShell from "./AuthShell";

const LoginPage = () => {
  const [authError, setAuthError] = useState("");
  const [mode, setMode] = useState("password"); // "password" | "otp"
  const [otpStage, setOtpStage] = useState("idle"); // "idle" | "sent" | "verifying"
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

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

  const googleBtnRef = useGoogleSignIn(handleGoogleCredential);

  // Password-based login
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

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setAuthError("");
    if (nextMode === "password") setOtpStage("idle");
  };

  return (
    <AuthShell
      headline="What's happening around you, today."
      intro="Sign in to save events, book tickets and manage your bookings."
      points={[
        "Save the events you like",
        "Book tickets in a minute",
        "See all your bookings in one place",
      ]}
    >
      <div className="mx-auto w-full max-w-sm md:max-w-none">
        <h1 className="font-heading font-extrabold text-3xl text-night">Welcome back</h1>
        <p className="mt-2 text-ink/60">Sign in to continue exploring events around you.</p>

        {authError && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {authError}
          </div>
        )}

        {/* Sign in method */}
        <div
          role="tablist"
          aria-label="Sign in method"
          className="mt-6 mb-5 flex rounded-pill bg-moonlight p-1 text-sm font-semibold"
        >
          {[
            ["password", "Password"],
            ["otp", "OTP"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => switchMode(key)}
              className={`flex-1 rounded-pill py-2.5 transition-colors ${mode === key ? "bg-white text-night shadow-sm" : "text-ink/60 hover:text-night"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(handlePasswordLogin)} noValidate className="space-y-5">
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

          {/* Password mode */}
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
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-night underline underline-offset-4 hover:text-brand-red"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          )}

          {/* OTP mode */}
          {mode === "otp" && (
            <div>
              {otpStage === "idle" && (
                <button type="button" onClick={handleSendOtp} className="btn-outline w-full">
                  Send OTP
                </button>
              )}

              {(otpStage === "sent" || otpStage === "verifying") && (
                <div>
                  <p className="mb-1.5 text-sm font-medium text-ink">Enter the 6-digit code</p>
                  <OTP
                    value={otpValue}
                    onChange={setOtpValue}
                    error={otpError}
                    disabled={otpStage === "verifying"}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="mt-3 text-sm font-medium text-night underline underline-offset-4 hover:text-brand-red"
                  >
                    Resend code
                  </button>
                </div>
              )}

              {otpStage === "idle" && otpError && (
                <p role="alert" className="mt-2 text-sm text-red-600">{otpError}</p>
              )}
            </div>
          )}

          {/* Submit: a different action in each mode */}
          {mode === "password" ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-brand w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          ) : (
            otpStage !== "idle" && (
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otpStage === "verifying"}
                  className="btn-brand w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-70"
                >
                {otpStage === "verifying" ? "Verifying..." : "Verify and sign in"}
              </button>
            )
          )}
        </form>

        {/* Google */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-mist" />
          <span className="text-sm text-ink/50">or</span>
          <div className="h-px flex-1 bg-mist" />
        </div>
        <div ref={googleBtnRef} className="mt-5 flex min-h-[44px] w-full justify-center" />

        <p className="mt-6 text-center text-sm text-ink/60">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-night underline underline-offset-4 hover:text-brand-red">
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default LoginPage;