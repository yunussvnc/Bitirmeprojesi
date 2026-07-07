"""
Query Rewriter - parse_natural_query() çıktısını kullanarak embedding'e
giden metni kural tabanlı zenginleştirir. Ek LLM çağrısı yapmaz.
"""

from typing import Dict, Optional

# Not: parse_natural_query() 'category' alanı için eşleşme olmasa bile 'kafe'
# varsayılanına döner (app.py:1123) — bu yüzden 'category' alanı burada
# GÜVENİLİR bir sinyal değildir ve kasıtlı olarak kullanılmaz. Aksi halde
# alakasız sorgulara "kafe" terimi sızıp embedding'i yanlış yönlendirebilir.
# 'district'/'features'/'mood'/'group_type' eşleşme yoksa None/boş liste
# döndüğü için güvenle kullanılabilir.


def rewrite_query(query: str, parsed: Optional[Dict]) -> str:
    """
    parse_natural_query() çıktısındaki güvenilir sinyalleri (district,
    features, mood, group_type) embedding metnine ekler.

    parsed None/boşsa veya hiçbir sinyal yoksa query değişmeden döner.
    """
    if not parsed:
        return query

    extras = []

    district = parsed.get("district")
    if district:
        extras.append(district)

    for feature in parsed.get("features") or []:
        extras.append(feature)

    mood = parsed.get("mood")
    if mood:
        extras.append(mood)

    group_type = parsed.get("group_type")
    if group_type and group_type != "bireysel":
        extras.append(group_type)

    if not extras:
        return query

    # Zaten query içinde geçen terimleri tekrar eklemeyip dedup ediyoruz,
    # orijinal sırayı koruyoruz.
    query_lower = query.lower()
    unique_extras = []
    seen = set()
    for term in extras:
        key = term.lower()
        if key in seen or key in query_lower:
            continue
        seen.add(key)
        unique_extras.append(term)

    if not unique_extras:
        return query

    return f"{query} {' '.join(unique_extras)}"
