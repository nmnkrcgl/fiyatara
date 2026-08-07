#!/usr/bin/env python3
"""
validate_products.py — Fiyatara ürün verisi doğrulama aracı

NE YAPAR:
1. data/products.json içindeki TÜM ürünlerde otomatik bütünlük taraması yapar
   (boş isim, bozuk URL, fiyat/link uyuşmazlığı, tekrarlanan id, sorgu-isim eşleşmesi vb.)
2. Her ana kategoriden rastgele örnekler seçip, gerçek Google araması için
   hazır sorgu listesi üretir (bu kısmı Claude'a verip web_search ile
   gerçekten test ettirebilirsiniz — script'in kendisi internete çıkmaz).

NASIL ÇALIŞTIRILIR:
    python3 scripts/validate_products.py
    python3 scripts/validate_products.py --sample 5   # kategori başına 5 örnek

NE ZAMAN ÇALIŞTIRILMALI:
- data/products.json her güncellendiğinde (yeni ürün eklendiğinde,
  link üretim mantığı değiştiğinde)
- "market linki bulunamadı" gibi bir şikayet geldiğinde, ilk teşhis adımı olarak
"""

import json
import re
import sys
import urllib.parse
import argparse
import random
from pathlib import Path
from collections import Counter, defaultdict

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "data" / "products.json"


def load_products():
    if not DATA_FILE.exists():
        print(f"HATA: {DATA_FILE} bulunamadı.")
        sys.exit(1)
    with open(DATA_FILE, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("products", data if isinstance(data, list) else [])


def integrity_check(products):
    print(f"Toplam ürün: {len(products)}\n")
    issues = defaultdict(list)
    ids = Counter()

    for p in products:
        name = (p.get("name") or "").strip()
        pid = p.get("id")
        ids[pid] += 1

        if not name:
            issues["boş isim"].append(pid)
        if '"' in name:
            issues["tırnak içeren isim (sorguyu bozabilir)"].append(name)
        if len(name) < 5:
            issues["çok kısa isim"].append(name)

        prices = p.get("prices", {})
        links = p.get("links", {})
        for m in links:
            if m not in prices:
                issues["fiyat yok ama link var"].append(f"{name} [{m}]")
        for m in prices:
            if m not in links:
                issues["link yok ama fiyat var"].append(f"{name} [{m}]")

        for m, url in links.items():
            try:
                parsed = urllib.parse.urlparse(url)
                if not parsed.scheme or not parsed.netloc:
                    issues["geçersiz URL"].append(url)
                    continue
                q = urllib.parse.parse_qs(parsed.query).get("q", [""])[0]
                if name and name not in q:
                    issues["sorgu isimle eşleşmiyor"].append(f"{name} -> {q}")
            except Exception as e:
                issues["geçersiz URL"].append(f"{url} ({e})")

    for pid, count in ids.items():
        if count > 1:
            issues["tekrarlanan id"].append(pid)

    total_issues = sum(len(v) for v in issues.values())
    print("=== BÜTÜNLÜK TARAMASI ===")
    if total_issues == 0:
        print("✅ Hiçbir yapısal hata bulunamadı.\n")
    else:
        for k, v in issues.items():
            print(f"⚠️  {k}: {len(v)}")
            for x in v[:5]:
                print("    -", x)
        print()
    return issues


def category_breakdown(products):
    print("=== KATEGORİ DAĞILIMI ===")
    cats = Counter(p.get("category", "?") for p in products)
    for cat, count in cats.most_common():
        print(f"  {cat}: {count}")
    print()
    return cats


def stratified_sample(products, n_per_category):
    by_cat = defaultdict(list)
    for p in products:
        by_cat[p.get("category", "?")].append(p)

    sample = []
    for cat, items in by_cat.items():
        sample.extend(random.sample(items, min(n_per_category, len(items))))
    return sample


def print_search_queries(sample):
    print(f"=== GERÇEK ARAMA TESTİ İÇİN ÖRNEKLEM ({len(sample)} ürün) ===")
    print("Aşağıdaki her satırı Claude'a verip web_search ile gerçekten")
    print("test ettirin; ilk sonucun doğru/geçerli bir ürün sayfası olup")
    print("olmadığını kontrol edin.\n")
    for p in sample:
        print(f'"{p["name"]}"   [{p.get("category")}]')
    print()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", type=int, default=3,
                         help="Kategori başına kaç ürün örneklensin (varsayılan: 3)")
    parser.add_argument("--seed", type=int, default=None,
                         help="Tekrarlanabilir örneklem için random seed")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    products = load_products()
    issues = integrity_check(products)
    category_breakdown(products)
    sample = stratified_sample(products, args.sample)
    print_search_queries(sample)

    if sum(len(v) for v in issues.values()) > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
