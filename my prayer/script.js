// متغيرات عامة
let latitude, longitude, country, city;
let prayerTimes = {};
let isMuted = false;
let currentDate = new Date().toDateString();
let countdownInterval;
let clockInterval;
let timezoneOffset = 0; // offset in minutes from UTC
let currentLanguage = 'ar'; // 'ar' for Arabic, 'en' for English

// كائنات الترجمة
const translations = {
    ar: {
        siteName: 'صلاتي',
        muteBtn: 'كتم الصوت',
        unmuteBtn: 'تشغيل الصوت',
        locationBtn: 'تغيير الموقع',
        langBtn: 'English',
        locationText: 'جاري تحديد الموقع...',
        manualLocationText: 'يرجى إدخال الموقع يدويًا',
        gregorianDate: 'التاريخ الميلادي',
        hijriDate: 'التاريخ الهجري',
        loading: 'جاري التحديث...',
        countryPlaceholder: 'الدولة',
        cityPlaceholder: 'المدينة',
        submitBtn: 'تحديد',
        countdownTitle: 'الوقت المتبقي للصلاة القادمة',
        nextPrayer: 'جاري التحديث...',
        prayers: {
            fajr: 'الفجر',
            sunrise: 'الشروق',
            dhuhr: 'الظهر',
            asr: 'العصر',
            maghrib: 'المغرب',
            isha: 'العشاء'
        },
        notification: 'اقترب وقت صلاة {prayer} بعد 5 دقائق',
        error: 'خطأ في جلب مواقيت الصلاة'
    },
    en: {
        siteName: 'Salati',
        muteBtn: 'Mute',
        unmuteBtn: 'Unmute',
        locationBtn: 'Change Location',
        langBtn: 'العربية',
        locationText: 'Detecting location...',
        manualLocationText: 'Please enter location manually',
        gregorianDate: 'Gregorian Date',
        hijriDate: 'Hijri Date',
        loading: 'Loading...',
        countryPlaceholder: 'Country',
        cityPlaceholder: 'City',
        submitBtn: 'Set',
        countdownTitle: 'Time remaining for next prayer',
        nextPrayer: 'Loading...',
        prayers: {
            fajr: 'Fajr',
            sunrise: 'Sunrise',
            dhuhr: 'Dhuhr',
            asr: 'Asr',
            maghrib: 'Maghrib',
            isha: 'Isha'
        },
        notification: 'Prayer time for {prayer} is in 5 minutes',
        error: 'Error fetching prayer times'
    }
};

// الحصول على الموقع تلقائيًا
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
                fetchPrayerTimes();
            },
            (error) => {
                console.log("Geolocation denied, showing manual input");
                showManualLocation();
            }
        );
    } else {
        showManualLocation();
    }
}

// عرض خيار الإدخال اليدوي
function showManualLocation() {
    document.getElementById('manual-location').classList.remove('hidden');
    document.getElementById('location-text').textContent = translations[currentLanguage].manualLocationText;
}

// جلب مواقيت الصلاة من API
async function fetchPrayerTimes() {
    const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        prayerTimes = data.data.timings;
        updatePrayerTimes();
        updateLocationText(data.data.meta.timezone);
    } catch (error) {
        console.error("Error fetching prayer times:", error);
    }
}

// تحديث النصوص
function updatePrayerTimes() {
    // ضمان استخدام الأرقام الغربية
    const formatTime = (time) => time ? time.replace(/[^\d:]/g, '') : '--:--'; // إزالة أي أحرف غير رقمية أو :
    document.getElementById('fajr-time').textContent = formatTime(prayerTimes.Fajr);
    document.getElementById('sunrise-time').textContent = formatTime(prayerTimes.Sunrise);
    document.getElementById('dhuhr-time').textContent = formatTime(prayerTimes.Dhuhr);
    document.getElementById('asr-time').textContent = formatTime(prayerTimes.Asr);
    document.getElementById('maghrib-time').textContent = formatTime(prayerTimes.Maghrib);
    document.getElementById('isha-time').textContent = formatTime(prayerTimes.Isha);
    startCountdown();
}

