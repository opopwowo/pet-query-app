# 互動預覽（Interactive Preview）

`preview/index.html` 是把 `index.html` / `registry.html` / `stats.html` 三頁打包成的**單一自帶檔**互動預覽，方便隨時展示新版 UI。

- 線上：<https://opopwowo.github.io/pet-query-app/preview/>
- 內容：三頁以分頁切換（首頁／名下清冊／全國統計）、頁面右上角 🌗 可切深/淺色、含**示範資料（非真實個資）**。
- 自帶：圖示以 data URI 內嵌、統計資料內嵌、**移除 Service Worker**、頁面間連結改為分頁切換。

## 重新產生

當三頁有變動時，重新產生預覽：

```bash
node preview/build.mjs   # 產出 preview/index.html
```

> 這是**衍生檔**，請改原始三頁後用上面指令重生，不要手改 `preview/index.html`。
