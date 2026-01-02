import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://gxuumjhtutkipvkljjhj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dXVtamh0dXRraXB2a2xqamhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTM2MzEsImV4cCI6MjA4MTEyOTYzMX0.rmsSRTQ57cAJ3VAiQMe0mdxEYcERh6zQDep7DN_frFI";

export const supabase = createClient(supabaseUrl, supabaseKey);

// دالة تضمن حصول المستخدم على هوية رسمية مشفرة
export async function ensureAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        // إذا لم يكن لديه هوية، ننشئ له واحدة مجهولة فوراً
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) console.error("Auth Error:", error.message);
        return data.user?.id;
    }
    return session.user.id;
}
