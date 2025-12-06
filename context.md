# DB PTIT Client - Context & API Documentation

## 📋 Tổng quan

Đây là một công cụ Python client để giải và nộp bài tập SQL trên hệ thống `db.ptit.edu.vn` (Database PTIT). Công cụ tự động hóa quá trình đăng nhập, lấy bài tập, chạy thử SQL và nộp bài.

---

## 🔐 Thông tin xác thực

### Biến môi trường (.env)
```env
QLDT_USERNAME=<mã sinh viên>
QLDT_PASSWORD=<mật khẩu QLDT>
LOGIN_URL=https://qldt.ptit.edu.vn
BASE_API_URL=https://dbapi.ptit.edu.vn/api
DEFAULT_DB_TYPE=11111111-1111-1111-1111-111111111111
USER_ID=<uuid người dùng - tự động lấy từ token>
```

### Cơ chế xác thực
1. **Đăng nhập qua Selenium** (headless Chrome)
   - URL: `https://qldt.ptit.edu.vn`
   - Selector username: `#qldt-username`
   - Selector password: `#qldt-password`
   
2. **Lấy JWT Token** từ LocalStorage sau khi đăng nhập thành công
   - Các key tìm kiếm: `access_token`, `accessToken`, `token`, `auth_token`, `jwt`
   - Token có prefix `eyJ` (Base64 encoded JSON)

3. **Session headers cần thiết**:
```json
{
  "User-Agent": "Mozilla/5.0 ...",
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

---

## 🌐 API Endpoints

### Base URL
```
https://dbapi.ptit.edu.vn/api
```

### 1. Lấy danh sách bài tập (Search Questions)
```http
GET /app/question/search
```
**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Số trang (0-indexed) |
| size | int | Số lượng item mỗi trang |
| keyword | string | Từ khóa tìm kiếm (optional) |

**Response mẫu:**
```json
{
    "content": [
        {
            "id": "f7c4953d-554f-4ba8-a99b-d58671879c49",
            "createdAt": "2023-01-01T10:59:30",
            "questionCode": "SQL132",
            "title": "Làm quen với LearnSQL",
            "point": 10.0,
            "type": "SELECT",
            "enable": true,
            "totalSub": 9743,
            "acceptance": 54.22,
            "level": "EASY",
            "prefixCode": "hiqEBg",
            "isShare": true,
            "questionDetails": [
                {
                    "id": "39079865-cc9a-4143-8ae6-522d3d60bc29",
                    "typeDatabase": {
                        "id": "11111111-1111-1111-1111-111111111111",
                        "name": "Mysql"
                    }
                }
            ]
        }
    ],
    "pageable": {
        "pageNumber": 0,
        "pageSize": 10
    },
    "totalPages": 100,
    "totalElements": 1000
}
```

---

### 2. Lấy chi tiết bài tập
```http
GET /app/question/{questionId}
```

**Response mẫu:**
```json
{
    "id": "5f06da94-ad81-4241-80b3-4acad7cc6414",
    "questionCode": "SQL099",
    "title": "Find custom referee",
    "content": "<HTML content của đề bài>",
    "point": 5,
    "prefixCode": "SJslyz",
    "type": "SELECT",
    "enable": true,
    "level": "EASY",
    "questionDetails": [
        {
            "id": "cb1a524a-7e4d-4b22-baa0-fda54e2618bb",
            "typeDatabase": {
                "id": "22222222-2222-2222-2222-222222222222",
                "name": "Sql Server"
            }
        },
        {
            "id": "e34ac6a9-ad1d-4efe-a954-b1a043208fb0",
            "typeDatabase": {
                "id": "11111111-1111-1111-1111-111111111111",
                "name": "Mysql"
            }
        }
    ]
}
```

---

### 3. Chạy thử SQL (Dry Run)
```http
POST /executor/user
```

**Request Body:**
```json
{
    "questionId": "f7c4953d-554f-4ba8-a99b-d58671879c49",
    "sql": "SELECT * FROM LearnSQL;",
    "typeDatabaseId": "11111111-1111-1111-1111-111111111111"
}
```

**Response thành công:**
```json
{
    "success": true,
    "data": [
        {
            "name": "Belgium",
            "continent": "Europe",
            "area": 30528,
            "population": 11589623,
            "gdp": 515300000000
        }
    ],
    "status": 1,
    "typeQuery": "SELECT",
    "timeExec": 1.0
}
```

**Response lỗi (Access Denied):**
```json
{
    "status": 0,
    "result": "access deny for query: ...",
    "timeExec": 0.0
}
```

**Response lỗi SQL:**
```json
{
    "status": 0,
    "result": "StatementCallback; bad SQL grammar [...]",
    "timeExec": 0.0
}
```

---

### 4. Nộp bài (Submit)
```http
POST /executor/user/submit
```

**Request Body:** (giống Dry Run)
```json
{
    "questionId": "f7c4953d-554f-4ba8-a99b-d58671879c49",
    "sql": "SELECT * FROM LearnSQL;",
    "typeDatabaseId": "11111111-1111-1111-1111-111111111111"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Submission queued"
}
```

---

### 5. Kiểm tra lịch sử nộp bài
```http
GET /executor/user/history
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | UUID | ID người dùng |
| questionId | UUID | ID bài tập |
| page | int | Số trang |
| size | int | Số lượng |

