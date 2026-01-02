import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// إعدادات Supabase
const supabaseUrl = "https://gxuumjhtutkipvkljjhj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dXVtamh0dXRraXB2a2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTM2MzEsImV4cCI6MjA4MTEyOTYzMX0.rmsSRTQ57cAJ3VAiQMe0mdxEYcERh6zQDep7DN_frFI";

export const supabase = createClient(supabaseUrl, supabaseKey);

// 🟢 الحصول على IP المستخدم
export async function getUserIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch {
        try {
            const res2 = await fetch('https://ipapi.co/json/');
            const data2 = await res2.json();
            return data2.ip;
        } catch {
            return '127.0.0.1';
        }
    }
}

// 🟢 كاش ذكي
export async function fetchWithSmartCache(cacheKey, fetchCallback, onUpdate = null) {
    const cached = localStorage.getItem(cacheKey);
    let cachedData = null;

    if (cached) {
        try { cachedData = JSON.parse(cached); } 
        catch { localStorage.removeItem(cacheKey); }
    }

    const performFetch = async () => {
        try {
            const freshData = await fetchCallback();
            if (freshData) {
                const freshStr = JSON.stringify(freshData);
                if (freshStr !== cached) {
                    localStorage.setItem(cacheKey, freshStr);
                    if (onUpdate && cached) onUpdate(freshData);
                }
            }
            return freshData;
        } catch (err) {
            console.error("خطأ في جلب البيانات:", err.message);
            return null;
        }
    };

    if (cachedData) { performFetch(); return cachedData; }
    return await performFetch();
}
