// src/pages/Login/ForgotPasswordPage.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import Input from "../../components/ui/Input/Input";
import OTP from "../../components/ui/OTP/OTP";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState("identify"); // "identify" | "otp" | "reset" | "done"
  const [identifier, setIdentifier] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [pageError, setPageError] = useState("");

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

  // Step 1: identifier submit -> send OTP
  const handleIdentifySubmit = async (data) => {
    setPageError("");
    try {
      await authService.sendOtp(data.identifier);
      setIdentifier(data.identifier);
      setStep("otp");
    } catch (err) {
      setPageError(err?.message || "Could not send OTP.");
    }
  };

  // Step 2: verify OTP
  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      setOtpError("Enter the complete 6-digit code.");
      return;
    }
    setOtpError("");
    try {
      await authService.verifyOtp(identifier, otpValue);
      setStep("reset");
    } catch (err) {
      setOtpError(err?.message || "Invalid or expired code.");
    }
  };

  // Step 3: set new password
  const handleResetSubmit = async (data) => {
    setPageError("");
    try {
      await authService.resetPassword(identifier, data.newPassword);
      setStep("done");
    } catch (err) {
      setPageError(err?.message || "Could not reset password.");
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 px-4 py-10 min-h-screen">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 shadow-xl rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h2>
        <p className="text-sm text-gray-500 mb-6">
          Remembered it?{" "}
          <Link to="/login" className="text-brand-red font-medium hover:underline">
            Back to Sign In
          </Link>
        </p>

        {pageError && (
          <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {pageError}
          </div>
        )}

        {/* STEP 1: identifier */}
        {step === "identify" && (
          <form onSubmit={handleSubmit(handleIdentifySubmit)} noValidate className="space-y-5">
            <Input
              label="Email or phone"
              type="text"
              placeholder="you@email.com or 98765xxxxx"
              required
              error={errors.identifier?.message}
              {...register("identifier", { required: "Email or phone is required" })}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-brand-red py-3 font-semibold text-white transition hover:bg-brand-red-hover disabled:opacity-70"
            >
              Send OTP
            </button>
          </form>
        )}

        {/* STEP 2: OTP */}
        {step === "otp" && (
          <div className="space-y-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Enter 6-digit code
            </label>
            <OTP value={otpValue} onChange={setOtpValue} error={otpError} />
            <button
              type="button"
              onClick={handleVerifyOtp}
              className="w-full rounded-lg bg-brand-red py-3 font-semibold text-white transition hover:bg-brand-red-hover"
            >
              Verify code
            </button>
          </div>
        )}

        {/* STEP 3: new password */}
        {step === "reset" && (
          <form onSubmit={handleSubmit(handleResetSubmit)} noValidate className="space-y-5">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              required
              error={errors.newPassword?.message}
              {...register("newPassword", {
                required: "New password is required",
                minLength: { value: 8, message: "Min 8 characters" },
              })}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              required
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", {
                required: "Please confirm your new password",
                validate: (value) => value === watch("newPassword") || "Passwords do not match",
              })}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-brand-red py-3 font-semibold text-white transition hover:bg-brand-red-hover disabled:opacity-70"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* STEP 4: done */}
        {step === "done" && (
          <div className="text-center space-y-4">
            <p className="text-sm font-medium text-green-600">
              ✓ Password reset successful.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full rounded-lg bg-brand-red py-3 font-semibold text-white transition hover:bg-brand-red-hover"
            >
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;