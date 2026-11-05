# @p4/i18n

Factory i18next dùng chung, không đọc localStorage hoặc chứa bản dịch nghiệp vụ.

- `createI18n({ resources, lng, defaultNS })`: tạo instance, hỗ trợ `vi` / `en`, fallback tiếng Việt.
- `@p4/blocks/locales` cung cấp `blockResources` cho namespace `blocks` (vi/en).
- Web sở hữu namespace `common`, khởi tạo trong `apps/web/src/i18n/index.ts` và bọc `I18nextProvider` ở entry.
- UI kit `@itclabs/react-ui` có catalog riêng. `app.tsx` đồng bộ ngôn ngữ sang `UIProvider` qua locale `vi-VN` / `en-US`; không merge namespace UI vào i18next.
- Nội dung nghiệp vụ truyền qua component props vẫn dùng `useTranslation()` của ứng dụng.
- Với SSR, tạo instance riêng cho từng request.

Package xuất TypeScript trực tiếp; Vite của ứng dụng thực hiện build.
Nếu thêm bundler riêng, externalize React, i18next và react-i18next.
