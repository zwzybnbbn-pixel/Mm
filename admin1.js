import { supabase } from './supabase.js';

// تعريف العناصر
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginBtn = document.getElementById('btn-login');
const logoutBtn = document.getElementById('btn-logout');
const saveBtn = document.getElementById('btn-save');
const ratesList = document.getElementById('admin-rates-list');
const authMsg = document.getElementById('auth-msg');

// 1. التحقق من الجلسة عند البداية
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        renderDashboard(session.user.email);
    }
}

// 2. عملية تسجيل الدخول
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    loginBtn.disabled = true;
    loginBtn.textContent = 'جاري التحقق...';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authMsg.textContent = 'فشل الدخول: تأكد من بياناتك';
        loginBtn.disabled = false;
        loginBtn.textContent = 'تسجيل الدخول';
    } else {
        location.reload(); // إعادة التحميل لتفعيل الحالة الجديدة
    }
});

// 3. بناء لوحة التحكم
async function renderDashboard(email) {
    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    document.getElementById('user-display').textContent = `مرحباً: ${email}`;

    const { data: rates, error } = await supabase.from('rates').select('*').order('id');
    
    if (error) return;

    ratesList.textContent = ''; // تنظيف آمن

    rates.forEach(rate => {
        const div = document.createElement('div');
        div.className = 'admin-rate-item';

        const label = document.createElement('label');
        label.textContent = rate.name;

        const buyInp = document.createElement('input');
        buyInp.type = 'number';
        buyInp.value = rate.buy;
        buyInp.className = 'buy-input';
        buyInp.dataset.id = rate.id;

        const sellInp = document.createElement('input');
        sellInp.type = 'number';
        sellInp.value = rate.sell;
        sellInp.className = 'sell-input';
        sellInp.dataset.id = rate.id;

        div.append(label, buyInp, sellInp);
        ratesList.appendChild(div);
    });
}

// 4. حفظ البيانات المعدلة
saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = 'جاري التحديث...';

    const rows = ratesList.querySelectorAll('.admin-rate-item');
    
    for (const row of rows) {
        const id = row.querySelector('.buy-input').dataset.id;
        const buy = row.querySelector('.buy-input').value;
        const sell = row.querySelector('.sell-input').value;

        await supabase.from('rates').update({ buy, sell }).eq('id', id);
    }

    alert('تم تحديث أسعار الصرف بنجاح');
    saveBtn.disabled = false;
    saveBtn.textContent = 'حفظ وتحديث السوق';
});

// 5. تسجيل الخروج
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.reload();
});

init();
