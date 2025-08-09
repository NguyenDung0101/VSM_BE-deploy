# Cấu hình Supabase Storage cho Upload Ảnh

## Giới thiệu
Hệ thống hiện tại đã được nâng cấp để sử dụng Supabase Storage thay vì lưu trữ tệp ảnh trực tiếp trong sourcecode. Điều này giúp quản lý tệp tốt hơn và hỗ trợ nhiều loại ảnh cho các entity khác nhau như User Avatars, News, Events, HeroSection, SportsCommunityStory và GalleryImage.

## Bước cấu hình

### 1. Tạo tài khoản và project Supabase
- Đăng ký tài khoản tại [Supabase](https://supabase.com)
- Tạo một project mới
- Ghi lại URL và API Key của project

### 2. Tạo các bucket trong Supabase Storage
Tạo các bucket sau trong Supabase Storage:
- `avatars`: Cho ảnh đại diện người dùng
- `events`: Cho ảnh sự kiện
- `news`: Cho ảnh bài viết
- `hero`: Cho ảnh HeroSection
- `gallery`: Cho ảnh thư viện
- `story`: Cho ảnh SportsCommunityStory

Đối với mỗi bucket:
1. Đặt bucket là Public (cho phép đọc công khai)
2. Cấu hình các policy phù hợp (có thể cần chỉnh sửa tùy theo yêu cầu bảo mật)

### 3. Cấu hình biến môi trường
Thêm các biến môi trường sau vào file `.env`:

```
# Supabase Storage Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```

### 4. Kiểm tra hoạt động
Kiểm tra chức năng upload trong các phần sau:
- User Avatar: POST `/users/me/avatar`
- News Cover: POST `/news/:id/cover` 
- Hero Image: POST `/homepage-sections/:id/upload-hero-image`
- Story Image: POST `/homepage-sections/:id/upload-story-image`
- Gallery Image: POST `/gallery-images/upload`

## Lưu ý
- Cần tạo các bucket trước khi sử dụng API upload
- Đảm bảo SUPABASE_URL không có dấu "/" ở cuối
- API Key cần có quyền truy cập vào Storage (thường là anon key)
- Kích thước tối đa của file upload là 5MB 