function updateLocationText(timezone) {
    document.getElementById('location-text').textContent = `${translations[currentLanguage].locationText}: ${timezone}`;
}

function updateLocationTextDisplay() {
    const currentText = document.getElementById('location-text').textContent;
    if (currentText.includes('الموقع:')) {
        const location = currentText.replace('الموقع: ', '');
        document.getElementById('location-text').textContent = `${translations[currentLanguage].locationText}: ${location}`;
    } else if (currentText === 'جاري تحديد الموقع...' || currentText === 'Detecting location...') {
        document.getElementById('location-text').textContent = translations[currentLanguage].locationText;
    }
}

// تحديث التواريخ
function toArabicNumerals(str) {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/\d/g, (digit) => arabicNumerals[parseInt(digit)]);
}

function getArabicMonth(monthEn) {
    const months = {
        'January': 'يناير',
        'February': 'فبراير',
        'March': 'مارس',
        'April': 'أبريل',
        'May': 'مايو',
        'June': 'يونيو',
        'July': 'يوليو',
        'August': 'أغسطس',
        'September': 'سبتمبر',
        'October': 'أكتوبر',
        'November': 'نوفمبر',
        'December': 'ديسمبر'
    };
    return months[monthEn] || monthEn;
}

function updateDates(dateData) {
    const gregorian = dateData.gregorian;
    const hijri = dateData.hijri;

    if (currentLanguage === 'ar') {
        document.getElementById('gregorian-date').textContent = `التاريخ الميلادي: ${gregorian.weekday.ar}, ${toArabicNumerals(gregorian.day)} ${getArabicMonth(gregorian.month.en)} ${toArabicNumerals(gregorian.year)}`;
        document.getElementById('hijri-date').textContent = `التاريخ الهجري: ${hijri.weekday.ar}, ${toArabicNumerals(hijri.day)} ${hijri.month.ar} ${toArabicNumerals(hijri.year)}`;
    } else {
        document.getElementById('gregorian-date').textContent = `Gregorian Date: ${gregorian.weekday.en}, ${gregorian.day} ${gregorian.month.en} ${gregorian.year}`;
        document.getElementById('hijri-date').textContent = `Hijri Date: ${hijri.weekday.en}, ${hijri.day} ${hijri.month.en} ${hijri.year}`;
    }
}

// تحديث عرض التواريخ حسب اللغة الحالية
function updateDatesDisplay() {
    if (window.currentDateData) {
        updateDates(window.currentDateData);
    }
}

// تحديث الساعة المحلية
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('local-clock').textContent = timeString;
}

// تحديد فارق التوقيت
function setTimezoneOffset(timezone) {
    // استخراج فارق التوقيت من النص (مثل "Asia/Riyadh" أو "+03")
    const offsetMatch = timezone.match(/([+-]\d{2}):?(\d{2})?/);
    if (offsetMatch) {
        const hours = parseInt(offsetMatch[1]);
        const minutes = offsetMatch[2] ? parseInt(offsetMatch[2]) : 0;
        timezoneOffset = hours * 60 + minutes;
    } else {
        // إذا لم يكن هناك فارق واضح، استخدم فارق الموقع الحالي
        timezoneOffset = new Date().getTimezoneOffset();
    }
}

// تشغيل الأذان
function playAzan(prayer) {
    if (!isMuted) {
        const audio = document.getElementById('azan-audio');
        audio.play();
        // إضافة تأثير بصري للبطاقة
        const card = document.querySelector(`[data-prayer="${prayer}"]`);
        card.style.boxShadow = "0 0 30px var(--gold-luxury)";
        setTimeout(() => card.style.boxShadow = "", 10000);
    }
}

// التحقق من أوقات الصلاة كل دقيقة
function checkPrayerTimes() {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    // تحديث يومي
    if (now.toDateString() !== currentDate) {
        currentDate = now.toDateString();
        fetchPrayerTimes();
    }

    // التحقق من كل صلاة
    if (currentTime === prayerTimes.Fajr) playAzan('fajr');
    if (currentTime === prayerTimes.Dhuhr) playAzan('dhuhr');
    if (currentTime === prayerTimes.Asr) playAzan('asr');
    if (currentTime === prayerTimes.Maghrib) playAzan('maghrib');
    if (currentTime === prayerTimes.Isha) playAzan('isha');
}

