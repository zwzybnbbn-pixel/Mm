import { supabase } from "./supabase.js";

/* ===== العناصر ===== */
const postsDiv = document.getElementById("posts");
const filter = document.getElementById("bloodFilter");
const showDonationsBtn = document.getElementById("showDonations");
const showRequestsBtn = document.getElementById("showRequests");
const form = document.getElementById("postForm");
const msg = document.getElementById("msg");

/* ===== الإعدادات ===== */
let currentType = "donation";
const LIMIT_TIME = 30 * 60 * 1000; // 30 دقيقة
const STORAGE_KEY = "last_blood_post_time";

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
    btn.addEventListener("click", () => {
      btn.textContent = p.phone;
      btn.disabled = true;
    });

    card.append(h3, p1, p2, btn);
    postsDiv.appendChild(card);
  });
}

/* ===== أزرار التبديل ===== */
showDonationsBtn.addEventListener("click", () => {
  currentType = "donation";
  loadPosts("donation", filter.value);
});

showRequestsBtn.addEventListener("click", () => {
  currentType = "request";
  loadPosts("request", filter.value);
});

filter.addEventListener("change", () => {
  loadPosts(currentType, filter.value);
});

/* تحميل افتراضي */
loadPosts("donation");

/* ===== إرسال البيانات ===== */
form.addEventListener("submit", async e => {
  e.preventDefault();

  msg.textContent = "";
  msg.style.color = "";

  /* ===== تحديد عدد الإرسال ===== */
  const lastTime = localStorage.getItem(STORAGE_KEY);
  const now = Date.now();

  if (lastTime && now - Number(lastTime) < LIMIT_TIME) {
    const remaining = Math.ceil(
      (LIMIT_TIME - (now - Number(lastTime))) / 60000
    );
    msg.textContent = `⏳ يمكنك الإرسال مرة أخرى بعد ${remaining} دقيقة`;
    msg.style.color = "orange";
    return;
  }

  /* ===== التحقق من رقم الهاتف ===== */
  const phoneValue = phone.value.trim();
  if (!/^7\d{8}$/.test(phoneValue)) {
    msg.textContent = "❌ رقم الهاتف غير صحيح (يجب أن يبدأ بـ 7 ويتكون من 9 أرقام)";
    msg.style.color = "red";
    return;
  }

  /* ===== الإدخال ===== */
  const { error } = await supabase.from("blood_posts").insert([{
    type: type.value,
    name: name.value.trim(),
    blood_type: bloodType.value,
    city: city.value.trim(),
    phone: phoneValue
  }]);

  if (error) {
    console.error(error);
    msg.textContent = "❌ حدث خطأ أثناء الإرسال";
    msg.style.color = "red";
    return;
  }

  /* ===== نجاح ===== */
  localStorage.setItem(STORAGE_KEY, now.toString());
  msg.textContent = "✅ تم الإرسال بنجاح، جزاك الله خيرًا";
  msg.style.color = "green";

  form.reset();
  loadPosts(currentType);
});
