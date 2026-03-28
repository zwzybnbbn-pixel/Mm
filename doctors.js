import { supabase, fetchWithSmartCache } from './supabase.js';

// عناصر DOM
const doctorsList = document.getElementById('doctorsList');
const searchInput = document.getElementById('searchInput');
const searchStats = document.getElementById('searchStats');

let allDoctors = [];
const CACHE_KEY = 'all_doctors_main_cache';

// ======== دالة مساعدة لإنشاء العناصر بأمان ========
function createEl(tag, props = {}, text = '') {
    const el = document.createElement(tag);
    Object.assign(el, props);
    if (text) el.textContent = text;
    return el;
}

// ======== دالة تحقق من الصور وعرضها ========
function setDoctorImage(container, imageUrl, name) {
    container.textContent = ''; 

    // فحص صارم: هل الرابط موجود، نصي، وطويل كفاية ليكون رابطاً؟
    const hasImage = imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 10;

    if (hasImage) {
        const img = createEl('img', {
            className: 'doctor-img',
            src: imageUrl.trim(),
            alt: `صورة ${name}`,
            loading: 'lazy'
        });

        // في حال كان الرابط في القاعدة "خربان" أو مكسور
        img.onerror = () => {
            container.textContent = '';
            renderPlaceholder(container);
        };
        container.appendChild(img);
    } else {
        // إذا كان الحقل فارغاً أو null، تظهر السماعة فوراً
        renderPlaceholder(container);
    }
}


function renderPlaceholder(container) {
    const fallback = createEl('div', { className: 'no-image' });
    fallback.appendChild(createEl('i', { className: 'fas fa-user-md' }));
    container.appendChild(fallback);
}

// ======== إنشاء بطاقة طبيب (بدون innerHTML) ========
function createDoctorCard(doctor) {
    const card = createEl('div', { className: 'doctor-card', id: `doctor-${doctor.id}` });

    const imgContainer = createEl('div', { className: 'doctor-img-container' });
    setDoctorImage(imgContainer, doctor.img || doctor.img, doctor.name);

    const header = createEl('div', { className: 'doctor-header' });
    header.appendChild(createEl('h3', {}, doctor.name || 'دكتور غير معروف'));
    if (doctor.specialty) {
        header.appendChild(createEl('span', { className: 'doctor-title' }, doctor.specialty));
    }

    const infoContainer = createEl('div', { className: 'doctor-info' });
    if (doctor.experience) {
        infoContainer.appendChild(createInfoRow('fa-briefcase', 'الخبرة', `${doctor.experience} سنة`));
    }
    if (doctor.phone) {
        const row = createInfoRow('fa-phone', 'الهاتف', doctor.phone);
        row.querySelector('span').dir = 'ltr';
        infoContainer.appendChild(row);
    }

    const viewButton = createEl('a', {
        href: `doctor.html?id=${doctor.id}`,
        className: 'view-btn'
    });
    viewButton.append(createEl('i', { className: 'fas fa-eye' }), document.createTextNode(' التفاصيل والحجز'));

    card.append(imgContainer, header, infoContainer, viewButton);
    return card;
}

function createInfoRow(iconClass, label, value) {
    const row = createEl('div', { className: 'info-row' });
    row.append(createEl('i', { className: `fas ${iconClass}` }));
    const content = createEl('div');
    content.append(createEl('strong', {}, `${label}: `), createEl('span', {}, value));
    row.append(content);
    return row;
}

// ======== عرض الأطباء وتحديث الإحصائيات ========
function displayDoctors(doctors) {
    doctorsList.textContent = ''; 

    if (doctors.length === 0) {
        const empty = createEl('div', { className: 'empty-state' });
        empty.append(createEl('i', { className: 'fas fa-user-md-slash' }), createEl('p', {}, 'لم يتم العثور على نتائج'));
        doctorsList.appendChild(empty);
        return;
    }

    doctors.forEach(doc => doctorsList.appendChild(createDoctorCard(doc)));
}

function updateSearchStats(count) {
    searchStats.textContent = count === allDoctors.length ? `عرض الكل (${count})` : `تم العثور على (${count}) طبيب`;
}

// ======== محرك البحث ========
function handleSearch() {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = allDoctors.filter(d => 
        (d.name && d.name.toLowerCase().includes(term)) || 
        (d.specialty && d.specialty.toLowerCase().includes(term))
    );
    displayDoctors(filtered);
    updateSearchStats(filtered.length);
}

// ======== نظام الكاش وتحميل البيانات ========
// ======== نظام الكاش وتحميل البيانات (النسخة المصححة) ========
async function loadDoctors() {
    try {
        // استخدام الكاش الذكي (تخزين دائم + تحديث صامت)
        allDoctors = await fetchWithSmartCache(
            CACHE_KEY,
            async () => {
                // جلب الحقول المطلوبة فقط لتقليل الحجم (حل مشكلة الـ 600KB)
                const { data, error } = await supabase
                    .from('doctors')
                    .select('id, name, specialty, phone, img') 
                    .order('name');
                
                if (error) throw error;
                return data;
            },
            (updatedData) => {
                // تحديث الواجهة فوراً إذا تغيرت البيانات في سوبابيس
                allDoctors = updatedData;
                handleSearch(); 
            }
        );

        // عرض البيانات الأولية (سواء من الكاش أو سوبابيس)
        handleSearch();
        
    } catch (err) {
        console.error('خطأ في جلب البيانات:', err);
        doctorsList.textContent = 'حدث خطأ أثناء جلب البيانات.';
    }
}


// ======== تهيئة الأحداث ========
function init() {
    loadDoctors();
    
    searchInput.addEventListener('input', () => {
        clearTimeout(window.searchTimer);
        window.searchTimer = setTimeout(handleSearch, 300);
    });
}

document.addEventListener('DOMContentLoaded', init);
