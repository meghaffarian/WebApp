from flask import Flask, request, jsonify
from flask_cors import CORS
from telegram import Update, Bot, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters
import json
import os
from datetime import datetime
import logging

# تنظیمات logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # فعال کردن CORS برای توسعه محلی

# توکن بات تلگرام - باید جایگزین کنید
TELEGRAM_TOKEN = "8260461409:AAHTVItKT7sh4SpkYN9-BQwitSslVpaQpYc"
WEB_APP_URL = "http://localhost:5000"  # برای توسعه محلی

# راه‌اندازی بات تلگرام
application = Application.builder().token(TELEGRAM_TOKEN).build()

# ذخیره اطلاعات کاربر در فایل JSON
def save_user_data(user_id, device_info, ip_address, browser_info, user_agent, platform, language, screen_resolution):
    data = {}
    
    # اگر فایل وجود دارد، داده‌های موجود را بارگیری کنید
    if os.path.exists('users.json'):
        try:
            with open('users.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            logger.error(f"Error reading users.json: {e}")
            data = {}
    
    # افزودن یا به‌روزرسانی اطلاعات کاربر
    data[str(user_id)] = {
        'device_info': device_info,
        'ip_address': ip_address,
        'browser_info': browser_info,
        'user_agent': user_agent,
        'platform': platform,
        'language': language,
        'screen_resolution': screen_resolution,
        'timestamp': datetime.now().isoformat()
    }
    
    # ذخیره داده‌ها در فایل
    try:
        with open('users.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        logger.info(f"Data saved for user {user_id}")
    except Exception as e:
        logger.error(f"Error saving data: {e}")

# هندلر دستور /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        user = update.effective_user
        keyboard = [[{"text": "Open Web App", "web_app": {"url": WEB_APP_URL}}]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
        
        await update.message.reply_html(
            f"سلام {user.mention_html()}! 👋\n\n"
            f"برای استفاده از بات و جمع‌آوری اطلاعات دستگاه، دکمه زیر را فشار دهید.",
            reply_markup=reply_markup
        )
        logger.info(f"Start command received from user {user.id}")
    except Exception as e:
        logger.error(f"Error in start command: {e}")

# هندلر دستور /help
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = """
🤖 **راهنمای ربات**

📱 **دستورات موجود:**
/start - شروع کار با ربات
/help - نمایش این راهنما
/info - نمایش اطلاعات ذخیره شده

🔧 **امکانات:**
- جمع‌آوری اطلاعات دستگاه
- ذخیره اطلاعات در فایل JSON
- وب اپ تعاملی

💡 **نکته:** برای استفاده از وب اپ، دکمه «Open Web App» را فشار دهید.
"""
    await update.message.reply_text(help_text, parse_mode='Markdown')

# هندلر دستور /info
async def info_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        user_id = update.effective_user.id
        
        if os.path.exists('users.json'):
            with open('users.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            user_data = data.get(str(user_id))
            if user_data:
                info_text = f"""
📊 **اطلاعات ذخیره شده شما:**

🖥️ **دستگاه:** {user_data['device_info']}
🌐 **مرورگر:** {user_data['browser_info']}
📡 **آی‌پی:** {user_data['ip_address']}
🗣️ **زبان:** {user_data['language']}
📺 **رزولوشن:** {user_data['screen_resolution']}
⏰ **زمان:** {user_data['timestamp']}
"""
                await update.message.reply_text(info_text, parse_mode='Markdown')
            else:
                await update.message.reply_text("❌ اطلاعاتی برای شما ذخیره نشده است. لطفاً از وب اپ استفاده کنید.")
        else:
            await update.message.reply_text("❌ هنوز اطلاعاتی ذخیره نشده است.")
    except Exception as e:
        logger.error(f"Error in info command: {e}")
        await update.message.reply_text("❌ خطا در دریافت اطلاعات.")

# هندلر دریافت پیام‌های متنی
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    await update.message.reply_text(f"🤖 برای شروع از دستور /start استفاده کنید.")

# هندلر دریافت داده از وب‌اپ
@app.route('/webapp-data', methods=['POST'])
def webapp_data():
    try:
        data = request.json
        logger.info(f"Received data: {data}")
        
        user_id = data.get('user_id')
        device_info = data.get('device_info', 'Unknown')
        ip_address = data.get('ip_address', request.remote_addr)
        browser_info = data.get('browser_info', 'Unknown')
        user_agent = data.get('user_agent', 'Unknown')
        platform = data.get('platform', 'Unknown')
        language = data.get('language', 'Unknown')
        screen_resolution = data.get('screen_resolution', 'Unknown')
        
        if not user_id:
            return jsonify({'status': 'error', 'message': 'User ID is required'}), 400
        
        save_user_data(user_id, device_info, ip_address, browser_info, user_agent, platform, language, screen_resolution)
        
        return jsonify({'status': 'success', 'message': 'Data saved successfully'})
    
    except Exception as e:
        logger.error(f"Error in webapp_data: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# صفحه اصلی وب اپ
@app.route('/')
def index():
    return """
<!DOCTYPE html>
<html lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ربات تلگرام - وب اپ</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            text-align: right;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #2e86de;
            text-align: center;
        }
        #device-info {
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
            border-right: 4px solid #2e86de;
        }
        button {
            background-color: #2e86de;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            margin-top: 20px;
        }
        button:hover {
            background-color: #1c6bc2;
        }
        .info-item {
            margin: 10px 0;
            padding: 5px;
        }
        .label {
            font-weight: bold;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 ربات تلگرام</h1>
        <p>اطلاعات دستگاه شما جمع‌آوری خواهد شد</p>
        
        <div id="device-info">
            <div class="info-item"><span class="label">دستگاه:</span> <span id="phone-model">در حال تشخیص...</span></div>
            <div class="info-item"><span class="label">مرورگر:</span> <span id="browser-info">در حال تشخیص...</span></div>
            <div class="info-item"><span class="label">آی‌پی:</span> <span id="ip-address">در حال دریافت...</span></div>
            <div class="info-item"><span class="label">زبان:</span> <span id="language">در حال تشخیص...</span></div>
            <div class="info-item"><span class="label">رزولوشن:</span> <span id="resolution">در حال تشخیص...</span></div>
        </div>
        
        <button id="send-data">ارسال اطلاعات</button>
    </div>

    <script>
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

        // زمانی که صفحه بارگذاری شد
        document.addEventListener('DOMContentLoaded', async function() {
            const phoneModelElement = document.getElementById('phone-model');
            const ipAddressElement = document.getElementById('ip-address');
            const browserInfoElement = document.getElementById('browser-info');
            const languageElement = document.getElementById('language');
            const resolutionElement = document.getElementById('resolution');
            const sendButton = document.getElementById('send-data');
            
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
                    const tg = window.Telegram.WebApp;
                    const userId = tg.initDataUnsafe.user.id;
                    
                    const response = await fetch('/webapp-data', {
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
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        alert('✅ اطلاعات با موفقیت ارسال شد!');
                        tg.close();
                    } else {
                        alert('❌ خطا در ارسال اطلاعات: ' + result.message);
                    }
                } catch (error) {
                    console.error("Error:", error);
                    alert('❌ خطا در ارسال اطلاعات.');
                }
            });
        });
    </script>
</body>
</html>
"""

# تنظیم وب‌هوک برای بات تلگرام
@app.route('/set_webhook', methods=['GET'])
def set_webhook():
    try:
        bot = Bot(token=TELEGRAM_TOKEN)
        webhook_url = f"{WEB_APP_URL}/{TELEGRAM_TOKEN}"
        success = bot.set_webhook(webhook_url)
        
        if success:
            return "✅ Webhook setup successfully"
        else:
            return "❌ Webhook setup failed"
    except Exception as e:
        return f"❌ Error setting webhook: {str(e)}"

@app.route('/' + TELEGRAM_TOKEN, methods=['POST'])
async def telegram_webhook():
    try:
        update = Update.de_json(request.get_json(), application.bot)
        await application.process_update(update)
        return 'OK'
    except Exception as e:
        logger.error(f"Error in webhook: {e}")
        return 'Error', 500

# راه‌اندازی سرور
if __name__ == '__main__':
    # ثبت هندلرها
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("info", info_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # ایجاد فایل users.json اگر وجود ندارد
    if not os.path.exists('users.json'):
        with open('users.json', 'w', encoding='utf-8') as f:
            json.dump({}, f, ensure_ascii=False)
    
    print("🤖 Telegram Bot Server Starting...")
    print(f"📍 Local URL: http://localhost:5000")
    print(f"🌐 Web App URL: {WEB_APP_URL}")
    print("🚀 Server is running! Press Ctrl+C to stop.")
    
    # راه‌اندازی سرور Flask
    app.run(host='0.0.0.0', port=5000, debug=True)