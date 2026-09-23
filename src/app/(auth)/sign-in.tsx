import { useSignIn } from "@clerk/expo";
import {
  AuthAlert,
  AuthButton,
  AuthField,
  AuthLayout,
  AuthLink,
} from "@/components/AuthUI";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type Step = "credentials" | "mfa" | "reset-code" | "new-password";
type Factor = "email_code" | "phone_code" | "totp" | "backup_code";

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

export default function SignIn() {
  const { signIn } = useSignIn();
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [factor, setFactor] = useState<Factor>("email_code");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const finishSignIn = async () => {
    if (signIn.status !== "complete") {
      setError("Your sign-in needs another step. Please try again.");
      return;
    }
    const result = await signIn.finalize();
    if (result.error) {
      setError(getErrorMessage(result.error, "We couldn’t finish signing you in. Please try again."));
      return;
    }
    router.replace("/(tab)");
  };

  const startMfa = async () => {
    const options = signIn.supportedSecondFactors ?? [];
    const preferred = (["email_code", "phone_code", "totp", "backup_code"] as Factor[]).find(
      (candidate) => options.some((option) => option.strategy === candidate),
    );
    if (!preferred) {
      setError("This account requires a verification method that isn’t available here. Contact support for help signing in.");
      return;
    }
    setFactor(preferred);
    if (preferred === "email_code" || preferred === "phone_code") {
      const sent = preferred === "email_code"
        ? await signIn.mfa.sendEmailCode()
        : await signIn.mfa.sendPhoneCode();
      if (sent.error) {
        setError(getErrorMessage(sent.error, "We couldn’t send your verification code. Please try again."));
        return;
      }
    }
    setStep("mfa");
  };

  const submitCredentials = async () => {
    const email = emailAddress.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await signIn.password({ emailAddress: email, password });
      if (result.error) {
        setError(getErrorMessage(result.error, "Those details don’t match an account. Check them and try again."));
        return;
      }
      if (signIn.status === "complete") {
        await finishSignIn();
      } else if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
        await startMfa();
      } else {
        setError("We couldn’t complete sign-in with that method. Try resetting your password or contact support.");
      }
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn’t sign you in. Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  };

  const verifyMfa = async () => {
    if (!/^\d{4,10}$/.test(code.trim()) && factor !== "backup_code") {
      setError("Enter the verification code.");
      return;
    }
    if (!code.trim()) {
      setError("Enter your backup code.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const value = code.trim();
      const result = factor === "email_code"
        ? await signIn.mfa.verifyEmailCode({ code: value })
        : factor === "phone_code"
          ? await signIn.mfa.verifyPhoneCode({ code: value })
          : factor === "totp"
            ? await signIn.mfa.verifyTOTP({ code: value })
            : await signIn.mfa.verifyBackupCode({ code: value });
      if (result.error) {
        setError(getErrorMessage(result.error, "That code didn’t work. Check it and try again."));
        return;
      }
      await finishSignIn();
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn’t verify your code. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const startPasswordReset = async () => {
    const email = emailAddress.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter the email address on your account first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const created = await signIn.create({ identifier: email });
      if (created.error) {
        setError(getErrorMessage(created.error, "We couldn’t start password recovery. Check the email and try again."));
        return;
      }
      const sent = await signIn.resetPasswordEmailCode.sendCode();
      if (sent.error) {
        setError(getErrorMessage(sent.error, "We couldn’t send a reset code. Please try again."));
        return;
      }
      setStep("reset-code");
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn’t start password recovery. Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  };

  const verifyResetCode = async () => {
    if (!/^\d{4,10}$/.test(code.trim())) {
      setError("Enter the password reset code from your email.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
      if (result.error) {
        setError(getErrorMessage(result.error, "That code didn’t work. Check it and try again."));
        return;
      }
      setStep("new-password");
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn’t verify your code. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Those passwords don’t match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
        signOutOfOtherSessions: true,
      });
      if (updated.error) {
        setError(getErrorMessage(updated.error, "We couldn’t update your password. Please try again."));
        return;
      }
      await finishSignIn();
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn’t update your password. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const resendResetCode = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await signIn.resetPasswordEmailCode.sendCode();
      if (result.error) setError(getErrorMessage(result.error, "We couldn’t resend your code. Please try again."));
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn’t resend your code. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const title = step === "mfa"
    ? "Verify it’s you"
    : step === "reset-code"
      ? "Check your email"
      : step === "new-password"
        ? "Choose a new password"
        : "Welcome back";
  const subtitle = step === "mfa"
    ? factor === "totp"
      ? "Enter the code from your authenticator app."
      : factor === "backup_code"
        ? "Enter one of your saved backup codes."
        : `Enter the code sent to ${emailAddress.trim()}.`
    : step === "reset-code"
      ? `We sent a password reset code to ${emailAddress.trim()}.`
      : step === "new-password"
        ? "Choose a strong password you haven’t used here before."
        : "Sign in to see all your subscriptions in one place.";

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <View className="auth-form">
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        {step === "credentials" ? (
          <>
            <AuthField
              label="Email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              returnKeyType="next"
              textContentType="emailAddress"
              value={emailAddress}
              onChangeText={(value) => {
                setEmailAddress(value);
                setError("");
              }}
            />
            <AuthField
              label="Password"
              autoCapitalize="none"
              autoComplete="current-password"
              placeholder="Enter your password"
              secureTextEntry
              textContentType="password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError("");
              }}
              onSubmitEditing={submitCredentials}
            />
            <View className="items-end">
              <AuthLink title="Forgot password?" onPress={startPasswordReset} />
            </View>
            <AuthButton title="Sign in" loading={busy} onPress={submitCredentials} />
          </>
        ) : step === "new-password" ? (
          <>
            <AuthField
              label="New password"
              autoCapitalize="none"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              secureTextEntry
              textContentType="newPassword"
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                setError("");
              }}
            />
            <AuthField
              label="Confirm new password"
              autoCapitalize="none"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              secureTextEntry
              textContentType="newPassword"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setError("");
              }}
              onSubmitEditing={submitNewPassword}
            />
            <AuthButton title="Update password" loading={busy} onPress={submitNewPassword} />
          </>
        ) : (
          <>
            <AuthField
              label={step === "mfa" && factor === "backup_code" ? "Backup code" : "Verification code"}
              autoComplete="one-time-code"
              keyboardType={factor === "backup_code" ? "default" : "number-pad"}
              maxLength={16}
              placeholder={factor === "backup_code" ? "Enter a backup code" : "Enter your code"}
              textContentType="oneTimeCode"
              value={code}
              onChangeText={(value) => {
                setCode(value);
                setError("");
              }}
              onSubmitEditing={step === "mfa" ? verifyMfa : verifyResetCode}
            />
            <AuthButton
              title={step === "mfa" ? "Verify and sign in" : "Verify code"}
              loading={busy}
              onPress={step === "mfa" ? verifyMfa : verifyResetCode}
            />
            {step === "reset-code" ? (
              <View className="auth-link-row">
                <Text className="auth-link-copy">Didn’t get the email?</Text>
                <AuthLink title="Resend code" onPress={resendResetCode} />
              </View>
            ) : null}
          </>
        )}
      </View>
      {step === "credentials" ? (
        <View className="auth-link-row">
          <Text className="auth-link-copy">New here?</Text>
          <Link href="/(auth)/sign-up" asChild>
            <Text className="auth-link">Create an account</Text>
          </Link>
        </View>
      ) : (
        <Pressable
          className="auth-link-row"
          disabled={busy}
          onPress={() => {
            setStep("credentials");
            setCode("");
            setError("");
          }}
        >
          <Text className="auth-link">Back to sign in</Text>
        </Pressable>
      )}
    </AuthLayout>
  );
}
