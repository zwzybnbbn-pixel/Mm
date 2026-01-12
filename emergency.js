import { supabase } from './supabase.js';

const container = document.getElementById('alerts-container');
const CACHE_KEY = 'gov_emergency_cache';

// 1. وظيفة العرض الآمن (تأكد من الاسم: renderAlerts)
function renderAlerts(data) {
    if (!data || data.length === 0) {
        container.textContent = 'الوضع مستقر حالياً في مدينة عتق.';
        return;
    }

    container.textContent = ''; // مسح آمن للمحتوى

    data.forEach(item => {
        const card = document.createElement('article');
        card.className = `alert-card alert-${item.status_type}`;

        const time = document.createElement('span');
        time.className = 'alert-time';
        const date = new Date(item.created_at);
        time.textContent = `نُشر في: ${date.toLocaleString('ar-YE')}`;

        const title = document.createElement('h3');
        title.textContent = item.title;

        const content = document.createElement('p');
        content.className = 'alert-text';
        content.textContent = item.content;

        card.append(time, title, content);
        container.appendChild(card);
    });
}

// 2. جلب البيانات الأولية مع دعم الكاش
async function fetchNews() {
    // عرض الكاش فوراً للسرعة
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) renderAlerts(JSON.parse(cached));

    try {
        const { data, error } = await supabase
            .from('emergency_news')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // تحديث الكاش والعرض الفعلي
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        renderAlerts(data); // تم تصحيح الاسم هنا من renderNews إلى renderAlerts
    } catch (err) {
        console.error('Connection error:', err.message);
    }
}

// 3. الاشتراك في البث المباشر (Realtime)
const channel = supabase
    .channel('emergency_realtime')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'emergency_news' }, 
        (payload) => {
            console.log('تحديث جديد من قاعدة البيانات:', payload);
            fetchNews(); // سيقوم بجلب البيانات الجديدة وتحديث الشاشة فوراً
        }
    )
    .subscribe((status) => {
        console.log('حالة الاشتراك المباشر:', status);
        if (status === 'CHANNEL_ERROR') {
            console.error('فشل الاتصال بالبث المباشر، تأكد من تفعيل Realtime في Supabase');
        }
    });

// إغلاق الاتصال عند مغادرة الصفحة للحفاظ على موارد السيرفر
window.addEventListener('beforeunload', () => {
    supabase.removeChannel(channel);
});

// التشغيل عند تحميل الصفحة
fetchNews();
