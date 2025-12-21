import { supabase } from "./supabase.js";

const postsDiv = document.getElementById("posts");
const filter = document.getElementById("bloodFilter");
const showDonationsBtn = document.getElementById("showDonations");
const showRequestsBtn = document.getElementById("showRequests");
const form = document.getElementById("postForm");
const msg = document.getElementById("msg");

let currentType = "donation";
let lastSubmit = 0;

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

  if (Date.now() - lastSubmit < 30000) {
    msg.textContent = "⏳ انتظر 30 ثانية قبل الإرسال مرة أخرى";
    msg.style.color = "orange";
    return;
  }
if (!/^7\d{8}$/.test(phone.value)) {
  msg.textContent = "رقم الهاتف غير صحيح";
  msg.style.color = "red";
  return;
}
  lastSubmit = Date.now();

  const { error } = await supabase.from("blood_posts").insert([{
    type: type.value,
    name: name.value,
    blood_type: bloodType.value,
    city: city.value,
    phone: phone.value
  }]);

  if (error) {
    msg.textContent = "❌ حدث خطأ أثناء الإرسال";
    msg.style.color = "red";
  } else {
    msg.textContent = "✅ تم الإرسال بنجاح";
    msg.style.color = "green";
    form.reset();
    loadPosts(currentType);
  }
};