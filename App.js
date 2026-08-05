import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// 1. OTOMATİK 1000+ ÜRÜN ÜRETİCİ VE GÖRSEL HAVUZU
const CATEGORIES = ['Hepsi', 'Süt & Kahvaltı', 'Temel Gıda', 'Et & Şarküteri', 'Temizlik', 'Manav', 'Atıştırmalık', 'Kişisel Bakım'];

const IMAGE_POOL = {
  'Süt & Kahvaltı': 'https://picsum.photos/seed/sut-kahvalti/200/200',
  'Temel Gıda': 'https://picsum.photos/seed/temel-gida/200/200',
  'Et & Şarküteri': 'https://picsum.photos/seed/et-sarkuteri/200/200',
  'Temizlik': 'https://picsum.photos/seed/temizlik/200/200',
  'Manav': 'https://picsum.photos/seed/manav/200/200',
  'Atıştırmalık': 'https://picsum.photos/seed/atistirmalik/200/200',
  'Kişisel Bakım': 'https://picsum.photos/seed/kisisel-bakim/200/200'
};

const generateProducts = () => {
  const list = [];
  const baseProducts = [
    { name: 'Kaşar Peyniri 500g', cat: 'Süt & Kahvaltı' }, { name: 'Yoğurt 3kg', cat: 'Süt & Kahvaltı' },
    { name: 'Osmancık Pirinç 2kg', cat: 'Temel Gıda' }, { name: 'Pilavlık Bulgur 1kg', cat: 'Temel Gıda' },
    { name: 'Dana Sucuk 250g', cat: 'Et & Şarküteri' }, { name: 'Tavuk Göğsü 1kg', cat: 'Et & Şarküteri' },
    { name: 'Çamaşır Deterjanı 5kg', cat: 'Temizlik' }, { name: 'Sıvı Sabun 500ml', cat: 'Temizlik' },
    { name: 'Yerli Muz Kg', cat: 'Manav' }, { name: 'Domates Kg', cat: 'Manav' },
    { name: 'Patates Cipsi Aile Boyu', cat: 'Atıştırmalık' }, { name: 'Çikolatalı Gofret', cat: 'Atıştırmalık' },
    { name: 'Şampuan 400ml', cat: 'Kişisel Bakım' }, { name: 'Diş Macunu 75ml', cat: 'Kişisel Bakım' }
  ];

  // 1000+ ürün çeşitliliği oluşturmak için döngüyle varyasyonlar üretiyoruz
  for (let i = 1; i <= 1050; i++) {
    const base = baseProducts[i % baseProducts.length];
    const bimPrice = Math.floor(Math.random() * 150) + 15;
    list.push({
      id: String(i),
      name: `${base.name} (Model v-${i})`,
      category: base.cat,
      image: IMAGE_POOL[base.cat],
      prices: {
        bim: bimPrice,
        a101: Math.floor(bimPrice * (0.9 + Math.random() * 0.2)),
        sok: Math.floor(bimPrice * (0.95 + Math.random() * 0.1)),
        migros: Math.floor(bimPrice * (1.05 + Math.random() * 0.2))
      },
      urls: { bim: 'https://www.bim.com.tr', a101: 'https://www.a101.com.tr', sok: 'https://www.sokmarket.com.tr', migros: 'https://www.migros.com.tr' }
    });
  }
  return list;
};

const PRODUCTS = generateProducts();

