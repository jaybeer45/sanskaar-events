// src/pages/Login/SignUpPage.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { register as registerUser } from "../../features/auth/slices/authSlice";
import { CITIES } from "../../features/location/locationSlice";
import { ROUTES } from "../../constants/routes";
import Input from "../../components/ui/Input/Input";
import OTP from "../../components/ui/OTP/OTP";
import { authService } from "../../services/auth.service";
import AuthShell from "./AuthShell";

// Same look as the shared Input component, for the fields that need a custom layout
const fieldClass = (hasError) =>
  `h-12 w-full rounded-xl border px-4 text-[15px] text-ink placeholder-gray-400 bg-moonlight focus:bg-white transition-colors focus:outline-none focus:ring-2 read-only:text-ink/70 disabled:cursor-not-allowed disabled:opacity-60 ${hasError ? "border-red-400 focus:ring-red-200" : "border-mist focus:ring-night/20 focus:border-night"
  }`;

const SignUpPage = () => {
  const [authError, setAuthError] = useState("");
  const [otpStage, setOtpStage] = useState("idle"); // "idle" | "sent" | "verified"
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const referredBy = searchParams.get("ref");
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

    // Phone verification is optional for now:
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
          referredBy: referredBy || undefined,
        })
      ).unwrap();

      const redirectTo = location.state?.from?.pathname;
      navigate(redirectTo || ROUTES.ONBOARDING, { replace: true });
    } catch (err) {
      setAuthError(err || "Something went wrong. Please try again.");
    }
  };

  return (
    <AuthShell
      headline="Join the community today."
      intro="Create your account to discover events, book tickets and manage everything in one place."
      points={[
        "Discover events in your city",
        "Book tickets in a minute",
        "Share videos from events you go to",
      ]}
    >
      <div className="mx-auto w-full max-w-md md:max-w-none">
        <h1 className="font-heading font-extrabold text-3xl text-night">Create your account</h1>
        <p className="mt-2 text-ink/60">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-night underline underline-offset-4 hover:text-brand-red">
            Sign in
          </Link>
        </p>

        {referredBy && (
          <p className="mt-4 rounded-xl bg-marigold-soft px-4 py-2.5 text-sm text-night">
            Referral link applied.
          </p>
        )}

        {authError && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(handleSignUp)} noValidate className="mt-6 space-y-5">
          <Input
            label="Full name"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            required
            error={errors.fullName?.message}
            {...register("fullName", {
              required: "Full name is required",
              minLength: { value: 2, message: "Name must be at least 2 characters" },
              maxLength: { value: 50, message: "Name must be under 50 characters" },
            })}
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
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

          {/* Phone and Send OTP */}
          <div>
            <label htmlFor="signup-phone" className="mb-1.5 block text-sm font-medium text-ink">
              Phone <span className="text-brand-red">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="signup-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765xxxxx"
                readOnly={otpStage !== "idle"}
                aria-invalid={errors.phone ? "true" : "false"}
                className={`${fieldClass(!!errors.phone)} min-w-0 flex-1`}
                {...register("phone", {
                  required: "Phone number is required",
                  pattern: { value: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit number" },
                })}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpStage !== "idle"}
                className="btn-outline h-12 shrink-0 !py-0 text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink"
              >
                {otpStage === "idle" ? "Send OTP" : "Sent"}
              </button>
            </div>
            {errors.phone && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.phone.message}</p>
            )}
            {otpStage === "idle" && otpError && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">{otpError}</p>
            )}
          </div>

          {/* OTP box, shown only after the code is sent */}
          {(otpStage === "sent" || otpStage === "verified") && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Enter the 6-digit code</p>
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
                  className="mt-3 text-sm font-semibold text-night underline underline-offset-4 hover:text-brand-red"
                >
                  Verify code
                </button>
              )}
              {otpStage === "verified" && (
                <p className="mt-2 text-sm font-medium text-green-700">Phone verified</p>
              )}
            </div>
          )}

          {/* Password and confirm password */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Use at least 8 characters" },
              })}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) => value === watch("password") || "Passwords do not match",
              })}
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="signup-city" className="mb-1.5 block text-sm font-medium text-ink">
              City <span className="text-brand-red">*</span>
            </label>
            <select
              id="signup-city"
              defaultValue={CITIES[0].name}
              className={fieldClass(!!errors.city)}
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
            <label htmlFor="terms" className="flex cursor-pointer items-start gap-2.5 text-sm text-ink/80">
              <input
                id="terms"
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-night"
                {...register("terms", { required: "You must agree to the Terms and Conditions" })}
              />
              I agree to the Terms and Conditions and the Privacy Policy
            </label>
            {errors.terms && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.terms.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-brand w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
};

export default SignUpPage;