// الحصول على الصلاة القادمة
function getNextPrayer() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
        { name: translations[currentLanguage].prayers.fajr, time: prayerTimes.Fajr, key: 'fajr' },
        { name: translations[currentLanguage].prayers.dhuhr, time: prayerTimes.Dhuhr, key: 'dhuhr' },
        { name: translations[currentLanguage].prayers.asr, time: prayerTimes.Asr, key: 'asr' },
        { name: translations[currentLanguage].prayers.maghrib, time: prayerTimes.Maghrib, key: 'maghrib' },
        { name: translations[currentLanguage].prayers.isha, time: prayerTimes.Isha, key: 'isha' }
    ];

    for (let i = 0; i < prayers.length; i++) {
        const prayerTime = prayers[i].time;
        if (prayerTime) {
            const [hours, minutes] = prayerTime.split(':').map(Number);
            const prayerMinutes = hours * 60 + minutes;
            if (prayerMinutes > currentTime) {
                return prayers[i];
            }
        }
    }

    // إذا كانت الصلاة الأخيرة، العودة للفجر التالي
    return prayers[0];
}

// بدء العد التنازلي
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// تحديث العد التنازلي
function updateCountdown() {
    if (!prayerTimes.Fajr) return;

    const nextPrayer = getNextPrayer();
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let nextPrayerTime;
    const [hours, minutes] = nextPrayer.time.split(':').map(Number);
    // تحويل وقت الصلاة إلى الوقت المحلي
    let localHours = hours + Math.floor(timezoneOffset / 60);
    let localMinutes = minutes + (timezoneOffset % 60);

    // التعامل مع التغييرات في الساعات
    if (localMinutes >= 60) {
        localHours += 1;
        localMinutes -= 60;
    } else if (localMinutes < 0) {
        localHours -= 1;
        localMinutes += 60;
    }

    // التعامل مع تغيير اليوم
    if (localHours >= 24) {
        localHours -= 24;
    } else if (localHours < 0) {
        localHours += 24;
    }

    if (nextPrayer.key === 'fajr' && currentTime > localHours * 60 + localMinutes) { // بعد العشاء
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        nextPrayerTime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), localHours, localMinutes);
    } else {
        nextPrayerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), localHours, localMinutes);
    }

    const timeDiff = nextPrayerTime - now;
    if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        document.getElementById('next-prayer-name').textContent = nextPrayer.name;
        document.getElementById('countdown-timer').textContent =
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        // إعادة حساب بعد دخول وقت الصلاة
        startCountdown();
    }
}

// أحداث
document.getElementById('mute-btn').addEventListener('click', () => {
    isMuted = !isMuted;
    document.getElementById('mute-btn').textContent = isMuted ? 'تشغيل الصوت' : 'كتم الصوت';
});

document.getElementById('location-btn').addEventListener('click', showManualLocation);

document.getElementById('submit-location').addEventListener('click', () => {
    country = document.getElementById('country-input').value;
    city = document.getElementById('city-input').value;
    if (country && city) {
        fetchPrayerTimesManual();
        document.getElementById('manual-location').classList.add('hidden');
        document.getElementById('location-text').textContent = `الموقع: ${city}, ${country}`;
    }
});

document.getElementById('lang-btn').addEventListener('click', () => {
    currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    switchLanguage();
});

