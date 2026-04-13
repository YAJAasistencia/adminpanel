import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const SESSION_KEY = "ra_user_session";

export function useRoadAssistAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedId = localStorage.getItem(SESSION_KEY);
        if (!savedId) { setLoading(false); return; }
        const { data, error } = await supabase.from("road_assist_users").select("*").eq("id", savedId).limit(1);
        const res = error ? null : (data && data.length > 0 ? data[0] : null);
        if (res[0]) {
          setUser(res[0]);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch (err) {
        console.error("Auth error:", err);
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = (u) => {
    localStorage.setItem(SESSION_KEY, u.id);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase.from("road_assist_users").select("*").eq("id", user.id).limit(1);
    const res = error ? null : (data && data.length > 0 ? data[0] : null);
    if (res[0]) setUser(res[0]);
  };

  return { user, setUser, login, logout, loading, refreshUser };
}
