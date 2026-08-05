import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PRODUCTS as BUNDLED_PRODUCTS } from './data/products';

const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/nmnkrcgl/fiyatara/master/data/products.json';

const CAT_ORDER = ['Süt & Kahvaltı', 'Temel Gıda', 'Et & Şarküteri', 'Manav', 'Temizlik', 'Kişisel Bakım', 'Bebek', 'Kedi Ürünleri', 'Atıştırmalık', 'İçecek', 'Diğer'];
const CATEGORIES = ['Hepsi', ...CAT_ORDER.filter(c => BUNDLED_PRODUCTS.some(p => p.category === c))];

const CATEGORY_COLORS = {
  'Süt & Kahvaltı': '#fef3c7',
  'Temel Gıda': '#fde68a',
  'Et & Şarküteri': '#fecaca',
  'Manav': '#bbf7d0',
  'Temizlik': '#a7f3d0',
  'Kişisel Bakım': '#c7d2fe',
  'Bebek': '#fbcfe8',
  'Kedi Ürünleri': '#e9d5ff',
  'Atıştırmalık': '#fed7aa',
  'İçecek': '#bae6fd',
  'Diğer': '#e5e7eb',
};

const ALL_MARKETS = ['A101', 'CarrefourSA', 'Migros', 'ŞOK'];

