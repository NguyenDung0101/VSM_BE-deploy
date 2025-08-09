# Chuyển đổi Hệ thống Upload Ảnh sang Supabase Storage

## Tổng quan

Chúng ta đã chuyển đổi hệ thống upload ảnh từ lưu trữ nội bộ (local storage) sang Supabase Storage. Sự thay đổi này giúp:

- Tách biệt storage với application code
- Quản lý tài nguyên và URL ảnh tốt hơn
- Mở rộng các loại entity có thể sử dụng ảnh
- Cung cấp API upload thống nhất cho nhiều loại nội dung

## Các thay đổi chính

### 1. UploadService

- Thay đổi `UploadService` để kết nối với Supabase Storage thay vì filesystem
- Hỗ trợ nhiều loại entity thông qua parameter `type` (avatars, events, news, hero, gallery, story)
- Xử lý việc upload/delete cho mỗi loại bucket

### 2. Các module đã cập nhật

#### UserService
- Tiếp tục sử dụng UploadService với type 'avatars'

#### NewsService
- Thêm chức năng `uploadCoverImage` để upload ảnh bìa bài viết
- Endpoint mới: `POST /news/:id/cover`

#### HomepageSectionsService
- Thêm chức năng `uploadHeroImage` cho HeroSection
- Thêm chức năng `uploadStoryImage` cho SportsCommunityStory
- Endpoint mới: 
  - `POST /homepage-sections/:id/upload-hero-image`
  - `POST /homepage-sections/:id/upload-story-image`

#### GalleryImagesService
- Thêm chức năng `uploadGalleryImage` và `updateGalleryImage`
- Endpoint mới:
  - `POST /gallery-images/upload`
  - `PATCH /gallery-images/:id/image`

#### EventsService
- Cập nhật để sử dụng Supabase trực tiếp thay vì Image model
- Đơn giản hóa logic create/update/delete với imageEvent field

## Cấu hình Supabase

### Buckets cần tạo
1. **avatars**: Lưu ảnh đại diện người dùng
2. **events**: Lưu ảnh sự kiện
3. **news**: Lưu ảnh bài viết 
4. **hero**: Lưu ảnh hero section
5. **gallery**: Lưu ảnh thư viện
6. **story**: Lưu ảnh story section

### RLS Policies
Mỗi bucket nên được cấu hình với các policies sau:
- **Select/Read**: Cho phép tất cả người dùng
- **Insert/Delete/Update**: Chỉ cho phép người dùng đã đăng nhập với token hợp lệ

## Biến môi trường

Thêm các biến sau vào file `.env`:

```
# Supabase Storage Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```

## Chuyển đổi dữ liệu hiện có

Nếu có dữ liệu ảnh hiện có trong hệ thống, cần chuyển đổi:

1. Upload các ảnh từ thư mục `public/image/` lên các bucket tương ứng trên Supabase
2. Cập nhật các URL trong database để trỏ đến Supabase

## Thay đổi Schema

Cơ sở dữ liệu đã được thiết kế để lưu trữ URL ảnh trực tiếp trong các model nên không cần thay đổi schema. Tuy nhiên, có thể xem xét loại bỏ model Image nếu không còn sử dụng. 