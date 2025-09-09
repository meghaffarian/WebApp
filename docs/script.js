// آدرس GitHub Pages شما - این رو تغییر بده
const GITHUB_PAGES_URL = "https://meghaffarian.github.io/WebApp/index.html";

// شناسایی مدل دستگاه و سیستم عامل
function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    if (/iPhone/.test(userAgent)) {
        return "iPhone iOS";
    } else if (/iPad/.test(userAgent)) {
        return "iPad iOS";
    } else if (/Android/.test(userAgent)) {
        const match = userAgent.match(/Android.*;\s([^;]+)\sBuild/);
        return match ? `Android ${match[1]}` : "Android Device";
    } else if (platform.includes('Win')) {
        if (/Windows NT 10.0/.test(userAgent)) return "Windows 10/11";
        if (/Windows NT 6.3/.test(userAgent)) return "Windows 8.1";
        if (/Windows NT 6.2/.test(userAgent)) return "Windows 8";
        if (/Windows NT 6.1/.test(userAgent)) return "Windows 7";
        return "Windows";
    } else if (platform.includes('Mac')) {
        const match = userAgent.match(/Mac OS X ([0-9_]+)/);
        return match ? `macOS ${match[1].replace(/_/g, '.')}` : "macOS";
    } else if (platform.includes('Linux')) {
        return "Linux";
    } else {
        return "Unknown Device";
    }
}

// دریافت اطلاعات مرورگر
function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        const match = userAgent.match(/Chrome\/([0-9.]+)/);
        return match ? `Chrome ${match[1]}` : "Chrome";
    } else if (userAgent.includes('Firefox')) {
        const match = userAgent.match(/Firefox\/([0-9.]+)/);
        return match ? `Firefox ${match[1]}` : "Firefox";
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        const match = userAgent.match(/Version\/([0-9.]+)/);
        return match ? `Safari ${match[1]}` : "Safari";
    } else if (userAgent.includes('Edg')) {
        const match = userAgent.match(/Edg\/([0-9.]+)/);
        return match ? `Edge ${match[1]}` : "Edge";
    } else {
        return "Unknown Browser";
    }
}

// دریافت آدرس IP
async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error("Error getting IP address:", error);
        return "Unknown";
    }
}

// ذخیره داده در localStorage (موقت)
function saveDataToLocalStorage(userData) {
    try {
        // دریافت داده‌های موجود
        const existingData = JSON.parse(localStorage.getItem('telegramBotUsers') || '{}');
        
        // افزودن داده جدید
        existingData[userData.user_id] = {
            device_info: userData.device_info,
            ip_address: userData.ip_address,
            browser_info: userData.browser_info,
            user_agent: userData.user_agent,
            platform: userData.platform,
            language: userData.language,
            screen_resolution: userData.screen_resolution,
            timestamp: new Date().toISOString()
        };
        
        // ذخیره داده‌ها
        localStorage.setItem('telegramBotUsers', JSON.stringify(existingData));
        
        return true;
    } catch (error) {
        console.error("Error saving to localStorage:", error);
        return false;
    }
}

// نمایش داده‌های ذخیره شده
function showStoredData() {
    try {
        const data = JSON.parse(localStorage.getItem('telegramBotUsers') || '{}');
        console.log("Stored data:", data);
        return data;
    } catch (error) {
        console.error("Error reading from localStorage:", error);
        return {};
    }
}

// زمانی که صفحه بارگذاری شد
document.addEventListener('DOMContentLoaded', async function() {
    const phoneModelElement = document.getElementById('phone-model');
    const ipAddressElement = document.getElementById('ip-address');
    const browserInfoElement = document.getElementById('browser-info');
    const languageElement = document.getElementById('language');
    const resolutionElement = document.getElementById('resolution');
    const sendButton = document.getElementById('send-data');
    const statusElement = document.getElementById('status');
    
    // نمایش اطلاعات دستگاه
    const deviceInfo = getDeviceInfo();
    const browserInfo = getBrowserInfo();
    const ipAddress = await getIPAddress();
    
    phoneModelElement.textContent = deviceInfo;
    browserInfoElement.textContent = browserInfo;
    ipAddressElement.textContent = ipAddress;
    languageElement.textContent = navigator.language;
    resolutionElement.textContent = `${screen.width}x${screen.height}`;
    
    // نمایش داده‌های ذخیره شده قبلی (برای تست)
    const storedData = showStoredData();
    console.log("Previously stored data:", storedData);
    
    // ارسال اطلاعات هنگام کلیک روی دکمه
    sendButton.addEventListener('click', async function() {
        try {
            sendButton.disabled = true;
            statusElement.textContent = "در حال ذخیره اطلاعات...";
            statusElement.style.color = "blue";
            
            const tg = window.Telegram.WebApp;
            const userId = tg.initDataUnsafe.user.id;
            
            // ذخیره در localStorage
            const success = saveDataToLocalStorage({
                user_id: userId,
                device_info: deviceInfo,
                ip_address: ipAddress,
                browser_info: browserInfo,
                user_agent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screen_resolution: `${screen.width}x${screen.height}`
            });
            
            if (success) {
                statusElement.textContent = "✅ اطلاعات با موفقیت ذخیره شد!";
                statusElement.style.color = "green";
                
                // نمایش داده ذخیره شده
                const newData = showStoredData();
                console.log("New stored data:", newData);
                
                // بستن وب‌اپ بعد از 2 ثانیه
                setTimeout(() => {
                    if (tg && tg.close) {
                        tg.close();
                    }
                }, 2000);
            } else {
                statusElement.textContent = "❌ خطا در ذخیره اطلاعات.";
                statusElement.style.color = "red";
                sendButton.disabled = false;
            }
            
        } catch (error) {
            console.error("Error:", error);
            statusElement.textContent = "❌ خطا در ذخیره اطلاعات. لطفاً دوباره تلاش کنید.";
            statusElement.style.color = "red";
            sendButton.disabled = false;
        }
    });
});

// تابع برای دانلود داده‌ها به صورت فایل JSON (برای توسعه)
function downloadData() {
    try {
        const data = localStorage.getItem('telegramBotUsers');
        if (data) {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'telegram_bot_data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error("Error downloading data:", error);
    }
}

// تابع برای پاک کردن داده‌ها (برای توسعه)
function clearData() {
    if (confirm('آیا از پاک کردن همه داده‌ها مطمئن هستید؟')) {
        localStorage.removeItem('telegramBotUsers');
        alert('داده‌ها پاک شدند.');
        location.reload();
    }
}

// اضافه کردن دکمه‌های توسعه به صفحه (فقط در حالت توسعه)
if (window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1')) {
    document.addEventListener('DOMContentLoaded', function() {
        const devButtons = `
            <div style="margin-top: 20px; padding: 10px; background: #eee; border-radius: 5px;">
                <h3>ابزارهای توسعه:</h3>
                <button onclick="downloadData()" style="background: #28a745; margin: 5px;">دانلود داده‌ها</button>
                <button onclick="clearData()" style="background: #dc3545; margin: 5px;">پاک کردن داده‌ها</button>
                <button onclick="console.log(showStoredData())" style="background: #17a2b8; margin: 5px;">نمایش در کنسول</button>
            </div>
        `;
        document.querySelector('.container').innerHTML += devButtons;
    });
}
