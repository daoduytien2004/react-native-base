import type { ReactNode } from "react";
import { styled } from "nativewind";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="auth-content"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">S</Text>
              </View>
              <View>
                <Text className="auth-wordmark">Subscriptions</Text>
                <Text className="auth-wordmark-sub">TRACK SMARTER</Text>
              </View>
            </View>
            <Text className="auth-title">{title}</Text>
            <Text className="auth-subtitle">{subtitle}</Text>
          </View>
          <View className="auth-card">{children}</View>
          <Text className="mt-5 px-3 text-center text-xs font-sans-medium text-muted-foreground">
            Your subscription details stay secure and in your control.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthField({
  label,
  error,
  className,
  ...inputProps
}: TextInputProps & { label: string; error?: string; className?: string }) {
  return (
    <View className="auth-field">
      <Text className="auth-label">{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        className={`auth-input ${error ? "auth-input-error" : ""} ${className ?? ""}`}
        placeholderTextColor="#657086"
        selectionColor="#ea7a53"
      />
      {error ? <Text className="auth-error">{error}</Text> : null}
    </View>
  );
}

export function AuthButton({
  title,
  onPress,
  loading,
  disabled,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      className={`${secondary ? "auth-secondary-button" : "auth-button"} ${disabled ? "opacity-60" : ""}`}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? "#ea7a53" : "#081126"} />
      ) : (
        <Text
          className={
            secondary ? "auth-secondary-button-text" : "auth-button-text"
          }
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function AuthLink({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress}>
      <Text className="auth-link">{title}</Text>
    </Pressable>
  );
}

export function AuthAlert({ children }: { children: string }) {
  return (
    <View
      accessibilityRole="alert"
      className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3"
    >
      <Text className="auth-error">{children}</Text>
    </View>
  );
}
