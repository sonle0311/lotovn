import { supabase } from "./supabaseClient";

/**
 * Ensure this browser has a stable authenticated identity.
 * Uses Supabase anonymous auth so we can bind permissions to auth.uid().
 */
export async function ensureUserId(): Promise<string> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) return user.id;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user?.id) {
        throw new Error(error?.message || "Anonymous sign-in failed");
    }

    return data.user.id;
}
