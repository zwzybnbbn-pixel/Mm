import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔗 رابط مشروعك
const supabaseUrl = "https://gxuumjhtutkipvkljjhj.supabase.co";

// 🔑 المفتاح العام (anon key)
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dXVtamh0dXRraXB2a2xqamhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTM2MzEsImV4cCI6MjA4MTEyOTYzMX0.rmsSRTQ57cAJ3VAiQMe0mdxEYcERh6zQDep7DN_frFI";

// 📦 إنشاء عميل Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// وظائف مساعدة
export async function checkAuth() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}