function FiyataraApp() {
  const [tab, setTab] = useState('home');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Hepsi');
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === 'Hepsi' || p.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  const getCheapest = (prices) => {
    let minPrice = Infinity;
    let minMarket = '';
    Object.keys(prices).forEach(m => {
      if (prices[m] < minPrice) {
        minPrice = prices[m];
        minMarket = m.toUpperCase();
      }
    });
    return { price: minPrice, market: minMarket };
  };

  const addToCart = (product, market, price) => {
    setCart([...cart, { ...product, selectedMarket: market, selectedPrice: price, cartId: Date.now() }]);
    alert(`${product.name} sepete eklendi!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fiyatara Pro 🛒</Text>
        <Text style={styles.headerSubtitle}>1000+ Ürün ve Canlı Görsel Analizi</Text>
      </View>

      {tab === 'home' ? (
        <View style={{ flex: 1 }}>
          <TextInput style={styles.searchBar} placeholder="1050 ürün arasında ara..." value={query} onChangeText={setQuery} />
          
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
            {filteredProducts.slice(0, 50).map(p => { // Performans için ilk 50'yi anlık çizer
              const cheapest = getCheapest(p.prices);
              return (
                <View key={p.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <Image source={{ uri: p.image }} style={styles.productImage} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.cardTitle}>{p.name}</Text>
                      <Text style={styles.cardSub}>{p.category}</Text>
                      <Text style={styles.cheapestLabel}>En Uygun: {cheapest.price} TL ({cheapest.market})</Text>
                    </View>
                  </View>
                  
                  <View style={styles.priceRow}>
                    <Text style={styles.marketText}>BİM: {p.prices.bim} TL</Text>
                    <Text style={styles.marketText}>A101: {p.prices.a101} TL</Text>
                    <Text style={styles.marketText}>ŞOK: {p.prices.sok} TL</Text>
                    <Text style={styles.marketText}>MİGROS: {p.prices.migros} TL</Text>
                  </View>

                  <View style={styles.btnGroup}>
                    <TouchableOpacity style={styles.detailBtn} onPress={() => setSelectedProduct(p)}>
                      <Text style={styles.btnText}>Market Sayfasına Git</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(p, cheapest.market, cheapest.price)}>
                      <Text style={styles.btnText}>Sepete Ekle</Text>
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
          {cart.map(item => (
            <View key={item.cartId} style={styles.cartCard}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <TouchableOpacity style={styles.goMarketBtn} onPress={() => Linking.openURL(item.urls[item.selectedMarket.toLowerCase()])}>
                <Text style={styles.btnText}>Siteden Satın Al ({item.selectedPrice} TL)</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {selectedProduct && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>İlgili Market Sayfaları</Text>
            {Object.keys(selectedProduct.prices).map(m => (
              <TouchableOpacity key={m} style={styles.marketLinkBtn} onPress={() => Linking.openURL(selectedProduct.urls[m])}>
                <Text style={styles.btnText}>{m.toUpperCase()} Mağazasına Git ({selectedProduct.prices[m]} TL)</Text>
              </TouchableOpacity>
            ))}
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
  cardTitle: { fontSize: 14, fontWeight: 'bold' },
  cardSub: { fontSize: 11, color: '#6b7280' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9fafb', padding: 6, borderRadius: 4, marginBottom: 8 },
marketText: {
  fontSize: 10,
  color: '#4b5563'
},
  cheapestLabel: { fontSize: 12, fontWeight: 'bold', color: '#16a34a', marginTop: 4 },
  btnGroup: { flexDirection: 'row', justifyContent: 'space-between' },
  detailBtn: { backgroundColor: '#4b5563', padding: 8, borderRadius: 4, flex: 0.48, alignItems: 'center' },
  addBtn: { backgroundColor: '#1e3a8a', padding: 8, borderRadius: 4, flex: 0.48, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  footer: { flexDirection: 'row', height: 50, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  tabBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 13, color: '#1e3a8a', fontWeight: 'bold' },
  cartCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goMarketBtn: { backgroundColor: '#16a34a', padding: 8, borderRadius: 4 },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalContent: { backgroundColor: '#fff', width: '80%', padding: 15, borderRadius: 10 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  marketLinkBtn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 6, marginBottom: 6, alignItems: 'center' },
  closeBtn: { backgroundColor: '#9ca3af', padding: 10, borderRadius: 6, marginTop: 6, alignItems: 'center' }
});