// تبديل اللغة
function switchLanguage() {
    // تحديث اتجاه الصفحة
    document.body.className = currentLanguage === 'en' ? 'ltr' : '';
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';

    // تحديث اسم الموقع
    document.querySelector('.site-name').textContent = translations[currentLanguage].siteName;

    // تحديث أزرار التحكم
    document.getElementById('mute-btn').textContent = isMuted ? translations[currentLanguage].unmuteBtn : translations[currentLanguage].muteBtn;
    document.getElementById('location-btn').textContent = translations[currentLanguage].locationBtn;
    document.getElementById('lang-btn').textContent = translations[currentLanguage].langBtn;

    // تحديث النصوص الثابتة
    document.querySelector('.countdown-container h2').textContent = translations[currentLanguage].countdownTitle;

    // تحديث عناوين الصلاة
    const prayerCards = document.querySelectorAll('.prayer-card');
    prayerCards.forEach(card => {
        const prayerKey = card.getAttribute('data-prayer');
        card.querySelector('h2').textContent = translations[currentLanguage].prayers[prayerKey];
    });

    // تحديث التواريخ
    updateDatesDisplay();

    // تحديث النص الموقع
    updateLocationTextDisplay();

    // تحديث الإدخال اليدوي
    document.getElementById('country-input').placeholder = translations[currentLanguage].countryPlaceholder;
    document.getElementById('city-input').placeholder = translations[currentLanguage].cityPlaceholder;
    document.getElementById('submit-location').textContent = translations[currentLanguage].submitBtn;

    // تحديث الفوتر
    document.querySelector('.footer p').textContent = currentLanguage === 'ar' 
        ? '© 2026 صلاتي. جميع الحقوق محفوظة.' 
        : '© 2026 Salati. All rights reserved.';

    // تحديث الصلاة القادمة
    if (Object.keys(prayerTimes).length > 0) {
        updateCountdown();
    }
}

async function fetchPrayerTimesManual() {
    const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=2`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        prayerTimes = data.data.timings;
        window.currentDateData = data.data.date; // حفظ بيانات التاريخ
        updatePrayerTimes();
        updateDates(data.data.date);
        setTimezoneOffset(data.data.meta.timezone);
    } catch (error) {
        console.error("Error fetching prayer times:", error);
        document.getElementById('location-text').textContent = translations[currentLanguage].error;
    }
}

// طلب إذن الإشعارات
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

// إرسال إشعار
function sendNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('صلاتي - مواقيت الصلاة', {
            body: message,
            icon: 'assets/favicon.ico'
        });
    }
}

// التحقق من الإشعارات قبل 5 دقائق
function checkFiveMinuteNotifications() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
        { name: 'الفجر', time: prayerTimes.Fajr, key: 'fajr' },
        { name: 'الظهر', time: prayerTimes.Dhuhr, key: 'dhuhr' },
        { name: 'العصر', time: prayerTimes.Asr, key: 'asr' },
        { name: 'المغرب', time: prayerTimes.Maghrib, key: 'maghrib' },
        { name: 'العشاء', time: prayerTimes.Isha, key: 'isha' }
    ];

    prayers.forEach(prayer => {
        if (prayer.time) {
            const [hours, minutes] = prayer.time.split(':').map(Number);
            let localHours = hours + Math.floor(timezoneOffset / 60);
            let localMinutes = minutes + (timezoneOffset % 60);

            if (localMinutes >= 60) {
                localHours += 1;
                localMinutes -= 60;
            } else if (localMinutes < 0) {
                localHours -= 1;
                localMinutes += 60;
            }

            if (localHours >= 24) localHours -= 24;
            if (localHours < 0) localHours += 24;

            const prayerMinutes = localHours * 60 + localMinutes;
            const fiveMinutesBefore = prayerMinutes - 5;

            if (currentTime === fiveMinutesBefore) {
                sendNotification(`اقترب وقت صلاة ${prayer.name} بعد 5 دقائق`);
            }
        }
    });
}

// استدعاء الدوال عند تحميل الصفحة
window.addEventListener('load', () => {
    requestNotificationPermission();
    getLocation();
    updateClock();
    clockInterval = setInterval(updateClock, 1000); // تحديث الساعة كل ثانية
    setInterval(checkPrayerTimes, 60000); // التحقق كل دقيقة
    setInterval(checkFiveMinuteNotifications, 60000); // التحقق من الإشعارات كل دقيقة
    // بدء العد التنازلي إذا كانت مواقيت الصلاة متوفرة
    if (Object.keys(prayerTimes).length > 0) {
        startCountdown();
    }
});
