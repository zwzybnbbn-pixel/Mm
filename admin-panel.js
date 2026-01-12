import { supabase } from './supabase.js';

const authContainer = document.getElementById('auth-container');
const dashboardContainer = document.getElementById('dashboard-container');
const newsList = document.getElementById('admin-news-list');

// 1. فحص حالة المستخدم عند الفتح
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) showDashboard();
}

// 2. تسجيل الدخول
document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) document.getElementById('auth-error').textContent = "بيانات غير صحيحة";
    else location.reload();
};

// 3. عرض لوحة التحكم وجلب البيانات
async function showDashboard() {
    authContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';
    loadAdminNews();
}

async function loadAdminNews() {
    const { data } = await supabase.from('emergency_news').select('*').order('created_at', { ascending: false });
    renderAdminList(data);
}

// 4. بناء القائمة مع أزرار التعديل والحذف (آمنة وبدون innerHTML)
function renderAdminList(data) {
    newsList.textContent = '';
    data.forEach(news => {
        const item = document.createElement('div');
        item.className = 'admin-news-item';
        
        const title = document.createElement('strong');
        title.textContent = news.title;

        const actions = document.createElement('div');
        
        // زر التعديل
        const editBtn = document.createElement('button');
        editBtn.textContent = 'تعديل';
        editBtn.onclick = () => fillFormForEdit(news);

        // زر الحذف
        const delBtn = document.createElement('button');
        delBtn.textContent = 'حذف';
        delBtn.className = 'btn-danger';
        delBtn.onclick = () => deleteNews(news.id);

        actions.append(editBtn, delBtn);
        item.append(title, actions);
        newsList.appendChild(item);
    });
}

// 5. إضافة وتعديل الخبر
document.getElementById('save-btn').onclick = async () => {
    const id = document.getElementById('news-id').value;
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const status_type = document.getElementById('status_type').value;

    const newsData = { title, content, status_type };

    if (id) {
        // تعديل
        await supabase.from('emergency_news').update(newsData).eq('id', id);
    } else {
        // إضافة جديد
        await supabase.from('emergency_news').insert([newsData]);
    }
    location.reload();
};

// 6. حذف الخبر
async function deleteNews(id) {
    if (confirm('هل أنت متأكد من الحذف؟')) {
        await supabase.from('emergency_news').delete().eq('id', id);
        loadAdminNews();
    }
}

// وظائف مساعدة
function fillFormForEdit(news) {
    document.getElementById('news-id').value = news.id;
    document.getElementById('title').value = news.title;
    document.getElementById('content').value = news.content;
    document.getElementById('status_type').value = news.status_type;
    document.getElementById('form-title').textContent = "تعديل الخبر";
    document.getElementById('cancel-btn').style.display = 'inline';
}

document.getElementById('logout-btn').onclick = async () => {
    await supabase.auth.signOut();
    location.reload();
};

checkAuth();
