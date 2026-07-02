# 寵物登記查詢 — PWA（可安裝的手機 App 外殼）

把農業部「寵物登記管理資訊網」查詢頁 (https://www.pet.gov.tw/Web/O201_Fido.aspx?s=999)
包裝成一個可加入手機主畫面、像 App 一樣使用的單頁 PWA。

> 查詢與所有資料皆由**官方系統**提供（需驗證碼／自然人憑證）。
> 本程式只是「美化過的捷徑外殼」，不儲存、不經手任何個資。

## 檔案
```
寵物查詢APP/
├─ index.html            啟動頁（官方查詢入口＋常用晶片卡片、狂犬針到期提醒）
├─ registry.html         我的名下寵物清冊（匯入官方 Excel/CSV，本機檢視、一鍵加入常用）
├─ stats.html            全國登記統計（各縣市、年度趨勢、絕育率）
├─ data/pet-stats.json   統計資料
├─ manifest.webmanifest  PWA 設定（名稱、圖示、顏色）
├─ sw.js                 service worker（可安裝＋離線開啟）
├─ icons/                App 圖示（192/512/maskable/apple-touch）
├─ favicon-32.png
└─ make_icons.py         重新產生圖示用
```

所有個人資料（常用晶片、清冊）只存在手機的 localStorage，不上傳、不進 repo。

## 本機預覽
PWA 必須用 http 開啟（service worker 不能在 file:// 下運作）：
```bash
cd 寵物查詢APP
python -m http.server 8731
# 瀏覽器開 http://localhost:8731
```

## 安裝成 App
- **Android / Chrome**：開啟網頁 → 上方會出現「安裝」提示，或選單 → 「安裝應用程式」。
- **iPhone / Safari**：分享鈕 → 「加入主畫面」。
- 安裝後從主畫面圖示開啟，會是全螢幕、無網址列，像原生 App。

## 要真正上線（手機隨時可用）
單一 HTML 需要放到一個 https 網址才能安裝。最簡單免費做法：
1. 把 `寵物查詢APP` 資料夾上傳到 GitHub。
2. 開啟 GitHub Pages（Settings → Pages → 指定該資料夾）。
3. 用產生的 `https://你的帳號.github.io/...` 網址在手機開啟並安裝。

其他選擇：Netlify Drop（拖曳資料夾即得 https 網址）、Cloudflare Pages、Vercel。