**Response:**
```json
{
    "content": [
        {
            "id": "...",
            "status": "AC",
            "testPass": 5,
            "totalTest": 5,
            "createdAt": "2024-01-01T12:00:00"
        }
    ]
}
```

**Các trạng thái (status):**
| Status | Meaning |
|--------|---------|
| AC | Accepted - Đúng |
| WA | Wrong Answer - Sai |
| TLE | Time Limit Exceeded |
| RTE | Runtime Error |
| CE | Compile Error |
| PENDING | Đang chờ chấm |

---

## 📁 Database Type IDs

| ID | Name |
|----|------|
| `11111111-1111-1111-1111-111111111111` | MySQL |
| `22222222-2222-2222-2222-222222222222` | SQL Server |

---

## 🔄 Flow làm bài

### Flow 1: Sử dụng file local (hiện tại)

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLOW LÀM BÀI (LOCAL)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ĐĂNG NHẬP                                                   │
│     ├─ Selenium mở https://qldt.ptit.edu.vn                     │
│     ├─ Điền username/password                                   │
│     ├─ Lấy cookies + JWT token từ LocalStorage                  │
│     └─ Lưu vào session                                          │
│                                                                 │
│  2. LẤY USER ID                                                 │
│     ├─ Kiểm tra .env có USER_ID chưa                            │
│     ├─ Nếu chưa: decode JWT token lấy user ID                   │
│     └─ Lưu vào .env                                             │
│                                                                 │
│  3. TÌM BÀI TẬP (từ thư mục problems/)                          │
│     ├─ Nhập từ khóa tìm kiếm                                    │
│     ├─ Glob files *.html trong problems/                        │
│     ├─ Hiển thị danh sách kết quả                               │
│     └─ Chọn bài tập                                             │
│                                                                 │
│  4. LOAD BÀI TẬP                                                │
│     ├─ Đọc file HTML local                                      │
│     ├─ Parse ID từ URL API trong file                           │
│     ├─ Gọi GET /app/question/{id} lấy DB types                  │
│     ├─ Mở file HTML trong browser                               │
│     └─ Tạo file solution.sql với header                         │
│                                                                 │
│  5. VIẾT CODE                                                   │
│     └─ User mở solution.sql và viết SQL                         │
│                                                                 │
│  6. CHẠY THỬ (Dry Run)                                          │
│     ├─ Đọc solution.sql                                         │
│     ├─ Clean SQL (xóa comments)                                 │
│     ├─ POST /executor/user                                      │
│     └─ Hiển thị kết quả dạng bảng                               │
│                                                                 │
│  7. NỘP BÀI                                                     │
│     ├─ POST /executor/user/submit                               │
│     ├─ Polling GET /executor/user/history (15 lần, mỗi 2s)      │
│     └─ Hiển thị kết quả: AC/WA/TLE/RTE/CE                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Sử dụng API trực tiếp (khuyến nghị)

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLOW LÀM BÀI (API)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ĐĂNG NHẬP (giống Flow 1)                                    │
│                                                                 │
│  2. TÌM BÀI TẬP (từ API)                                        │
│     ├─ GET /app/question/search?page=0&size=20                  │
│     ├─ Có thể filter theo keyword, level, type                  │
│     └─ Chọn bài từ danh sách                                    │
│                                                                 │
│  3. LOAD CHI TIẾT BÀI TẬP                                       │
│     ├─ GET /app/question/{id}                                   │
│     ├─ Render content HTML                                      │
│     └─ Lấy DB types hỗ trợ                                      │
│                                                                 │
│  4-7. (Giống Flow 1)                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📄 Cấu trúc file bài tập (problems/*.html)

```
ID: SQL132
Tiêu đề: Làm quen với LearnSQL
URL WEB: https://db.ptit.edu.vn/question-detail/f7c4953d-554f-4ba8-a99b-d58671879c49
URL API: https://dbapi.ptit.edu.vn/api/app/question/f7c4953d-554f-4ba8-a99b-d58671879c49
Loại Database: Mysql
------------------------------

<HTML content đề bài>
```

**Regex để extract ID:**
```python
re.search(r'URL API: .*/([a-f0-9\-]+)', content)
```

---

## 📝 Cấu trúc file solution.sql

```sql
-- ID: f7c4953d-554f-4ba8-a99b-d58671879c49
-- Code: SQL132
-- Title: Làm quen với LearnSQL
-- Yêu cầu: Viết câu lệnh SQL bên dưới
-- ********************************************

SELECT * FROM learnsql;
```

**Lưu ý quan trọng:**
- Comments (dòng bắt đầu bằng `--`) sẽ bị **xóa** trước khi gửi lên API
- Một số từ khóa có thể bị **chặn** (access deny) nếu chứa SQL injection patterns

---

## 🔧 Clean SQL Logic

```python
def clean_sql_content(self, sql):
    """Xóa comment và khoảng trắng thừa từ SQL"""
    lines = sql.split('\n')
    cleaned_lines = []
    for line in lines:
        if line.strip().startswith('--'):
            continue
        cleaned_lines.append(line)
    return '\n'.join(cleaned_lines).strip()
```

---

## 🎯 Các loại bài tập (type)

| Type | Description |
|------|-------------|
| SELECT | Query lấy dữ liệu |
| INSERT | Thêm dữ liệu |
| UPDATE | Cập nhật dữ liệu |
| DELETE | Xóa dữ liệu |
| CREATE | Tạo bảng |
| ALTER | Sửa cấu trúc bảng |

---

## 📊 Độ khó (level)

| Level | Description |
|-------|-------------|
| EASY | Dễ |
| MEDIUM | Trung bình |
| HARD | Khó |

---

## 🚨 Error Handling

### 1. Access Denied
- **Nguyên nhân:** Token hết hạn hoặc SQL chứa keywords bị cấm
- **Giải pháp:** Đăng nhập lại hoặc kiểm tra SQL

### 2. Bad SQL Grammar
- **Nguyên nhân:** Lỗi cú pháp SQL
- **Giải pháp:** Kiểm tra lại câu query

### 3. 401 Unauthorized
- **Nguyên nhân:** Token không hợp lệ
- **Giải pháp:** Chạy lại script để đăng nhập mới

---

## 📌 Tips

1. **Luôn test trước khi submit** - Sử dụng tính năng Dry Run
2. **Không dùng comments trong SQL gửi đi** - Có thể gây access deny
3. **Kiểm tra DB type** - MySQL và SQL Server có syntax khác nhau
4. **Polling timeout** - Hệ thống polling 15 lần x 2s = 30s max

---

## 🔗 Links

- Web UI: https://db.ptit.edu.vn
- API Base: https://dbapi.ptit.edu.vn/api
- Login Portal: https://qldt.ptit.edu.vn

---

## 📦 Dependencies

```
requests          # HTTP client
beautifulsoup4    # HTML parsing
selenium          # Browser automation
python-dotenv     # Environment variables
```

---

*Tài liệu này được tạo để hỗ trợ sử dụng DB PTIT Client.*
