/**
 * Test Notification Creation
 * Use this to test if notifications are working
 * 
 * Usage:
 * 1. Update USER_ID and USER_TYPE below with your actual values
 * 2. Run: node testNotification.js
 */

const createTestNotification = async () => {
    // ⚠️ UPDATE THESE VALUES WITH YOUR ACTUAL USER DATA
    const USER_ID = 5;  // Change this to your lawyer_id or user_id
    const USER_TYPE = 'lawyer';  // 'lawyer' or 'client'
    
    try {
        const response = await fetch('http://localhost:5000/api/notifications/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: USER_ID,
                user_type: USER_TYPE,
                type: 'NEW_MESSAGE',
                title: 'إشعار تجريبي',
                message: 'هذا إشعار تجريبي للتأكد من عمل النظام. إذا ظهر هذا الإشعار، فإن النظام يعمل بشكل صحيح!',
                priority: 'high',
                action_url: `/${USER_TYPE}/notifications`
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ تم إنشاء الإشعار بنجاح!');
            console.log('📋 البيانات:', data);
            console.log('\n🔍 الآن افتح المتصفح وتحقق من أيقونة الجرس 🔔');
        } else {
            console.error('❌ فشل إنشاء الإشعار:', data);
        }
    } catch (error) {
        console.error('❌ خطأ في الاتصال:', error.message);
        console.log('\n⚠️ تأكد من تشغيل الخادم على http://localhost:5000');
    }
};

// Run the test
console.log('🧪 جاري اختبار نظام الإشعارات...\n');
createTestNotification();
