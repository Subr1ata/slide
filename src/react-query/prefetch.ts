import { getAllAutomations, getAutomationInfo } from "@/actions/automations";
// import { onUserInfo } from '@/actions/user'
import { onUserInfo } from "@/actions/user";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

const prefetch = async (
  client: QueryClient,
  action: QueryFunction,
  key: string
) => {
  return await client.prefetchQuery({
    queryKey: [key],
    queryFn: action,
    staleTime: 60000,
  });
};

export const PrefetchUserProfile = async (client: QueryClient) => {
  return await prefetch(client, onUserInfo, "user-profile"); // keys in 3rd argument are used for validating cached data.
};

export const PrefetchUserAutomations = async (client: QueryClient) => {
  return await prefetch(client, getAllAutomations, "user-automations"); // 3rd argument represents this version of cache data okay so every key represents cache data if you invalidate this key it will also invalidate all the data that's stored with this key okay so that's why we're passing in this key that's why it's called query key
};

export const PrefetchUserAutomation = async (
  client: QueryClient,
  automationId: string
) => {
  return await prefetch(
    client,
    () => getAutomationInfo(automationId),
    "automation-info"
  );
};
