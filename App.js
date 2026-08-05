import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Linking, Image, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
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

const COLORS = {
  primary: '#1d4ed8',
  primaryDark: '#1e3a8a',
  primaryLight: '#dbeafe',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#0f172a',
  textSoft: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  successBg: '#dcfce7',
  priceBg: '#eff6ff',
};

function fmt(price) {
  if (typeof price !== 'number' || isNaN(price)) return '—';
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

function ProductThumb({ product, size = 72 }) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  if (product.image && !failed) {
    return (
      <View style={{ width: size, height: size, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
        {loading && <ActivityIndicator style={StyleSheet.absoluteFill} color={COLORS.primary} />}
        <Image
          source={{ uri: product.image }}
          style={{ width: size, height: size, borderRadius: 12 }}
          resizeMode="cover"
          onLoadEnd={() => setLoading(false)}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }
  return (
    <View style={[styles.iconCircle, { width: size, height: size, borderRadius: 12, backgroundColor: CATEGORY_COLORS[product.category] || '#e5e7eb' }]}>
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
  const [updating, setUpdating] = useState(false);

  const loadRemoteData = async (notify = false) => {
    if (!REMOTE_DATA_URL || updating) return;
    setUpdating(true);
    try {
      const resp = await fetch(`${REMOTE_DATA_URL}?v=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      if (json && Array.isArray(json.products) && json.products.length > 0) {
        setProducts(json.products);
        if (json.updated_at) setDataDate(json.updated_at);
        if (notify) alert(`Veri güncellendi: ${json.products.length} ürün (${new Date(json.updated_at || Date.now()).toLocaleDateString('tr-TR')})`);
      } else if (notify) {
        alert('Güncellenecek veri bulunamadı.');
      }
    } catch (e) {
      if (notify) alert(`Güncelleme başarısız: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => { loadRemoteData(false); }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return products.filter(p => category === 'Hepsi' || p.category === category);
    }
    const qTokens = q.split(/\s+/);
    return products.filter(p => {
      if (category !== 'Hepsi' && p.category !== category) return false;
      const text = `${p.s || ''} ${p.name || ''}`.toLowerCase();
      const tokens = text.split(/\s+/);
      return qTokens.every(qt => tokens.some(t => t.startsWith(qt)));
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
    ? `Güncel veri: ${new Date(dataDate).toLocaleDateString('tr-TR')} ${new Date(dataDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
    : 'Gerçek fiyatlar (uyguno.com)';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>ZN Fiyatara</Text>
            <Text style={styles.headerSubtitle}>Günlük güncellenen market fiyatları</Text>
          </View>
          <TouchableOpacity
            style={[styles.updateBtn, updating && styles.updateBtnBusy]}
            onPress={() => loadRemoteData(true)}
            disabled={updating}
            activeOpacity={0.8}
          >
            {updating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.updateBtnText}>↻ Güncelle</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.headerMeta}>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>📦 {products.length} ürün</Text>
          </View>
          <View style={[styles.metaPill, updating && { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
            <Text style={styles.metaText}>{updating ? '⏳ Güncelleniyor...' : `🕒 ${dataLabel}`}</Text>
          </View>
        </View>
      </View>

      {tab === 'home' ? (
        <View style={{ flex: 1 }}>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchBar}
              placeholder={`${products.length} ürün arasında ara...`}
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.catWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catContent}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catBtn, category === c && styles.catBtnActive]}
                  onPress={() => setCategory(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={updating} onRefresh={() => loadRemoteData(false)} tintColor={COLORS.primary} colors={[COLORS.primary]} />
            }
          >
            <View style={styles.resultRow}>
              <Text style={styles.countText}>Toplam Listelenen Ürün: {filteredProducts.length}</Text>
            </View>

            {filteredProducts.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyText}>Aradığınız kriterde ürün bulunamadı.</Text>
                <Text style={styles.emptySub}>Farklı bir arama yapmayı deneyin.</Text>
              </View>
            )}

            {filteredProducts.slice(0, 50).map(p => {
              const cheapest = getCheapest(p.prices);
              return (
                <View key={p.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <ProductThumb product={p} />
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={2}>{p.name}</Text>
                      {p.brand ? <Text style={styles.cardBrand}>{p.brand}</Text> : null}
                      <Text style={styles.cardSub}>{p.category}</Text>
                      {cheapest ? (
                        <View style={styles.cheapestPill}>
                          <Text style={styles.cheapestLabel}>En Uygun: {fmt(cheapest.price)} TL ({cheapest.market})</Text>
                        </View>
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
                    <TouchableOpacity style={[styles.btn, styles.detailBtn]} onPress={() => setSelectedProduct(p)} activeOpacity={0.8}>
                      <Text style={[styles.btnText, styles.detailBtnText]}>Market Sayfaları</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.addBtn, !cheapest && styles.addBtnDisabled]}
                      disabled={!cheapest}
                      onPress={() => cheapest && addToCart(p, cheapest.market, cheapest.price)}
                      activeOpacity={0.8}
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
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <Text style={styles.sectionTitle}>Ortak Sepetiniz</Text>
          {cart.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🛒</Text>
              <Text style={styles.emptyText}>Sepetiniz boş.</Text>
              <Text style={styles.emptySub}>Ürün kartından "Sepete Ekle"ye dokunun.</Text>
            </View>
          ) : (
            cart.map(item => (
              <View key={item.cartId} style={styles.cartCard}>
                <ProductThumb product={item} size={52} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.cartSub}>{item.selectedMarket} • {fmt(item.selectedPrice)} TL</Text>
                </View>
                <TouchableOpacity
                  style={[styles.btn, styles.goMarketBtn]}
                  activeOpacity={0.8}
                  onPress={() => {
                    const url = item.links[item.selectedMarket];
                    if (url) Linking.openURL(url);
                  }}
                >
                  <Text style={styles.btnText}>Siteden Satın Al</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {selectedProduct && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ProductThumb product={selectedProduct} size={48} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalTitle} numberOfLines={2}>{selectedProduct.name}</Text>
                <Text style={styles.modalCategory}>{selectedProduct.category}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedProduct(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {ALL_MARKETS.map(m => {
              const url = selectedProduct.links[m];
              if (!url) return null;
              return (
                <TouchableOpacity key={m} style={styles.marketLinkBtn} activeOpacity={0.8} onPress={() => Linking.openURL(url)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.marketLinkName}>{m} Mağazasında Ara</Text>
                  </View>
                  <Text style={styles.marketLinkPrice}>{selectedProduct.prices[m] ? `${fmt(selectedProduct.prices[m])} TL` : ''}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={[styles.btn, styles.closeBtn]} onPress={() => setSelectedProduct(null)} activeOpacity={0.8}>
              <Text style={[styles.btnText, styles.closeBtnText]}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('home')} activeOpacity={0.7}>
          <View style={[styles.tabPill, tab === 'home' && styles.tabPillActive]}>
            <Text style={[styles.tabText, tab === 'home' && styles.tabTextActive]}>🏪 Ürünler</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('cart')} activeOpacity={0.7}>
          <View style={[styles.tabPill, tab === 'cart' && styles.tabPillActive]}>
            <Text style={[styles.tabText, tab === 'cart' && styles.tabTextActive]}>🛒 Sepet ({cart.length})</Text>
          </View>
        </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.primaryDark, padding: 16, paddingBottom: 14, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 21, fontWeight: '800', letterSpacing: 0.3 },
  headerSubtitle: { color: '#bfdbfe', fontSize: 12, marginTop: 2 },
  updateBtn: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, minWidth: 100, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  updateBtnBusy: { opacity: 0.7 },
  updateBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  headerMeta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  metaPill: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8, marginTop: 4 },
  metaText: { color: '#e0e7ff', fontSize: 11, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: 12, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  searchIcon: { fontSize: 15, paddingLeft: 12 },
  searchBar: { flex: 1, padding: 11, fontSize: 14, color: COLORS.text },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  clearBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },
  catWrapper: { marginTop: 10 },
  catContent: { paddingHorizontal: 12, paddingVertical: 2, alignItems: 'center' },
  catBtn: { backgroundColor: COLORS.card, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 6, borderWidth: 1, borderColor: COLORS.border },
  catBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { color: '#475569', fontSize: 12.5, fontWeight: '600' },
  catTextActive: { color: '#fff' },
  list: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 24 },
  resultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  countText: { fontSize: 12.5, color: COLORS.textSoft, fontWeight: '700', backgroundColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden' },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#475569', fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  card: { backgroundColor: COLORS.card, padding: 14, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5, elevation: 2 },
  cardRow: { flexDirection: 'row', marginBottom: 12 },
  productImage: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#f1f5f9' },
  iconCircle: { alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 30 },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: COLORS.text, lineHeight: 19 },
  cardBrand: { fontSize: 11.5, color: COLORS.textSoft, marginTop: 2, fontWeight: '500' },
  cardSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  cheapestPill: { marginTop: 6, alignSelf: 'flex-start' },
  cheapestLabel: { fontSize: 12, fontWeight: '700', color: '#15803d', backgroundColor: COLORS.successBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  priceWrap: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: 8, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  priceChip: { backgroundColor: COLORS.priceBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, margin: 2, flexDirection: 'row', alignItems: 'center' },
  priceChipMarket: { fontSize: 11, color: COLORS.primary, fontWeight: '700', marginRight: 6 },
  priceChipValue: { fontSize: 11, color: COLORS.text, fontWeight: '800' },
  btnGroup: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  detailBtn: { flex: 0.48, backgroundColor: '#eef2f7', borderWidth: 1, borderColor: '#e2e8f0' },
  detailBtnText: { color: '#334155' },
  addBtn: { flex: 0.48, backgroundColor: COLORS.primary },
  addBtnDisabled: { backgroundColor: '#cbd5e1' },
  btnText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  footer: { flexDirection: 'row', height: 62, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 8 },
  tabBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  tabPillActive: { backgroundColor: COLORS.primaryLight },
  tabText: { fontSize: 13, color: COLORS.textSoft, fontWeight: '700' },
  tabTextActive: { color: COLORS.primaryDark },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginVertical: 12, color: COLORS.text },
  cartCard: { backgroundColor: COLORS.card, padding: 12, borderRadius: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5, elevation: 2 },
  cartSub: { fontSize: 12, color: COLORS.textSoft, marginTop: 4, fontWeight: '600' },
  goMarketBtn: { backgroundColor: COLORS.success, paddingHorizontal: 12, paddingVertical: 10, marginLeft: 10 },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalContent: { backgroundColor: COLORS.card, width: '86%', padding: 16, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  modalCategory: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  modalClose: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: '#64748b', fontSize: 13, fontWeight: '800' },
  marketLinkBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.priceBg, padding: 13, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#dbeafe' },
  marketLinkName: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  marketLinkPrice: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  closeBtn: { backgroundColor: '#eef2f7', marginTop: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  closeBtnText: { color: '#334155' },
});
