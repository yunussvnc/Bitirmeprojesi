const fs = require('fs');
const enPath = './src/locales/en.json';
const trPath = './src/locales/tr.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const tr = JSON.parse(fs.readFileSync(trPath, 'utf8'));

// 1. Comments
if (!en.settings_comments) en.settings_comments = {};
if (!tr.settings_comments) tr.settings_comments = {};

en.settings_comments.disable_default = "Disable comments by default";
en.settings_comments.disable_hint = "When turned on, comments on new posts will be disabled by default. You can change this per post.";
en.settings_comments.nobody = "Nobody";
en.settings_comments.allow_hint = "Followers: Only people you follow can comment. Nobody: No one can comment.";

tr.settings_comments.disable_default = "Varsayılan olarak yorumları kapat";
tr.settings_comments.disable_hint = "Açıldığında, yeni paylaşımlarında yorumlar varsayılan olarak kapalı olur. Her paylaşımda bunu ayrıca değiştirebilirsin.";
tr.settings_comments.nobody = "Kapalı";
tr.settings_comments.allow_hint = "Takipçiler: Yalnızca seni takip eden kişiler yorum yapabilir. Kapalı: Hiç kimse yorum yapamaz.";

// 2. Location
if (!en.settings_location) en.settings_location = {};
if (!tr.settings_location) tr.settings_location = {};

en.settings_location.title = "Location Permissions";
en.settings_location.access = "Location Access";
en.settings_location.granted = "Granted";
en.settings_location.denied = "Denied";
en.settings_location.preferences = "Location Preferences";
en.settings_location.add_to_posts = "Add location to posts";
en.settings_location.add_to_posts_desc = "Automatically adds your location when sharing posts and stories.";
en.settings_location.map_usage = "Map Usage";
en.settings_location.nearby_places = "Nearby Places";
en.settings_location.active = "Active";
en.settings_location.location_history = "Location History";
en.settings_location.stored_on_device = "Stored on device";
en.settings_location.history_desc = "Your location data is securely stored on your device and never shared with third parties.";
en.settings_location.open_settings = "Open System Location Settings";

tr.settings_location.title = "Konum İzinleri";
tr.settings_location.access = "Konum Erişimi";
tr.settings_location.granted = "İzin Verildi";
tr.settings_location.denied = "Reddedildi";
tr.settings_location.preferences = "Konum Tercihleri";
tr.settings_location.add_to_posts = "Paylaşımlarda konum bilgisi ekle";
tr.settings_location.add_to_posts_desc = "Gönderi ve hikaye paylaşırken konumun otomatik olarak eklenmesini sağlar.";
tr.settings_location.map_usage = "Harita Kullanımı";
tr.settings_location.nearby_places = "Yakındaki mekanlar";
tr.settings_location.active = "Aktif";
tr.settings_location.location_history = "Konum geçmişi";
tr.settings_location.stored_on_device = "Cihazda saklanır";
tr.settings_location.history_desc = "Konum verileriniz yalnızca cihazınızda saklanır ve hiçbir zaman üçüncü taraflarla paylaşılmaz.";
tr.settings_location.open_settings = "Sistem Konum Ayarlarını Aç";

// 3. Privacy Center
if (!en.settings_privacy_center) en.settings_privacy_center = {};
if (!tr.settings_privacy_center) tr.settings_privacy_center = {};

en.settings_privacy_center.priority_title = "Privacy is Our Priority";
en.settings_privacy_center.priority_desc = "Your data is secure. Asemos does not sell your personal information or share it with third parties.";
en.settings_privacy_center.permissions = "Permissions";
en.settings_privacy_center.data_policy = "Data Policy";
en.settings_privacy_center.tos = "Terms of Service";
en.settings_privacy_center.cookie_policy = "Cookie Policy";
en.settings_privacy_center.kvkk_title = "GDPR (General Data Protection Regulation)";
en.settings_privacy_center.kvkk_desc = "Within the scope of GDPR, your personal data is processed by Asemos as the data controller for the following purposes:\n\n• Account creation and identity verification\n• Service presentation and improvement\n• Security and fraud prevention\n• Fulfillment of legal obligations\n\nIn accordance with our disclosure obligation under GDPR, for more information on the purposes of processing your personal data, to whom and for what purposes it may be transferred, please read our Privacy Policy.";

tr.settings_privacy_center.priority_title = "Gizliliğin Bizim İçin Öncelik";
tr.settings_privacy_center.priority_desc = "Verileriniz güvende. Asemos, kişisel bilgilerinizi satmaz veya üçüncü taraflarla paylaşmaz.";
tr.settings_privacy_center.permissions = "Permissions"; // will be translated in component
tr.settings_privacy_center.data_policy = "Data Policy"; // will be translated in component
tr.settings_privacy_center.tos = "Terms of Service"; // will be translated in component
tr.settings_privacy_center.cookie_policy = "Çerez Politikası";
tr.settings_privacy_center.kvkk_title = "KVKK (Kişisel Verilerin Korunması)";
tr.settings_privacy_center.kvkk_desc = "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, kişisel verileriniz veri sorumlusu sıfatıyla Asemos tarafından aşağıda açıklanan amaçlar doğrultusunda işlenmektedir.\n\n• Hesap oluşturma ve kimlik doğrulama\n• Hizmet sunumu ve iyileştirme\n• Güvenlik ve dolandırıcılık önleme\n• Yasal yükümlülüklerin yerine getirilmesi\n\nKVKK kapsamında aydınlatma yükümlülüğümüz gereğince kişisel verilerinizin işlenme amaçları, aktarım yapılan taraflar ve haklarınız hakkında detaylı bilgi almak için Gizlilik Politikamızı okuyabilirsiniz.";

// 4. About App Desc
if (!en.settings_about) en.settings_about = {};
if (!tr.settings_about) tr.settings_about = {};

en.settings_about.app_desc = "With this application, you can discover nearby venues, meet new people, and securely store your data.";
tr.settings_about.app_desc = "Bu uygulama ile çevrendeki mekanları keşfedebilir, yeni insanlarla tanışabilir ve verilerini güvenle saklayabilirsin.";

// 5. Help Center
if (!en.settings_help) en.settings_help = {};
if (!tr.settings_help) tr.settings_help = {};

en.settings_help.faqs = "Frequently Asked Questions";
en.settings_help.contact_us = "Contact Us";

tr.settings_help.faqs = "Sıkça Sorulan Sorular";
tr.settings_help.contact_us = "Bize Ulaşın";

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(trPath, JSON.stringify(tr, null, 2));
