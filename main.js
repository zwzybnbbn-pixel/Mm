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

/* ===== تحميل البيانات ===== */
async function loadPosts(type, blood = "") {
  postsDiv.textContent = "جاري التحميل...";

  let query = supabase
    .from("blood_posts")
    .select("name,blood_type,city,phone")
    .eq("type", type)
    .order("created_at", { ascending: false });

  if (blood) query = query.eq("blood_type", blood);

  const { data, error } = await query;

  postsDiv.textContent = "";

  if (error || !data || data.length === 0) {
    postsDiv.textContent =
      type === "donation"
        ? "لا يوجد متبرعون حاليًا"
        : "لا توجد طلبات حاليًا";
    return;
  }

  data.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    const h3 = document.createElement("h3");
    h3.textContent = p.name;

    const p1 = document.createElement("p");
    p1.textContent = `🩸 الفصيلة: ${p.blood_type}`;

    const p2 = document.createElement("p");
    p2.textContent = `📍 المدينة: ${p.city}`;

    const btn = document.createElement("button");
    btn.textContent = "إظهار الهاتف";
    btn.onclick = () => {
      btn.textContent = p.phone;
      btn.disabled = true;
    };

    card.append(h3, p1, p2, btn);
    postsDiv.appendChild(card);
  });
}

/* ===== أزرار التبديل ===== */
showDonationsBtn.onclick = () => {
  currentType = "donation";
  loadPosts("donation", filter.value);
};

showRequestsBtn.onclick = () => {
  currentType = "request";
  loadPosts("request", filter.value);
};

filter.onchange = () => loadPosts(currentType, filter.value);

loadPosts("donation");

/* ===== إرسال البيانات ===== */
form.onsubmit = async e => {
  e.preventDefault();
  msg.textContent = "";

  // تحقق من رقم الهاتف (مثال يمني)
  if (!/^7\d{8}$/.test(phoneInput.value)) {
    msg.textContent = "❌ رقم الهاتف غير صحيح";
    msg.style.color = "red";
    return;
  }

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
    // هذا الخطأ يظهر عند تجاوز 5 مرات باليوم (من RLS)
    msg.textContent = "❌ وصلت للحد الأقصى (5 مرات في اليوم)";
    msg.style.color = "red";
  } else {
    msg.textContent = "✅ تم الإرسال بنجاح";
    msg.style.color = "green";
    form.reset();
    loadPosts(currentType);
  }
};
