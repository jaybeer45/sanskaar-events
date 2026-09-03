// src/pages/Login/SignUpPage.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { register as registerUser } from "../../features/auth/slices/authSlice";
import { CITIES } from "../../features/location/locationSlice";
import { ROUTES } from "../../constants/routes";
import Input from "../../components/ui/Input/Input";
import OTP from "../../components/ui/OTP/OTP";
import { authService } from "../../services/auth.service";

const SignUpPage = () => {
  const [authError, setAuthError] = useState("");
  const [otpStage, setOtpStage] = useState("idle"); // "idle" | "sent" | "verified"
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

const handleSendOtp = async () => {
  const phone = getValues("phone");
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    setOtpError("Enter a valid 10-digit phone number first.");
    return;
  }
  setOtpError("");
  try {
    await authService.sendOtp(phone);
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
  try {
    const phone = getValues("phone");
    await authService.verifyOtp(phone, otpValue);
    setOtpStage("verified");
  } catch (err) {
    setOtpError(err?.message || "Invalid or expired code.");
  }
};

  const handleSignUp = async (data) => {
    setAuthError("");

    // if (otpStage !== "verified") {
    //   setAuthError("Please verify your phone number before continuing.");
    //   return;
    // }

    try {
      await dispatch(
        registerUser({
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          city: data.city,
          password: data.password,
          acceptedTerms: data.terms,
          acceptedPrivacy: data.terms,
          termsVersion: "v1",
          privacyVersion: "v1",
        })
      ).unwrap();

      const redirectTo = location.state?.from?.pathname;
navigate(redirectTo || ROUTES.ONBOARDING, { replace: true });
    } catch (err) {
      setAuthError(err || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-xl">
        {/* Branding Panel */}
        <div className="hidden md:flex flex-col justify-center bg-red-600 text-white p-10">
          <span className="text-2xl font-bold tracking-tight mb-8">
            SANSKAAR<span className="text-red-300">.</span>
          </span>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Join the community today.
          </h1>
          <p className="text-red-100 text-sm leading-relaxed">
            Create your account to discover events, book tickets and manage
            everything in one place.
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white p-8 sm:p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Create Account
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Already have an account?{" "}
            <Link to="/login" className="text-red-600 font-medium hover:underline">
              Sign In
            </Link>
          </p>

          {authError && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600"
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(handleSignUp)} noValidate className="space-y-5">
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              required
              error={errors.fullName?.message}
              {...register("fullName", {
                required: "Full name is required",
                minLength: { value: 2, message: "Name must be at least 2 characters" },
                maxLength: { value: 50, message: "Name must be under 50 characters" },
              })}
            />

            {/* Email */}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              required
              error={errors.email?.message}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
            />

            {/* Phone + Send OTP */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone <span className="text-brand-red">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="98765xxxxx"
                  disabled={otpStage !== "idle"}
                  className={`h-12 flex-1 rounded-lg border px-4 text-[15px] bg-gray-100 focus:bg-white transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
                    errors.phone
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-200 focus:ring-red-100 focus:border-brand-red"
                  }`}
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: { value: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit number" },
                  })}
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpStage !== "idle"}
                  className="shrink-0 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:border-gray-500 transition-colors disabled:opacity-50"
                >
                  {otpStage === "idle" ? "Send OTP" : "Sent"}
                </button>
              </div>
              {errors.phone && (
                <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* OTP box — sirf phone bhejne ke baad dikhega */}
            {(otpStage === "sent" || otpStage === "verified") && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Enter 6-digit code
                </label>
                <OTP
                  value={otpValue}
                  onChange={setOtpValue}
                  error={otpError}
                  disabled={otpStage === "verified"}
                />
                {otpStage === "sent" && (
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="mt-2 text-sm font-semibold text-brand-red hover:underline"
                  >
                    Verify code
                  </button>
                )}
                {otpStage === "verified" && (
                  <p className="mt-2 text-sm font-medium text-green-600">✓ Phone verified</p>
                )}
              </div>
            )}

            {/* Password + Confirm — side by side, PRD spec */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                required
                error={errors.password?.message}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Min 8 characters" },
                })}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                required
                error={errors.confirmPassword?.message}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => value === watch("password") || "Passwords do not match",
                })}
              />
            </div>

            {/* City dropdown — Bareilly default, existing CITIES list se */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                City <span className="text-brand-red">*</span>
              </label>
              <select
                defaultValue={CITIES[0].name}
                className="h-12 w-full rounded-lg border border-gray-200 bg-gray-100 px-4 text-[15px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-colors"
                {...register("city", { required: "Please select your city" })}
              >
                {CITIES.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>

            {/* Terms */}
            <div>
              <label htmlFor="terms" className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 accent-red-600"
                  {...register("terms", { required: "You must agree to the Terms & Conditions" })}
                />
                I agree to the Terms & Conditions and Privacy Policy
              </label>
              {errors.terms && (
                <p role="alert" className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;