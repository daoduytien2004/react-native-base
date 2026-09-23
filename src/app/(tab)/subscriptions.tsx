import SubscriptionCard from "@/components/SubscriptionCard";
import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import { styled } from "nativewind";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
  const [query, setQuery] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);

  const filteredSubscriptions = useMemo(() => {
    const searchTerm = query.trim().toLocaleLowerCase();
    if (!searchTerm) return HOME_SUBSCRIPTIONS;

    return HOME_SUBSCRIPTIONS.filter((subscription) =>
      [
        subscription.name,
        subscription.category,
        subscription.plan,
        subscription.paymentMethod,
        subscription.status,
      ].some((value) => value?.toLocaleLowerCase().includes(searchTerm)),
    );
  }, [query]);

  return (
    <SafeAreaView className="flex-1 bg-background px-5 pt-5">
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() =>
              setExpandedSubscriptionId((currentId) =>
                currentId === item.id ? null : item.id,
              )
            }
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListHeaderComponent={
          <View className="mb-5">
            <Text className="text-2xl font-sans-bold text-primary">
              Subscriptions
            </Text>
            <View className="mt-5 h-14 flex-row items-center rounded-2xl border border-border bg-card px-4">
              <Text
                accessibilityElementsHidden
                className="mr-3 text-2xl text-muted-foreground"
              >
                ⌕
              </Text>
              <TextInput
                accessibilityLabel="Search subscriptions"
                autoCapitalize="none"
                autoCorrect={false}
                className="min-w-0 flex-1 py-3 text-base font-sans-medium text-primary"
                placeholder="Search subscriptions"
                placeholderTextColor="#657086"
                returnKeyType="search"
                value={query}
                onChangeText={(value) => {
                  setQuery(value);
                  setExpandedSubscriptionId(null);
                }}
              />
              {query.length > 0 ? (
                <Pressable
                  accessibilityLabel="Clear search"
                  accessibilityRole="button"
                  className="ml-2 size-8 items-center justify-center rounded-full bg-muted"
                  hitSlop={8}
                  onPress={() => setQuery("")}
                >
                  <Text className="font-sans-semibold text-primary">×</Text>
                </Pressable>
              ) : null}
            </View>
            <Text className="mt-4 text-sm font-sans-medium text-muted-foreground">
              {filteredSubscriptions.length} {filteredSubscriptions.length === 1 ? "subscription" : "subscriptions"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center rounded-2xl border border-border bg-card px-5 py-8">
            <Text className="text-base font-sans-semibold text-primary">
              No subscriptions found
            </Text>
            <Text className="mt-2 text-center text-sm font-sans-medium text-muted-foreground">
              Try another name, category, plan, or payment method.
            </Text>
          </View>
        }
        contentContainerClassName="pb-30"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default Subscriptions;
