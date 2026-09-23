import { useClerk, useUser } from "@clerk/expo";
import { styled } from "nativewind";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { AuthAlert } from "@/components/AuthUI";

const SafeAreaView = styled(RNSafeAreaView);

function formatJoinedDate(date: Date | null | undefined) {
  if (!date || Number.isNaN(date.getTime())) return "—";
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

const Settings = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const displayName = user?.fullName || email.split("@")[0] || "Your account";
  const initials = displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    setBusy(true);
    setError("");
    try {
      await signOut();
    } catch {
      setError("We couldn’t sign you out. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-4 pt-4">
      <Text className="text-2xl font-sans-bold text-primary">Settings</Text>

      <View className="mt-7 min-h-24 flex-row items-center rounded-2xl border border-border bg-card px-4 py-4">
        <View className="mr-3 size-12 items-center justify-center overflow-hidden rounded-xl bg-muted">
          {user?.imageUrl ? (
            <Image
              accessibilityLabel={`${displayName} profile photo`}
              className="size-12"
              resizeMode="cover"
              source={{ uri: user.imageUrl }}
            />
          ) : (
            <Text className="font-sans-bold text-primary">{initials || "S"}</Text>
          )}
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-sans-bold text-primary" numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="mt-0.5 text-xs font-sans-medium text-muted-foreground" numberOfLines={1}>
            {email || "No email address"}
          </Text>
        </View>
      </View>

      <View className="mt-5 rounded-2xl border border-border bg-card p-4">
        <Text className="mb-4 text-base font-sans-bold text-primary">Account</Text>
        <View className="flex-row items-center justify-between gap-4">
          <Text className="text-xs font-sans-medium text-muted-foreground">Account ID</Text>
          <Text
            className="min-w-0 flex-1 text-right text-xs font-sans-semibold text-primary"
            ellipsizeMode="middle"
            numberOfLines={1}
          >
            {user?.id ?? "—"}
          </Text>
        </View>
        <View className="mt-4 flex-row items-center justify-between gap-4">
          <Text className="text-xs font-sans-medium text-muted-foreground">Joined</Text>
          <Text className="text-xs font-sans-semibold text-primary">
            {formatJoinedDate(user?.createdAt)}
          </Text>
        </View>
      </View>

      {error ? <View className="mt-4"><AuthAlert>{error}</AuthAlert></View> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy, busy }}
        className="mt-3 h-12 items-center justify-center rounded-xl bg-accent"
        disabled={busy}
        onPress={handleSignOut}
      >
        {busy ? (
          <ActivityIndicator color="#081126" />
        ) : (
          <Text className="text-sm font-sans-semibold text-primary">Sign Out</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
};

export default Settings;
