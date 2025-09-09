// شناسایی مدل دستگاه
function getPhoneModel() {
    const userAgent = navigator.userAgent;
    
    if (/iPhone/.test(userAgent)) {
        return "iPhone";
    } else if (/iPad/.test(userAgent)) {
        return "iPad";
    } else if (/Android/.test(userAgent)) {
        // استخراج مدل از رشته user-agent اندروید
        const match = userAgent.match(/Android.*;\s([^;]+)\sBuild/);
        return match ? match[1] : "Android Device";
    } else {
        return "Desktop or Other Device";
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

// ارسال داده به سرور
async function sendDataToServer(userId, phoneModel, ipAddress) {
    try {
        const response = await fetch('https://your-domain.com/webapp-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                phone_model: phoneModel,
                ip_address: ipAddress
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error("Error sending data:", error);
        return false;
    }
}

// زمانی که صفحه بارگذاری شد
document.addEventListener('DOMContentLoaded', async function() {
    const phoneModelElement = document.getElementById('phone-model');
    const ipAddressElement = document.getElementById('ip-address');
    const sendButton = document.getElementById('send-data');
    
    // نمایش اطلاعات دستگاه
    const phoneModel = getPhoneModel();
    const ipAddress = await getIPAddress();
    
    phoneModelElement.textContent = phoneModel;
    ipAddressElement.textContent = ipAddress;
    
    // ارسال اطلاعات هنگام کلیک روی دکمه
    sendButton.addEventListener('click', async function() {
        // دریافت user_id از Telegram WebApp
        const tg = window.Telegram.WebApp;
        const userId = tg.initDataUnsafe.user.id;
        
        const success = await sendDataToServer(userId, phoneModel, ipAddress);
        
        if (success) {
            alert('اطلاعات با موفقیت ارسال شد!');
            tg.close(); // بستن وب‌اپ
        } else {
            alert('خطا در ارسال اطلاعات. لطفاً دوباره تلاش کنید.');
        }
    });
});
