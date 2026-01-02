import { supabase, fetchWithSmartCache } from './supabase.js';

const params = new URLSearchParams(window.location.search);
const doctorId = params.get("id");

const daysArabic = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const daysEnglish = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function createEl(tag, props = {}, text = '') {
    const el = document.createElement(tag);
    Object.assign(el, props);
    if (text) el.textContent = text;
    return el;
}

function getTodayKey() {
    const jsDay = new Date().getDay();
    const mapping = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
    const index = mapping[jsDay];
    return daysEnglish[index];
}

// دالة العرض المنفصلة (لتسهيل تحديث الشاشة عند وجود جديد)
function renderDoctorUI(doctor) {
    if (!doctor) return;

    document.getElementById('docName').textContent = doctor.name || 'دكتور';
    document.getElementById('docSpec').textContent = doctor.specialty || 'تخصص عام';
    document.getElementById('docHospital').textContent = doctor.hospital || 'غير محدد';
    document.getElementById('docPhone').textContent = doctor.phone || 'غير متوفر';
    document.getElementById('docImg').src = doctor.img || 'https://via.placeholder.com/150';

    if (doctor.notes && doctor.notes.trim() !== '') {
        document.getElementById('docNotes').textContent = doctor.notes;
        document.getElementById('notesSection').style.display = 'block';
    } else {
        document.getElementById('notesSection').style.display = 'none';
    }

    const tbody = document.getElementById('scheduleBody');
    tbody.textContent = '';
    const todayKey = getTodayKey();

    daysEnglish.forEach((dayKey, index) => {
        const isToday = (dayKey === todayKey);
        const tr = createEl('tr', { className: isToday ? 'today-row' : '' });
        
        const tdDay = createEl('td', {}, daysArabic[index]);
        if (isToday) {
            const badge = createEl('span', { className: 'today-badge' });
            tdDay.appendChild(badge);
        }

        let timeText = '—';
        if (doctor.schedule && doctor.schedule[dayKey] && doctor.schedule[dayKey].time) {
            timeText = doctor.schedule[dayKey].time;
        }
        const tdTime = createEl('td', {}, timeText);

        tr.append(tdDay, tdTime);
        tbody.appendChild(tr);
    });

    showContent();
}

async function loadDoctor() {
    if (!doctorId) { showError(); return; }

    try {
        // مفتاح فريد لكل طبيب لضمان تخزين مستقل
        const cacheKey = `doctor_data_${doctorId}`;

        // استخدام الكاش الذكي: يعرض القديم فوراً ويبحث عن الجديد في الخلفية
        const doctor = await fetchWithSmartCache(
            cacheKey,
            async () => {
                // دالة الجلب الأصلية من سوبابيس
                const { data, error } = await supabase
                    .from('doctors')
                    .select('*')
                    .eq('id', doctorId)
                    .single();
                if (error) throw error;
                return data;
            },
            (updatedDoctor) => {
                // هذه الدالة ستعمل فقط إذا اكتشف الكاش أن البيانات في سوبابيس تغيرت
                console.log("🔄 تحديث تلقائي: البيانات تغيرت في السيرفر.");
                renderDoctorUI(updatedDoctor);
            }
        );

        // عرض بيانات الكاش (أو البيانات الجديدة إذا كان أول دخول)
        if (doctor) {
            renderDoctorUI(doctor);
        } else {
            throw new Error("Doctor not found");
        }

    } catch (err) {
        console.error('خطأ:', err);
        showError();
    }
}

function showContent() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
}

function showError() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    loadDoctor();
    document.getElementById('retryBtn').onclick = () => {
        localStorage.removeItem(`doctor_data_${doctorId}`); // مسح الكاش عند طلب "إعادة المحاولة"
        location.reload();
    };
});
