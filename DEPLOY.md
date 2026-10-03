# Deploy SecureAuth License Web → GitHub + Vercel

## 1. Push GitHub

```bash
cd secureauth-license-web
git init
git add .
git commit -m "SecureAuth license web"
# Tạo repo trống trên GitHub rồi:
git branch -M main
git remote add origin https://github.com/USERNAME/secureauth-license-web.git
git push -u origin main
```

## 2. Upstash Redis (bắt buộc trên Vercel)

Vercel **không lưu file** `data/` bền vững.

1. https://upstash.com → Sign up → Create Redis database
2. Tab **REST API** → copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## 3. Deploy Vercel

1. https://vercel.com → Import Git Repository → chọn repo
2. Framework: Other / Node
3. Root: project root
4. Environment Variables:

| Name | Value |
|------|--------|
| `ADMIN_USER` | tên đăng nhập admin của bạn |
| `ADMIN_PASS` | mật khẩu mạnh |
| `API_SIGNING_SECRET` | random dài |
| `PLUGIN_API_TOKEN` | random dài |
| `UPSTASH_REDIS_REST_URL` | từ Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | từ Upstash |

5. Deploy → URL dạng `https://xxx.vercel.app`

## 4. Kiểm tra

```bash
curl https://xxx.vercel.app/api/health
# Mở https://xxx.vercel.app/admin/  (Basic auth)
```

## 5. Plugin (sau này)

```
license.api-url: https://xxx.vercel.app
license.api-token: <PLUGIN_API_TOKEN>
license.signing-secret: <API_SIGNING_SECRET>
```

## CLI alternative

```bash
npm i -g vercel
vercel login
vercel
vercel env add ...
vercel --prod
```
