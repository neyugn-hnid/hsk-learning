# HSK Learning Fullstack

Project học tiếng Trung HSK dùng React Router v7 full-stack, Prisma ORM và PostgreSQL.

## Chức năng có sẵn

- Giao diện học HSK responsive
- Đăng ký, đăng nhập, đăng xuất bằng cookie session
- Phân quyền USER / ADMIN
- Trang danh sách bài học lấy dữ liệu từ PostgreSQL
- Trang chi tiết bài học, từ vựng, ngữ pháp
- Dashboard tiến độ cơ bản
- Admin panel
- Import từ vựng bằng JSON
- Tự phân bài theo số từ/bài
- API thử nghiệm AI phân bài bằng Ollama hoặc fallback chia thường

## Cài đặt

```bash
npm install
cp .env.example .env
```

Sửa `DATABASE_URL` trong `.env` cho đúng PostgreSQL của bạn.

Tạo database nếu chưa có:

```bash
createdb hsk_learning
```

Hoặc dùng Docker:

```bash
docker run --name hsk-postgres -e POSTGRES_PASSWORD=123456 -e POSTGRES_DB=hsk_learning -p 5432:5432 -d postgres:16
```

Chạy migrate và seed:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

Chạy project:

```bash
npm run dev
```

Tài khoản admin mặc định:

```txt
Email: admin@example.com
Password: 123456
```

## Format JSON import

```json
[
  {
    "chinese": "你好",
    "pinyin": "nǐ hǎo",
    "meaningVi": "xin chào",
    "meaningEn": "hello",
    "level": "HSK1",
    "exampleChinese": "你好，我叫小明。",
    "exampleMeaning": "Xin chào, tôi tên là Tiểu Minh."
  }
]
```

Ngoài `chinese`, hệ thống cũng nhận `word`, `hanzi`, `character`.
Ngoài `meaningVi`, hệ thống cũng nhận `meaning`, `vi`, `translation`.

## Dùng AI tự phân bài

Mặc định `.env.example` cấu hình Ollama:

```env
AI_PROVIDER="ollama"
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"
```

Nếu không muốn dùng AI, đổi:

```env
AI_PROVIDER="none"
```

Khi đó API sẽ fallback về chia theo số từ/bài.
