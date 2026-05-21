import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useInstagramProfiles() {
  return useQuery({
    queryKey: ["instagram-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("instagram_profiles")
        .select("*")
        .order("criado_em", { ascending: false });
      return data || [];
    },
  });
}

export function useInstagramProfileInsights(profileId: string) {
  return useQuery({
    queryKey: ["instagram-profile-insights", profileId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data } = await supabase
        .from("instagram_profile_insights")
        .select("*")
        .eq("profile_id", profileId)
        .gte("data", thirtyDaysAgo.toISOString().split("T")[0])
        .order("data", { ascending: true });
      return data || [];
    },
    enabled: !!profileId,
  });
}

export function useInstagramMedia(profileId: string) {
  return useQuery({
    queryKey: ["instagram-media", profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from("instagram_media")
        .select(
          `
          *,
          instagram_media_insights (
            reach,
            views,
            likes,
            comments,
            shares,
            saved,
            total_interactions
          )
        `,
        )
        .eq("profile_id", profileId)
        .order("timestamp", { ascending: false });
      return data || [];
    },
    enabled: !!profileId,
  });
}
