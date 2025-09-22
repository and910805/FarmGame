# FarmGame - 使用你的程式碼（Vite + React + Tailwind）

## 開發
```bash
npm install
npm run dev
```

## 打包/預覽
```bash
npm run build
npm run preview
```

## 部署
- **Vercel**：Build `npm run build`，Output `dist/`
- **Netlify**：Build `npm run build`，Publish `dist`
- **GitHub Pages**：將 `dist/` 發佈到 Pages


## Troubleshooting
- 空白畫面？請開瀏覽器 DevTools 看 console 是否有報錯。
- 安裝時若失敗，請升級 Node 到 18+。
- Tailwind 無效？確認 `src/index.css` 已被 `main.jsx` 匯入。
