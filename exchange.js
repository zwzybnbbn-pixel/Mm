// استيراد عميل سوبابيس من ملف الإعدادات الخاص بك
import { supabase } from './supabase.js';

/**
 * دالة لجلب أسعار الصرف من سوبابيس وعرضها بشكل آمن
 */
async function loadExchangeRates() {
    const tbody = document.getElementById('rates-body');
    const updateTimer = document.getElementById('update-timer');

    try {
        // جلب البيانات من جدول rates
        const { data, error } = await supabase
            .from('rates')
            .select('name, buy, sell, updated_at')
            .order('id', { ascending: true });

        if (error) throw error;

        // تنظيف محتوى الجدول الحالي بطريقة آمنة
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }

        if (data && data.length > 0) {
            data.forEach(rate => {
                const tr = document.createElement('tr');

                // إنشاء خلية اسم العملة
                const nameTd = document.createElement('td');
                nameTd.classList.add('currency-name');
                nameTd.textContent = rate.name;
                tr.appendChild(nameTd);

                // إنشاء خلية سعر الشراء
                const buyTd = document.createElement('td');
                buyTd.classList.add('buy-price');
                // تنسيق الرقم بفاصلة الآلاف لزيادة الاحترافية
                buyTd.textContent = Number(rate.buy).toLocaleString('en-US'); 
                tr.appendChild(buyTd);

                // إنشاء خلية سعر البيع
                const sellTd = document.createElement('td');
                sellTd.classList.add('sell-price');
                sellTd.textContent = Number(rate.sell).toLocaleString('en-US');
                tr.appendChild(sellTd);

                // إضافة الصف إلى جسم الجدول
                tbody.appendChild(tr);

                // تحديث نص "آخر تحديث" بناءً على أحدث سجل
                if (rate.updated_at) {
                    const date = new Date(rate.updated_at);
                    const timeString = date.toLocaleTimeString('ar-YE', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                    });
                    updateTimer.textContent = `آخر تحديث للسوق: ${timeString}`;
                }
            });
        } else {
            const emptyTr = document.createElement('tr');
            const emptyTd = document.createElement('td');
            emptyTd.setAttribute('colspan', '3');
            emptyTd.style.textAlign = 'center';
            emptyTd.textContent = 'لا توجد بيانات متاحة حالياً.';
            emptyTr.appendChild(emptyTd);
            tbody.appendChild(emptyTr);
        }

    } catch (err) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', err.message);
        tbody.textContent = ''; // مسح أي محتوى
        const errorTr = document.createElement('tr');
        const errorTd = document.createElement('td');
        errorTd.setAttribute('colspan', '3');
        errorTd.style.textAlign = 'center';
        errorTd.style.color = 'red';
        errorTd.textContent = 'خطأ في تحميل البيانات. يرجى المحاولة لاحقاً.';
        errorTr.appendChild(errorTd);
        tbody.appendChild(errorTr);
    }
}

// تشغيل الدالة عند تحميل المستند بالكامل
document.addEventListener('DOMContentLoaded', loadExchangeRates);

// تحديث تلقائي كل 5 دقائق (300,000 مللي ثانية)
setInterval(loadExchangeRates, 300000);
