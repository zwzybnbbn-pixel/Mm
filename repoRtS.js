// =========================
// 🌐 استيراد Supabase
// =========================
import { supabase } from './supabase.js';

// =========================
// 🖥️ عناصر DOM
// =========================
const form = document.getElementById('reportForm');
const submitBtn = document.getElementById('submitBtn');
const list = document.getElementById('list');
const alertContainer = document.getElementById('alertContainer');
const reportsCount = document.getElementById('reportsCount');
const progressFill = document.getElementById('progressFill');

// =========================
// 🟢 دوال مساعدة
// =========================

// عرض رسائل التنبيه
function showAlert(message, type = 'success') {
    if (!alertContainer) return;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    const icon = document.createElement('i');
    icon.className = `fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'times-circle'}`;
    alertDiv.appendChild(icon);
    alertDiv.appendChild(document.createTextNode(' ' + message));
    alertContainer.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

// تنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// جلب IP المستخدم
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        try {
            const fallbackResponse = await fetch('https://api64.ipify.org?format=json');
            const fallbackData = await fallbackResponse.json();
            return fallbackData.ip;
        } catch {
            return '127.0.0.1';
        }
    }
}

// التحقق من إمكانية إرسال بلاغ جديد
async function canSubmitReport(ip) {
    try {
        const lastSubmission = localStorage.getItem('last_report_submission');
        if (lastSubmission) {
            const lastDate = new Date(lastSubmission);
            const now = new Date();
            const hoursDiff = (now - lastDate) / (1000 * 60 * 60);
            if (hoursDiff < 24) {
                return {
                    canSubmit: false,
                    reason: `يمكنك إرسال بلاغ جديد بعد ${(24 - hoursDiff).toFixed(1)} ساعة`
                };
            }
        }

        const { data: lastReports, error } = await supabase
            .from('reports')
            .select('created_at')
            .eq('ip', ip)
            .order('created_at', { ascending: false })
            .limit(1);
        if (error) throw error;

        if (lastReports && lastReports.length > 0) {
            const lastDate = new Date(lastReports[0].created_at);
            const now = new Date();
            const hoursDiff = (now - lastDate) / (1000 * 60 * 60);
            if (hoursDiff < 24) {
                return {
                    canSubmit: false,
                    reason: `لا يمكن إرسال أكثر من بلاغ خلال 24 ساعة. تبقى ${(24 - hoursDiff).toFixed(1)} ساعة`
                };
            }
        }

        return { canSubmit: true };
    } catch (error) {
        console.error('خطأ في التحقق:', error);
        return { canSubmit: true };
    }
}

// إنشاء عنصر بلاغ
function createReportElement(report) {
    const date = formatDate(report.created_at);

    let statusClass = 'status-pending';
    let statusIcon = 'fas fa-clock';
    if (report.status === 'جارِ الحل') { statusClass = 'status-progress'; statusIcon = 'fas fa-tools'; }
    else if (report.status === 'تم الحل') { statusClass = 'status-solved'; statusIcon = 'fas fa-check-circle'; }

    const reportItem = document.createElement('div');
    reportItem.className = 'report-item';
    reportItem.id = `report-${report.id}`;

    const reportMeta = document.createElement('div');
    reportMeta.className = 'report-meta';

    const createMetaItem = (iconClass, labelText, valueText) => {
        const item = document.createElement('div');
        item.className = 'meta-item';
        const label = document.createElement('strong');
        const icon = document.createElement('i');
        icon.className = iconClass;
        label.appendChild(icon);
        label.appendChild(document.createTextNode(' ' + labelText));
        const value = document.createElement('span');
        value.textContent = valueText || 'غير محدد';
        item.appendChild(label);
        item.appendChild(value);
        return item;
    };

    reportMeta.appendChild(createMetaItem('fas fa-user', 'المرسل', report.name));
    reportMeta.appendChild(createMetaItem('fas fa-bolt', 'النوع', report.type));
    reportMeta.appendChild(createMetaItem('fas fa-map-marker-alt', 'الموقع', report.location));
    reportMeta.appendChild(createMetaItem('fas fa-phone', 'الهاتف', report.phone));

    const detailsItem = document.createElement('div');
    detailsItem.className = 'meta-item';
    detailsItem.style.gridColumn = '1 / -1';
    const detailsLabel = document.createElement('strong');
    const detailsIcon = document.createElement('i');
    detailsIcon.className = 'fas fa-info-circle';
    detailsLabel.appendChild(detailsIcon);
    detailsLabel.appendChild(document.createTextNode(' التفاصيل'));
    const detailsValue = document.createElement('span');
    detailsValue.textContent = report.details || 'لا توجد تفاصيل';
    detailsItem.appendChild(detailsLabel);
    detailsItem.appendChild(detailsValue);

    const statusBadge = document.createElement('div');
    statusBadge.className = `${statusClass} status-badge`;
    const statusIconEl = document.createElement('i');
    statusIconEl.className = statusIcon;
    statusBadge.appendChild(statusIconEl);
    statusBadge.appendChild(document.createTextNode(' ' + (report.status || 'قيد المراجعة')));

    reportItem.appendChild(reportMeta);
    reportItem.appendChild(detailsItem);
    reportItem.appendChild(statusBadge);

    if (report.reply) {
        const replyBox = document.createElement('div');
        replyBox.className = 'reply-box';
        const replyLabel = document.createElement('strong');
        const replyIcon = document.createElement('i');
        replyIcon.className = 'fas fa-reply';
        replyLabel.appendChild(replyIcon);
        replyLabel.appendChild(document.createTextNode(' رد الإدارة'));
        const replyText = document.createElement('p');
        replyText.textContent = report.reply;
        replyBox.appendChild(replyLabel);
        replyBox.appendChild(replyText);
        reportItem.appendChild(replyBox);
    }

    const reportDate = document.createElement('div');
    reportDate.className = 'report-date';
    const dateIcon = document.createElement('i');
    dateIcon.className = 'far fa-clock';
    reportDate.appendChild(dateIcon);
    reportDate.appendChild(document.createTextNode(' ' + date));
    reportItem.appendChild(reportDate);

    return reportItem;
}

