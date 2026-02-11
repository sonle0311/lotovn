# 🏮 LotoVN - Trải nghiệm Loto Tết trực tuyến Premium

LotoVN mang đến không khí Tết truyền thống vào không gian số với giao diện hiện đại, mượt mà và các tính năng tương tác thời gian thực đỉnh cao.

## ✨ Tính năng nổi bật

- **Giao diện Retro-Futurism**: Thiết kế cao cấp, hiệu ứng neon pulse và họa tiết Việt Nam tinh tế.
- **Hệ thống "Kinh" thông minh**: Tự động nhận diện và báo hiệu khi người chơi đủ số để Kinh với hiệu ứng rực rỡ.
- **Thông báo "Chờ Kinh" hài hước**: Hệ thống thông báo sử dụng các câu nói dân gian vui nhộn, tăng kịch tính cho ván đấu.
- **Chế độ chơi đa nhiệm**: Mobile-first design cho phép vừa chơi vừa chat cùng lúc mà không bị gián đoạn.
- **Theo dõi thời gian thực**: Huy hiệu số đang xổ luôn hiển thị ở góc màn hình, giúp người chơi không bỏ lỡ bất kỳ con số nào.
- **Phòng chơi riêng tư**: Dễ dàng tạo và chia sẻ mã phòng để chơi cùng bạn bè.

## 🛠 Công nghệ sử dụng

- **Frontend**: Next.js 15, Tailwind CSS, Framer Motion
- **Backend/Realtime**: Supabase (Realtime Channel & Presence)
- **UI Components**: Lucide React, Sonner (Toasts), Canvas Confetti

## 🚀 Hướng dẫn cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd lotovn
```

### 2. Cấu hình môi trường
Tạo file `.env.local` dựa trên mẫu `.env.example`:
```bash
cp .env.example .env.local
```
Cập nhật các biến `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` từ trang quản trị Supabase của bạn.

### 3. Cài đặt thư viện
```bash
npm install
```

### 4. Chạy dự án
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để bắt đầu trải nghiệm!

## 📜 Giấy phép

Dự án này được phát triển nhằm mục đích giải trí và học tập. Chúc bạn có những phút giây vui vẻ bên bạn bè và người thân!
