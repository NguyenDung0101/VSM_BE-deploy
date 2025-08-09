# BaseService - Service Abstraction Layer

Đây là tài liệu hướng dẫn sử dụng `BaseService` để tạo các service trong ứng dụng NestJS.

## Giới thiệu

`BaseService` là một lớp trừu tượng (abstract class) được thiết kế để cung cấp các thao tác CRUD cơ bản cho các service trong ứng dụng. Lớp này giúp:

- Giảm thiểu code lặp lại giữa các service
- Đảm bảo xử lý lỗi nhất quán
- Cung cấp cấu trúc phân trang tiêu chuẩn
- Tạo một mẫu hướng đối tượng đồng nhất

## Cách sử dụng

### 1. Kế thừa BaseService

Tạo một service mới kế thừa từ `BaseService`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/services/base.service';

@Injectable()
export class YourEntityService extends BaseService<YourEntityType> {
  constructor(protected prisma: PrismaService) {
    // Truyền vào PrismaService, tên thực thể (hiển thị trong thông báo lỗi), và tên model trong Prisma
    super(prisma, 'YourEntity', 'yourEntity');
  }
}
```

### 2. Sử dụng các phương thức có sẵn

Sau khi kế thừa, service của bạn sẽ có sẵn các phương thức:

- `findAll(params)` - Tìm kiếm với phân trang và lọc
- `findOne(id, include?)` - Tìm một bản ghi theo ID
- `create(data, include?)` - Tạo mới bản ghi
- `update(id, data, include?)` - Cập nhật bản ghi
- `remove(id)` - Xóa bản ghi

### 3. Ghi đè hoặc bổ sung phương thức

Nếu bạn cần thêm các phương thức đặc thù cho service:

```typescript
@Injectable()
export class YourEntityService extends BaseService<YourEntityType> {
  constructor(protected prisma: PrismaService) {
    super(prisma, 'YourEntity', 'yourEntity');
  }
  
  // Thêm phương thức mới
  async findByField(fieldValue: string) {
    return this.prisma[this.modelName].findMany({
      where: { field: fieldValue }
    });
  }
}
```

Nếu bạn cần ghi đè một phương thức, hãy đảm bảo giữ nguyên chữ ký phương thức hoặc đặt tên mới:

```typescript
// Đặt tên mới để tránh xung đột
async findCustomEntities(options: any) {
  // Xử lý logic tùy chỉnh
  return super.findAll({
    where: options.customWhere,
    // Các tùy chọn khác
  });
}
```

### 4. Xử lý phương thức đặc thù với nhiều tham số

Nếu cần một phương thức với nhiều tham số khác với phương thức của BaseService:

```typescript
// Đặt tên mới thay vì ghi đè phương thức create()
async createEntityWithRelations(data: CreateDto, userId: string, options?: any) {
  const enrichedData = {
    ...data,
    userId,
    // Xử lý dữ liệu
  };
  
  return super.create(enrichedData, options?.include);
}
```

## Ví dụ thực tế

Xem các file ví dụ:
- `src/modules/users/users.service.example.ts`
- `src/modules/events/events.service.example.ts`

## Lưu ý quan trọng

1. Khi ghi đè phương thức, cần đặc biệt chú ý đến chữ ký của phương thức
2. Sử dụng `super` để gọi các phương thức của lớp cha khi cần
3. Đặt tên mới cho phương thức nếu cần thay đổi chữ ký
4. Chú ý đến việc truyền tham số `modelName` đúng với tên model trong Prisma
5. Phải xử lý lỗi nhất quán giữa các service 