function fmt(price) {
  if (typeof price !== 'number' || isNaN(price)) return '—';
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

function ProductThumb({ product }) {
  const [failed, setFailed] = useState(false);
  if (product.image && !failed) {
    return <Image source={{ uri: product.image }} style={styles.productImage} onError={() => setFailed(true)} />;
  }
  return (
    <View style={[styles.iconCircle, { backgroundColor: CATEGORY_COLORS[product.category] || '#e5e7eb' }]}>
      <Text style={styles.iconText}>{product.icon || '🛒'}</Text>
    </View>
  );
}

function FiyataraApp() {
  const [tab, setTab] = useState('home');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Hepsi');
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState(BUNDLED_PRODUCTS);
  const [dataDate, setDataDate] = useState(null);

  useEffect(() => {
    if (!REMOTE_DATA_URL) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`${REMOTE_DATA_URL}?v=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
        if (!resp.ok) return;
        const json = await resp.json();
        if (!cancelled && json && Array.isArray(json.products) && json.products.length > 0) {
          setProducts(json.products);
          if (json.updated_at) setDataDate(json.updated_at);
        }
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesQuery = !query || p.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === 'Hepsi' || p.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  const getCheapest = (prices) => {
    let minPrice = Infinity;
    let minMarket = '';
    Object.keys(prices).forEach(m => {
      if (prices[m] < minPrice) {
        minPrice = prices[m];
        minMarket = m;
      }
    });
    return minMarket ? { price: minPrice, market: minMarket } : null;
  };

  const addToCart = (product, market, price) => {
    setCart([...cart, { ...product, selectedMarket: market, selectedPrice: price, cartId: Date.now() }]);
    alert(`${product.name} sepete eklendi!`);
  };

  const dataLabel = dataDate
    ? `Güncel veri: ${new Date(dataDate).toLocaleDateString('tr-TR')}`
    : 'Gerçek fiyatlar (uyguno.com)';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ZN Fiyatara 🛒</Text>
        <Text style={styles.headerSubtitle}>{products.length} ürün • {dataLabel}</Text>
      </View>

      {tab === 'home' ? (
        <View style={{ flex: 1 }}>
          <TextInput style={styles.searchBar} placeholder={`${products.length} ürün arasında ara...`} value={query} onChangeText={setQuery} />

          <View style={{ height: 50 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catWrapper}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.catBtn, category === c && styles.catBtnActive]} onPress={() => setCategory(c)}>
                  <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView style={styles.list}>
            <Text style={styles.countText}>Toplam Listelenen Ürün: {filteredProducts.length}</Text>
            {filteredProducts.slice(0, 50).map(p => {
              const cheapest = getCheapest(p.prices);
              return (
                <View key={p.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <ProductThumb product={p} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.cardTitle}>{p.name}</Text>
                      <Text style={styles.cardSub}>{p.category}</Text>
                      {cheapest ? (
                        <Text style={styles.cheapestLabel}>En Uygun: {fmt(cheapest.price)} TL ({cheapest.market})</Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.priceWrap}>
                    {Object.keys(p.prices).map(m => (
                      <View key={m} style={styles.priceChip}>
                        <Text style={styles.priceChipMarket}>{m}</Text>
                        <Text style={styles.priceChipValue}>{fmt(p.prices[m])} TL</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.btnGroup}>
                    <TouchableOpacity style={styles.detailBtn} onPress={() => setSelectedProduct(p)}>
                      <Text style={styles.btnText}>Market Sayfaları</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addBtn}
                      disabled={!cheapest}
                      onPress={() => cheapest && addToCart(p, cheapest.market, cheapest.price)}
                    >
                      <Text style={styles.btnText}>{cheapest ? `Sepete Ekle (${cheapest.market})` : 'Sepete Ekle'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          <Text style={styles.sectionTitle}>Ortak Sepetiniz</Text>
          {cart.length === 0 && <Text style={styles.emptyText}>Sepetiniz boş. Ürün kartından "Sepete Ekle"ye dokunun.</Text>}
          {cart.map(item => (
            <View key={item.cartId} style={styles.cartCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cartSub}>{item.selectedMarket} • {fmt(item.selectedPrice)} TL</Text>
              </View>
              <TouchableOpacity style={styles.goMarketBtn} onPress={() => {
                const url = item.links[item.selectedMarket];
                if (url) Linking.openURL(url);
              }}>
                <Text style={styles.btnText}>Siteden Satın Al</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {selectedProduct && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
            {ALL_MARKETS.map(m => {
              const url = selectedProduct.links[m];
              if (!url) return null;
              return (
                <TouchableOpacity key={m} style={styles.marketLinkBtn} onPress={() => Linking.openURL(url)}>
                  <Text style={styles.btnText}>
                    {m} Mağazasında Ara{selectedProduct.prices[m] ? ` (${fmt(selectedProduct.prices[m])} TL)` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedProduct(null)}><Text style={styles.btnText}>Kapat</Text></TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('home')}><Text style={styles.tabText}>🏪 Ürünler</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('cart')}><Text style={styles.tabText}>🛒 Sepet ({cart.length})</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FiyataraApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1e3a8a', padding: 15, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#bfdbfe', fontSize: 12 },
  searchBar: { backgroundColor: '#fff', padding: 10, margin: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  catWrapper: { flexDirection: 'row', paddingHorizontal: 10, height: 40 },
  catBtn: { backgroundColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginRight: 6, height: 30 },
  catBtnActive: { backgroundColor: '#1e3a8a' },
  catText: { color: '#374151', fontSize: 12 },
  catTextActive: { color: '#fff' },
  countText: { fontSize: 13, color: '#6b7280', marginBottom: 10, fontWeight: 'bold' },
  list: { flex: 1, paddingHorizontal: 10 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  productImage: { width: 70, height: 70, borderRadius: 6, backgroundColor: '#eee' },
  iconCircle: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 32 },
  cardTitle: { fontSize: 14, fontWeight: 'bold' },
  cardSub: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  cheapestLabel: { fontSize: 12, fontWeight: 'bold', color: '#16a34a', marginTop: 4 },
  priceWrap: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#f9fafb', padding: 6, borderRadius: 4, marginBottom: 8 },
  priceChip: { backgroundColor: '#e0e7ff', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, margin: 2, flexDirection: 'row', alignItems: 'center' },
  priceChipMarket: { fontSize: 10, color: '#3730a3', fontWeight: 'bold', marginRight: 5 },
  priceChipValue: { fontSize: 10, color: '#111827', fontWeight: 'bold' },
  btnGroup: { flexDirection: 'row', justifyContent: 'space-between' },
  detailBtn: { backgroundColor: '#4b5563', padding: 8, borderRadius: 4, flex: 0.48, alignItems: 'center' },
  addBtn: { backgroundColor: '#1e3a8a', padding: 8, borderRadius: 4, flex: 0.48, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  footer: { flexDirection: 'row', height: 50, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  tabBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 13, color: '#1e3a8a', fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
  emptyText: { fontSize: 13, color: '#6b7280', marginVertical: 20, textAlign: 'center' },
  cartCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartSub: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  goMarketBtn: { backgroundColor: '#16a34a', padding: 8, borderRadius: 4 },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalContent: { backgroundColor: '#fff', width: '80%', padding: 15, borderRadius: 10 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  marketLinkBtn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 6, marginBottom: 6, alignItems: 'center' },
  closeBtn: { backgroundColor: '#9ca3af', padding: 10, borderRadius: 6, marginTop: 6, alignItems: 'center' }
});
