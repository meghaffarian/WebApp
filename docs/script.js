// شناسایی مدل دستگاه و سیستم عامل
function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    // تشخیص دستگاه موبایل
    if (/iPhone/.test(userAgent)) {
        return "iPhone iOS";
    } else if (/iPad/.test(userAgent)) {
        return "iPad iOS";
    } else if (/Android/.test(userAgent)) {
        const match = userAgent.match(/Android.*;\s([^;]+)\sBuild/);
        return match ? `Android ${match[1]}` : "Android Device";
    }
    
    // تشخیص سیستم عامل دسکتاپ
    else if (platform.includes('Win')) {
        const windowsVersion = getWindowsVersion(userAgent);
        return `Windows ${windowsVersion}`;
    } else if (platform.includes('Mac')) {
        const macVersion = getMacVersion(userAgent);
        return `macOS ${macVersion}`;
    } else if (platform.includes('Linux')) {
        return "Linux";
    } else {
        return "Unknown Device";
    }
}

// تشخیص نسخه ویندوز
function getWindowsVersion(userAgent) {
    if (/Windows NT 10.0/.test(userAgent)) return "10/11";
    if (/Windows NT 6.3/.test(userAgent)) return "8.1";
    if (/Windows NT 6.2/.test(userAgent)) return "8";
    if (/Windows NT 6.1/.test(userAgent)) return "7";
    if (/Windows NT 6.0/.test(userAgent)) return "Vista";
    if (/Windows NT 5.1/.test(userAgent)) return "XP";
    return "";
}

// تشخیص نسخه مک
function getMacVersion(userAgent) {
    const match = userAgent.match(/Mac OS X ([0-9_]+)/);
    if (match) {
        return match[1].replace(/_/g, '.');
    }
    return "";
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

// زمانی که صفحه بارگذاری شد
document.addEventListener('DOMContentLoaded', async function() {
    const phoneModelElement = document.getElementById('phone-model');
    const ipAddressElement = document.getElementById('ip-address');
    const browserInfoElement = document.getElementById('browser-info');
    const sendButton = document.getElementById('send-data');
    
    // نمایش اطلاعات دستگاه
    const deviceInfo = getDeviceInfo();
    const browserInfo = getBrowserInfo();
    const ipAddress = await getIPAddress();
    
    phoneModelElement.textContent = deviceInfo;
    ipAddressElement.textContent = ipAddress;
    browserInfoElement.textContent = browserInfo;
    
    // ارسال اطلاعات هنگام کلیک روی دکمه
    sendButton.addEventListener('click', async function() {
        const tg = window.Telegram.WebApp;
        const userId = tg.initDataUnsafe.user.id;
        
        const success = await sendDataToServer(userId, deviceInfo, ipAddress, browserInfo);
        
        if (success) {
            alert('اطلاعات با موفقیت ارسال شد!');
            tg.close();
        } else {
            alert('خطا در ارسال اطلاعات. لطفاً دوباره تلاش کنید.');
        }
    });
});

// تابع ارسال داده به سرور (آپدیت شده)
async function sendDataToServer(userId, deviceInfo, ipAddress, browserInfo) {
    try {
        const response = await fetch('http://localhost:5000/webapp-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                device_info: deviceInfo,
                ip_address: ipAddress,
                browser_info: browserInfo,
                user_agent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screen_resolution: `${screen.width}x${screen.height}`
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error("Error sending data:", error);
        return false;
    }
}
