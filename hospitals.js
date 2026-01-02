import { supabase, fetchWithSmartCache } from "./supabase.js";

// دالة مساعدة لإنشاء العناصر بأمان (تمنع هجمات XSS)
function createEl(tag, props = {}, text = '') {
    const el = document.createElement(tag);
    Object.assign(el, props);
    if (text) el.textContent = text;
    return el;
}

// دالة لإنشاء بطاقة مستشفى
function createHospitalCard(hospital) {
    const card = createEl('div', { className: 'card' });
    
    // الصورة مع معالجة الخطأ
    const img = createEl('img', {
        className: 'hospital-imgcircle',
        src: hospital.img || 'https://i.postimg.cc/TPZpYH5f/noimage.png',
        alt: hospital.name || 'صورة المستشفى',
        loading: 'lazy'
    });
    
    // الاسم
    const nameDiv = createEl('div', { className: 'hospital-name' }, hospital.name || 'اسم غير معروف');
    
    // دالة لإنشاء سطور المعلومات
    const createInfo = (label, value) => {
        const p = createEl('p', { className: 'info' });
        const b = createEl('b', {}, label + ': ');
        p.append(b, document.createTextNode(value || 'غير محدد'));
        return p;
    };

    // إضافة البيانات للبطاقة
    card.append(
        img, 
        nameDiv, 
        createInfo('المدينة', hospital.city),
        createInfo('الهاتف', hospital.phone),
        createInfo('الأقسام', hospital.department),
        createInfo('الوصف', hospital.description || 'لا يوجد وصف'),
        createEl('a', {
            className: 'btn',
            href: `hospital.html?id=${hospital.id}`,
            textContent: 'عرض التفاصيل'
        })
    );
    
    return card;
}

// الدالة الرئيسية مع نظام الكاش الذكي
async function loadHospitals() {
    const container = document.getElementById('hospitals');
    if (!container) return;

    // دالة العرض (يتم استدعاؤها للكاش وللتحديث الصامت)
    const render = (data) => {
        container.textContent = ''; // مسح آمن
        
        if (!data || data.length === 0) {
            const emptyDiv = createEl('div', { className: 'empty-state' });
            emptyDiv.append(
                createEl('i', { className: 'fas fa-hospital' }),
                createEl('p', {}, 'لا توجد مستشفيات مسجلة حالياً')
            );
            container.appendChild(emptyDiv);
            return;
        }
        
        data.forEach(hospital => {
            container.appendChild(createHospitalCard(hospital));
        });
    };

    try {
        // استخدام الكاش الذكي (يعرض القديم فوراً ويحدث في الخلفية)
        const hospitals = await fetchWithSmartCache(
            'all_hospitals_list', 
            async () => {
                const { data, error } = await supabase
                    .from("hospitals") 
                    .select("*")
                    .order('name', { ascending: true });
                
                if (error) throw error;
                return data;
            },
            (updatedData) => {
                // تحديث الشاشة فقط إذا تغيرت البيانات في سوبابيس عن الكاش
                console.log("🔄 تم تحديث قائمة المستشفيات تلقائياً");
                render(updatedData);
            }
        );

        // عرض البيانات الأولية (سواء من الكاش أو سوبابيس)
        if (hospitals) render(hospitals);
        
    } catch (err) {
        console.error('خطأ:', err);
        if (container.children.length === 0) {
            container.textContent = 'حدث خطأ أثناء تحميل البيانات.';
        }
    }
}

document.addEventListener('DOMContentLoaded', loadHospitals);
