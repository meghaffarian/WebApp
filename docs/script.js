// آدرس سرور پایتون روی کامپیوتر تو
// باید با Ngrok یا similar tool قابل دسترس بشه
const PYTHON_SERVER_URL = " https://41212403f5e383fc6daa2e1d2effa1f5.serveo.net";

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

// ارسال داده به سرور پایتون
async function sendDataToServer(userId, deviceInfo, ipAddress, browserInfo, userAgent, platform, language, screenResolution) {
    try {
        const response = await fetch(`${PYTHON_SERVER_URL}/webapp-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                device_info: deviceInfo,
                ip_address: ipAddress,
                browser_info: browserInfo,
                user_agent: userAgent,
                platform: platform,
                language: language,
                screen_resolution: screenResolution
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error sending data:", error);
        throw error;
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
    
    // ارسال اطلاعات هنگام کلیک روی دکمه
    sendButton.addEventListener('click', async function() {
        try {
            sendButton.disabled = true;
            statusElement.textContent = "در حال ارسال اطلاعات...";
            statusElement.style.color = "blue";
            
            const tg = window.Telegram.WebApp;
            const userId = tg.initDataUnsafe.user.id;
            
            const result = await sendDataToServer(
                userId,
                deviceInfo,
                ipAddress,
                browserInfo,
                navigator.userAgent,
                navigator.platform,
                navigator.language,
                `${screen.width}x${screen.height}`
            );
            
            statusElement.textContent = "✅ اطلاعات با موفقیت ارسال شد!";
            statusElement.style.color = "green";
            
            // بستن وب‌اپ بعد از 2 ثانیه
            setTimeout(() => {
                tg.close();
            }, 2000);
            
        } catch (error) {
            console.error("Error:", error);
            statusElement.textContent = "❌ خطا در ارسال اطلاعات. لطفاً دوباره تلاش کنید.";
            statusElement.style.color = "red";
            sendButton.disabled = false;
        }
    });
});
