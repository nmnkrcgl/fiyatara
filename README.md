# Fiyatara

Market fiyat karşılaştırma uygulaması (Expo / React Native).

## Kurulum
```bash
npm install
```

## Geliştirme sırasında önizleme (Expo Go ile)
```bash
npx expo start
```
QR kodu telefonunuzdaki Expo Go uygulamasıyla okutun.

## Gerçek, kurulabilir bir APK üretmek (EAS Build - önerilen yol)
Bulut üzerinde derler, yerel Android Studio/SDK gerektirmez.

```bash
npm install -g eas-cli
eas login                     # ücretsiz Expo hesabınızla giriş yapın
eas build:configure           # ilk seferde proje ayarlarını oluşturur
eas build -p android --profile preview
```
Build bitince terminalde/expo.dev panelinde bir APK indirme linki verir.
Bu linki telefonunuza indirip kurabilir, ya da emülatöre sürükleyip
bırakabilirsiniz.

## Yerel/offline build (Android Studio ile)
```bash
npx expo prebuild -p android
cd android
./gradlew assembleRelease
```
APK: `android/app/build/outputs/apk/release/app-release.apk`
