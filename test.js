const normalize = (t) => t ? t.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c') : "";
console.log(normalize("Çiya Sofrası").includes(normalize("ciya")));
