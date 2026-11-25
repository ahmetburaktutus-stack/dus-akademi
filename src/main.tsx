import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import App from './App';
import './index.css';

// Uygulamanın kullandığı anahtarlar (App.tsx içindeki STORAGE_KEYS ile aynı)
const PERSISTED_KEYS = [
  'dus_gemini_api_key',
  'dus_gemini_model',
  'dus_question_bank_v2',
  'dus_theme_v1'
];

/**
 * Android WebView'daki localStorage, sistem depolama temizlediğinde silinebilir.
 * Bu köprü, aynı verileri Capacitor Preferences'a (Android'in kalıcı
 * SharedPreferences deposu) da yazar ve açılışta oradan geri yükler.
 * App.tsx'e dokunmadan çalışır.
 */
async function setupPersistentStorage() {
  if (!Capacitor.isNativePlatform()) return;

  // 1) Açılışta: localStorage'da olmayan ama kalıcı depoda olan verileri geri yükle
  for (const key of PERSISTED_KEYS) {
    try {
      const { value } = await Preferences.get({ key });
      if (value !== null && localStorage.getItem(key) === null) {
        localStorage.setItem(key, value);
      }
    } catch {
      /* yoksay */
    }
  }

  // 2) Bundan sonraki her yazma ve silmeyi kalıcı depoya da yansıt
  const originalSet = Storage.prototype.setItem;
  const originalRemove = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (key: string, value: string) {
    originalSet.call(this, key, value);
    if (this === window.localStorage && PERSISTED_KEYS.includes(key)) {
      Preferences.set({ key, value }).catch(() => {});
    }
  };

  Storage.prototype.removeItem = function (key: string) {
    originalRemove.call(this, key);
    if (this === window.localStorage && PERSISTED_KEYS.includes(key)) {
      Preferences.remove({ key }).catch(() => {});
    }
  };
}

setupPersistentStorage().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
