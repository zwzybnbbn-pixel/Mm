import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1. إعدادات سوبابيس (تأكد من استخدام Anon Key)
const supabaseUrl = "https://gxuumjhtutkipvkljjhj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dXVtamh0dXRraXB2a2xqamhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTM2MzEsImV4cCI6MjA4MTEyOTYzMX0.rmsSRTQ57cAJ3VAiQMe0mdxEYcERh6zQDep7DN_frFI";

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * دالة جلب الـ IP الحالي للمستخدم (مع محاولة بديلة في حال الفشل)
 */
export async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return data.ip;
        } catch (e) {
            console.error("تعذر جلب الـ IP:", e);
            return 'unknown';
        }
    }
}

/**
 * دالة الكاش الذكي: تعرض البيانات من المتحدث فوراً ثم تحدثها من السيرفر في الخلفية
 */
export async function fetchWithSmartCache(cacheKey, fetchCallback, onUpdate = null) {
    const cached = localStorage.getItem(cacheKey);
    let cachedData = null;

    if (cached) {
        try {
            cachedData = JSON.parse(cached);
        } catch (e) {
            localStorage.removeItem(cacheKey);
        }
    }

    const performFetch = async () => {
        try {
            const freshData = await fetchCallback();
            if (freshData) {
                const freshDataStr = JSON.stringify(freshData);
                // تحديث الكاش فقط إذا كانت البيانات الجديدة مختلفة
                if (freshDataStr !== cached) {
                    localStorage.setItem(cacheKey, freshDataStr);
                    // إذا وجدنا تحديثات وكان هناك كاش قديم، نبلغ الواجهة لتتحدث
                    if (onUpdate && cached) {
                        onUpdate(freshData);
                    }
                }
            }
            return freshData;
        } catch (err) {
            console.error("خطأ في جلب البيانات من السيرفر:", err.message);
            return null;
        }
    };

    // إذا وجد كاش، نرجعه فوراً ونشغل جلب البيانات في الخلفية
    if (cachedData) {
        performFetch(); 
        return cachedData;
    }

    // إذا لا يوجد كاش، ننتظر جلب البيانات لأول مرة
    return await performFetch();
}