// =========================
// 📝 إرسال بلاغ جديد
// =========================
form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    let session = (await supabase.auth.getSession()).data.session;
    if (!session) {
        const { data } = await supabase.auth.signInAnonymously();
        session = data.session;
    }

    const officialUserId = session.user.id;
    const userIP = await getUserIP();
    const checkResult = await canSubmitReport(userIP);
    if (!checkResult.canSubmit) {
        showAlert(`❌ ${checkResult.reason}`, 'warning');
        return;
    }

    const reportData = {
        type: document.getElementById('type')?.value || '',
        name: document.getElementById('name')?.value.trim().slice(0, 20) || '',
        phone: document.getElementById('phone')?.value.trim().slice(0, 9) || '',
        location: document.getElementById('location')?.value.trim().slice(0, 10) || '',
        details: document.getElementById('details')?.value.trim().slice(0, 50) || '',
        ip: userIP,
        user_id: officialUserId,
        status: 'قيد المراجعة',
        reply: '',
        created_at: new Date().toISOString()
    };

    if (!reportData.name || !reportData.location || !reportData.details) {
        showAlert('⚠️ يرجى ملء جميع الحقول المطلوبة', 'warning');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 10;
        progressFill.style.width = `${progress}%`;
        if (progress >= 90) clearInterval(progressInterval);
    }, 100);

    try {
        const { data, error } = await supabase.from('reports').insert([reportData]).select();
        if (error) throw error;

        progressFill.style.width = '100%';
        localStorage.setItem('last_report_submission', new Date().toISOString());
        showAlert('✅ تم إرسال البلاغ بنجاح. رقم البلاغ: ' + data[0].id.substring(0, 8), 'success');
        form.reset();
        setTimeout(() => loadReports(), 1000);

    } catch (error) {
        console.error('خطأ في إرسال البلاغ:', error);
        showAlert('❌ حدث خطأ أثناء إرسال البلاغ', 'error');
    } finally {
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال البلاغ';
            progressFill.style.width = '0%';
            clearInterval(progressInterval);
        }, 1500);
    }
});

// =========================
// 📋 تحميل وعرض البلاغات
// =========================
async function loadReports() {
    if (!list) return;

    list.textContent = '⏳ جاري تحميل البلاغات...';

    try {
        let { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (error) throw error;
            session = data.session;
        }

        const myUserId = session.user.id;

        const { data: myReports, error } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', myUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        list.textContent = '';
        reportsCount && (reportsCount.textContent = `${myReports.length} بلاغ`);

        if (!myReports || myReports.length === 0) {
            list.textContent = 'لا توجد بلاغات بعد';
            return;
        }

        myReports.forEach(report => {
            list.appendChild(createReportElement(report));
        });

    } catch (err) {
        console.error('❌ خطأ في تحميل البلاغات:', err);
        list.textContent = 'تعذر تحميل البلاغات';
    }
}

// =========================
// 🚀 تهيئة الصفحة مع Realtime
// =========================
async function init() {
    await loadReports();

    let { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        const { data } = await supabase.auth.signInAnonymously();
        session = data.session;
    }
    const myUserId = session.user.id;
    const cacheKey = `reports_cache_${myUserId}`;

    supabase
        .channel('realtime-reports')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `user_id=eq.${myUserId}` }, (payload) => {
            const oldReports = JSON.parse(localStorage.getItem(cacheKey)) || [];
            
            if (payload.eventType === 'DELETE') {
                const id = payload.old.id;
                const index = oldReports.findIndex(r => r.id === id);
                if (index !== -1) oldReports.splice(index, 1);
            } else if (payload.eventType === 'INSERT') {
                oldReports.unshift(payload.new);
            } else if (payload.eventType === 'UPDATE') {
                const index = oldReports.findIndex(r => r.id === payload.new.id);
                if (index !== -1) oldReports[index] = payload.new;
            }

            localStorage.setItem(cacheKey, JSON.stringify(oldReports));

            // إعادة عرض البلاغات مباشرة
            list.textContent = '';
            reportsCount && (reportsCount.textContent = `${oldReports.length} بلاغ`);
            oldReports.forEach(report => list.appendChild(createReportElement(report)));
        })
        .subscribe();
}

// =========================
// 🌟 بدء التهيئة
// =========================
init();
