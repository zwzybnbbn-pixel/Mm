import { supabase, fetchWithSmartCache } from './supabase.js';

const urlParams = new URLSearchParams(window.location.search);
const hospitalId = urlParams.get('id');

let selectedRating = 0;
let userIdentifier = null;

function createEl(tag, props = {}, text = '') {
    const el = document.createElement(tag);
    Object.assign(el, props);
    if (text) el.textContent = text;
    return el;
}

// ==== توليد معرف المستخدم (يبقى كما هو) ====
async function generateUserIdentifier() {
    let id = localStorage.getItem('user_identifier');
    if (id) return id;
    try {
        const resp = await fetch('https://api.ipify.org?format=json');
        const data = await resp.json();
        id = 'ip_' + data.ip;
    } catch { id = 'user_' + Date.now(); }
    localStorage.setItem('user_identifier', id);
    return id;
}

// ==== تحميل بيانات المستشفى (مع كاش ذكي) ====
async function loadHospitalData() {
    const renderHospital = (data) => {
        document.getElementById('hName').textContent = data.name;
        document.getElementById('hCity').textContent = data.city;
        document.getElementById('hPhone').textContent = data.phone;
        document.getElementById('hDepartments').textContent = data.department;
        document.getElementById('hDescription').textContent = data.description || 'لا يوجد وصف';
        document.getElementById('hospitalImg').src = data.img || 'https://via.placeholder.com/150';
        
        const mapBtn = document.getElementById('mapBtn');
        if (data.map) {
            mapBtn.href = data.map;
            mapBtn.style.display = 'inline-block';
        } else {
            mapBtn.style.display = 'none';
        }
    };

    const hospital = await fetchWithSmartCache(`hosp_detail_${hospitalId}`, async () => {
        const { data, error } = await supabase.from('hospitals').select('*').eq('id', hospitalId).single();
        if (error) throw error;
        return data;
    }, (updatedData) => {
        renderHospital(updatedData);
    });

    if (hospital) renderHospital(hospital);
}

// ==== تحميل التقييمات (مع كاش ذكي) ====
async function loadReviews() {
    const list = document.getElementById('reviewsList');
    
    const renderReviews = (reviews) => {
        list.textContent = '';
        if (!reviews || reviews.length === 0) {
            list.appendChild(createEl('p', { className: 'empty-msg' }, 'لا توجد تقييمات بعد.'));
            return;
        }

        let total = 0;
        reviews.forEach(r => {
            total += r.rating;
            const div = createEl('div', { className: 'review' });
            const stars = createEl('div', { className: 'stars' }, '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating));
            const text = createEl('p', {}, r.text);
            const date = createEl('small', {}, new Date(r.date).toLocaleDateString('ar-SA'));
            div.append(stars, text, date);
            list.appendChild(div);
        });

        const avg = (total / reviews.length).toFixed(1);
        document.getElementById('avgRating').textContent = avg;
        document.getElementById('ratingCount').textContent = `${reviews.length} تقييم`;
    };

    const reviews = await fetchWithSmartCache(`hosp_reviews_${hospitalId}`, async () => {
        const { data, error } = await supabase.from('reviews').select('*').eq('hospital_id', hospitalId).order('date', { ascending: false });
        if (error) throw error;
        return data;
    }, (updatedReviews) => {
        renderReviews(updatedReviews);
    });

    if (reviews) renderReviews(reviews);
}

// ==== تحميل الأطباء (مع كاش ذكي) ====
async function loadDoctors() {
    const sec = document.getElementById('doctorsSection');
    const list = document.getElementById('hospitalDoctors');

    const renderDoctors = (doctors) => {
        list.textContent = '';
        if (doctors && doctors.length > 0) {
            sec.style.display = 'block';
            doctors.forEach(doc => {
                const d = createEl('div', { className: 'doctor-item' });
                d.append(createEl('b', {}, doc.name), createEl('p', {}, doc.specialty));
                list.appendChild(d);
            });
        }
    };

    // جلب اسم المستشفى أولاً (من الكاش المحمل مسبقاً)
    const cachedHosp = JSON.parse(localStorage.getItem(`hosp_detail_${hospitalId}`));
    if (!cachedHosp) return;

    const doctors = await fetchWithSmartCache(`hosp_docs_${hospitalId}`, async () => {
        const { data, error } = await supabase.from('doctors').select('*').ilike('hospital', `%${cachedHosp.name}%`);
        if (error) throw error;
        return data;
    }, (updatedDocs) => {
        renderDoctors(updatedDocs);
    });

    if (doctors) renderDoctors(doctors);
}

// ==== بقية الوظائف (Stars & addReview) تظل كما هي دون تغيير ====
function setupStars() {
    const container = document.getElementById('starsInput');
    container.textContent = '';
    for (let i = 1; i <= 5; i++) {
        const star = createEl('span', { className: 'star', textContent: '☆' });
        star.onclick = () => { selectedRating = i; updateStarsDisplay(); };
        container.appendChild(star);
    }
}

function updateStarsDisplay() {
    document.querySelectorAll('.star').forEach((s, i) => {
        s.textContent = i < selectedRating ? '★' : '☆';
        s.classList.toggle('active', i < selectedRating);
    });
}

async function addReview() {
    const text = document.getElementById('reviewText').value.trim();
    if (selectedRating === 0 || text.length < 5) {
        alert('يرجى اختيار النجوم وكتابة تعليق مناسب');
        return;
    }
    userIdentifier = await generateUserIdentifier();
    const { data: existing } = await supabase.from('reviews').select('id').eq('hospital_id', hospitalId).eq('user', userIdentifier).maybeSingle();
    if (existing) { alert('لقد قمت بالتقييم مسبقاً'); return; }

    const { error } = await supabase.from('reviews').insert([{
        rating: selectedRating, text: text, hospital_id: hospitalId, user: userIdentifier, date: new Date().toISOString()
    }]);

    if (!error) {
        localStorage.removeItem(`hosp_reviews_${hospitalId}`); // مسح كاش التقييمات لتظهر الجديدة
        location.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!hospitalId) return;
    setupStars();
    loadHospitalData();
    loadReviews();
    loadDoctors();
    document.getElementById('sendReview').onclick = addReview;
});
