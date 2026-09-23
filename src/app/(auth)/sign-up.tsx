import { useSignUp } from "@clerk/expo";
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

type SignUpStep = "details" | "verify";

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

export default function SignUp() {
  const { signUp } = useSignUp();
  const router = useRouter();
  const [step, setStep] = useState<SignUpStep>("details");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const startSignUp = async () => {
    const email = emailAddress.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await signUp.password({ emailAddress: email, password });
      if (result.error) {
        setError(getErrorMessage(result.error, "We couldn’t create your account. Please try again."));
        return;
      }

      if (signUp.status === "complete") {
        const finalized = await signUp.finalize();
        if (finalized.error) {
          setError(getErrorMessage(finalized.error, "Your account was created, but we couldn’t sign you in. Please try again."));
          return;
        }
        router.replace("/(tab)");
        return;
      }

      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) {
        setError(getErrorMessage(sent.error, "We couldn’t send a verification code. Please try again."));
        return;
      }
      setStep("verify");
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn’t create your account. Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  };

  const verifyEmail = async () => {
    if (!/^\d{4,10}$/.test(code.trim())) {
      setError("Enter the verification code from your email.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const verified = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });
      if (verified.error) {
        setError(getErrorMessage(verified.error, "That code didn’t work. Check it and try again."));
        return;
      }
      if (signUp.status !== "complete") {
        setError("Your account needs another step. Please try again or contact support.");
        return;
      }
      const finalized = await signUp.finalize();
      if (finalized.error) {
        setError(getErrorMessage(finalized.error, "Your email is verified, but we couldn’t sign you in. Please try again."));
        return;
      }
      router.replace("/(tab)");
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn’t verify your email. Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await signUp.verifications.sendEmailCode();
      if (result.error) {
        setError(getErrorMessage(result.error, "We couldn’t resend the code. Please try again."));
      }
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn’t resend the code. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const changeEmail = async () => {
    setBusy(true);
    try {
      const result = await signUp.reset();
      if (result.error) {
        setError(getErrorMessage(result.error, "We couldn’t restart sign-up. Please try again."));
        return;
      }
      setStep("details");
      setCode("");
      setError("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={step === "verify" ? "Check your email" : "Create your account"}
      subtitle={
        step === "verify"
          ? `We sent a verification code to ${emailAddress.trim()}.`
          : "Stay on top of every renewal with one clear view of your subscriptions."
      }
    >
      <View className="auth-form">
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        {step === "details" ? (
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              secureTextEntry
              textContentType="newPassword"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError("");
              }}
              onSubmitEditing={startSignUp}
            />
            <Text className="auth-helper">
              Use 8 or more characters. You can change your password anytime.
            </Text>
            <AuthButton
              title="Create account"
              loading={busy}
              onPress={startSignUp}
            />
            {PlatformCaptcha()}
          </>
        ) : (
          <>
            <AuthField
              label="Email verification code"
              autoComplete="one-time-code"
              keyboardType="number-pad"
              maxLength={10}
              placeholder="Enter your code"
              textContentType="oneTimeCode"
              value={code}
              onChangeText={(value) => {
                setCode(value.replace(/\D/g, ""));
                setError("");
              }}
              onSubmitEditing={verifyEmail}
            />
            <AuthButton title="Verify email" loading={busy} onPress={verifyEmail} />
            <View className="auth-link-row">
              <Text className="auth-link-copy">Didn’t get the email?</Text>
              <AuthLink title="Resend code" onPress={resendCode} />
            </View>
            <Pressable className="mt-4 items-center" disabled={busy} onPress={changeEmail}>
              <Text className="auth-helper">Use a different email</Text>
            </Pressable>
          </>
        )}
      </View>
      {step === "details" ? (
        <View className="auth-link-row">
          <Text className="auth-link-copy">Already have an account?</Text>
          <Link href="/(auth)/sign-in" asChild>
            <Text className="auth-link">Sign in</Text>
          </Link>
        </View>
      ) : null}
    </AuthLayout>
  );
}

function PlatformCaptcha() {
  return <View nativeID="clerk-captcha" />;
}
