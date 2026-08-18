/* global __dirname */

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '../src/locales');
const trPath = path.join(localesPath, 'tr.json');
const enPath = path.join(localesPath, 'en.json');

// Kelime/Metin bazlı çeviri esnasında çevrilmesini İSTEMEDİĞİMİZ ifadeler.
// NOT: Tam eşleşme olanlar doğrudan korunur. Metin içinde geçenler için Regex ile özel koruma sağlanabilir.
const IGNORE_WORDS = [
  'AsEmOs',
  'AsEmOs+',
  // Buraya daha sonra değişmesini istemediğiniz kelimeleri ekleyebilirsiniz...
];

// Google Translate API (Ücretsiz, API key gerektirmez, URL tabanlı)
async function translateText(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Eğer metin sadece sayı veya noktalama ise çevirme
  if (/^[\d.,!?:;\-\s]+$/.test(text)) return text;
  
  // Tam eşleşme ile Ignore list kontrolü
  if (IGNORE_WORDS.includes(text)) return text;
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=tr&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Google Translate uzun metinleri parçalı döner, birleştir
    let translated = '';
    if (data && data[0]) {
      for (const item of data[0]) {
        if (item[0]) translated += item[0];
      }
    }
    
    // Çeviri içindeki değişkenleri (ör: {{count}}) Google bazen "{{ count }}" yapar, düzeltelim
    translated = translated.replace(/\{\{\s*(.*?)\s*\}\}/g, '{{$1}}');
    
    // Özel kelimelerin yanlış çevrilmesini önlemek için (replace mantığı)
    // Örnek: Eğer "AsEmOs" kelimesini küçük harfe falan çevirdiyse orjinaline döndür
    for (const word of IGNORE_WORDS) {
      const regex = new RegExp(word, 'gi'); // case-insensitive search
      if (regex.test(text) && !translated.includes(word)) {
        // Eğer orjinal metinde kelime varsa ama çeviride bozulmuşsa, eski haline döndürmeye çalış
        translated = translated.replace(regex, word);
      }
    }
    
    return translated || text;
  } catch (error) {
    console.error(`Çeviri hatası ("${text}"):`, error.message);
    return text;
  }
}

// İç içe geçmiş (nested) JSON objelerinde dolaşmak için recursive fonksiyon
async function syncObjects(source, target, path = '') {
  let isUpdated = false;
  
  for (const key in source) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
        isUpdated = true;
      }
      const nestedUpdated = await syncObjects(source[key], target[key], currentPath);
      if (nestedUpdated) isUpdated = true;
    } else {
      // Eğer target JSON dosyasında bu key yoksa (veya tamamen boş string ise) çevirip ekle
      if (target[key] === undefined || target[key] === "") {
        console.log(`\n⏳ Yeni metin bulundu: [${currentPath}] => "${source[key]}"`);
        const translated = await translateText(source[key]);
        target[key] = translated;
        console.log(`✅ Çevrildi: "${translated}"`);
        isUpdated = true;
        // Google API'den ban yememek için araya 300ms bekleme koyuyoruz
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }
  
  // (Opsiyonel) Eğer tr.json'dan silinmiş ama en.json'da kalan key'ler varsa silebiliriz
  // Ancak genellikle silme işlemi tehlikeli olabileceği için pas geçiyoruz.
  
  return isUpdated;
}

async function main() {
  console.log('🔄 tr.json üzerinden en.json dosyası senkronize ediliyor...');
  
  try {
    const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
    let enData = {};
    if (fs.existsSync(enPath)) {
      enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    }
    
    const isUpdated = await syncObjects(trData, enData);
    
    if (isUpdated) {
      // JSON formatını bozmadan 2 boşluk bırakarak kaydet
      fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
      console.log('\n🎉 Senkronizasyon başarıyla tamamlandı! en.json güncellendi.');
    } else {
      console.log('\n✨ Zaten güncel. Herhangi bir eksik çeviri bulunamadı.');
    }
    
  } catch (err) {
    console.error('Beklenmeyen bir hata oluştu:', err);
  }
}

main();
