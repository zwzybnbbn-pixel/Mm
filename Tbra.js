import { supabase } from "./supabase.js";

/* ===== عناصر الصفحة ===== */
const postsDiv = document.getElementById("posts");
const filter = document.getElementById("bloodFilter");
const showDonationsBtn = document.getElementById("showDonations");
const showRequestsBtn = document.getElementById("showRequests");
const form = document.getElementById("postForm");
const msg = document.getElementById("msg");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const cityInput = document.getElementById("city");
const bloodTypeInput = document.getElementById("bloodType");
const typeInput = document.getElementById("type");

let currentType = "donation";

/* ===== دالة إنشاء العناصر بأمان (بدون innerHTML) ===== */
function createSecureCard(p) {
  const card = document.createElement("div");
  card.className = "card";

  // 1. الجزء العلوي (الاسم وفصيلة الدم)
  const headerDiv = document.createElement("div");
  headerDiv.className = "card-header";

  const nameDiv = document.createElement("div");
  nameDiv.className = "card-name";
  nameDiv.textContent = p.name;

  const badge = document.createElement("div");
  badge.className = "blood-badge";
  badge.textContent = p.blood_type;

  headerDiv.append(nameDiv, badge);

  // 2. معلومات الموقع
  const cityDiv = document.createElement("div");
  cityDiv.className = "card-loc";
  cityDiv.textContent = `📍 مدينة ${p.city}`;

  // 3. زر الاتصال الفوري (التصميم الجديد)
  const callLink = document.createElement("a");
  callLink.className = "call-btn"; // الكلاس الذي صممناه في CSS
  callLink.href = `tel:${p.phone}`;
  
  // أيقونة الهاتف مع الأنيميشن
  const icon = document.createElement("span");
  icon.className = "call-icon";
  icon.textContent = "📞";
  
  // حاوية النصوص داخل الزر
  const textContainer = document.createElement("div");
  textContainer.className = "call-text";
  
  const topText = document.createElement("span");
  topText.textContent = "اتصال فوري";
  
  const bottomText = document.createElement("span");
  bottomText.style.fontWeight = "900";
  bottomText.textContent = "اضغط هنا للتواصل";

  textContainer.append(topText, bottomText);
  callLink.append(icon, textContainer);

  // تجميع الكارت بالكامل
  card.append(headerDiv, cityDiv, callLink);

  return card;
}


/* ===== تحميل البيانات ===== */
async function loadPosts(type, blood = "") {
  postsDiv.textContent = "";
  const loader = document.createElement("div");
  loader.className = "msg";
  loader.textContent = "جاري تحميل السجلات ...";
  postsDiv.appendChild(loader);

  let query = supabase
    .from("blood_posts")
    .select("name,blood_type,city,phone")
    .eq("type", type)
    .order("created_at", { ascending: false });

  if (blood) query = query.eq("blood_type", blood);

  const { data, error } = await query;

  postsDiv.textContent = ""; // مسح محتوى التحميل

  if (error || !data || data.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "msg";
    emptyMsg.textContent = type === "donation" ? "لا يوجد متبرعون حاليًا" : "لا توجد طلبات حاليًا";
    postsDiv.appendChild(emptyMsg);
    return;
  }

  // إضافة الكروت المفلترة
  data.forEach(p => {
    postsDiv.appendChild(createSecureCard(p));
  });
}

/* ===== التحكم في الأزرار ===== */
function updateButtons(activeBtn, inactiveBtn, type) {
  currentType = type;
  activeBtn.classList.add("active");
  inactiveBtn.classList.remove("active");
  loadPosts(type, filter.value);
}

showDonationsBtn.onclick = () => updateButtons(showDonationsBtn, showRequestsBtn, "donation");
showRequestsBtn.onclick = () => updateButtons(showRequestsBtn, showDonationsBtn, "request");
filter.onchange = () => loadPosts(currentType, filter.value);

// التحميل الأولي
loadPosts("donation");

/* ===== إرسال البيانات (بدون قيود إرسال) ===== */
form.onsubmit = async e => {
  e.preventDefault();
  msg.textContent = "جاري النشر...";
  msg.style.color = "var(--gold)";

  const { error } = await supabase
    .from("blood_posts")
    .insert([{
      type: typeInput.value,
      name: nameInput.value.trim(),
      blood_type: bloodTypeInput.value,
      city: cityInput.value.trim(),
      phone: phoneInput.value.trim()
    }]);

  if (error) {
    // إذا ظهر خطأ هنا، تأكد من إعدادات RLS في Supabase كما شرحت لك سابقاً
    msg.textContent = "❌ تعذر النشر، يرجى التحقق من إعدادات القاعدة";
    msg.style.color = "#f87171";
  } else {
    msg.textContent = "✅ تم تسجيل بياناتكم بنجاح";
    msg.style.color = "#4ade80";
    form.reset();
    loadPosts(currentType);
    setTimeout(() => { msg.textContent = ""; }, 4000);
  }
};
