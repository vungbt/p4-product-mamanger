# @p4/i18n

Cấu hình i18next dùng chung cho web và Storybook. Package không đọc localStorage,
không chứa bản dịch nghiệp vụ và không khởi tạo instance khi import.

- `createI18n({ resources, lng, defaultNS })`: tạo instance với resources có sẵn,
  fallback tiếng Việt và hỗ trợ `vi` / `en`.
- Mỗi app khởi tạo một lần ở entry, bọc cây React bằng `I18nextProvider`.
  Với SSR, tạo instance riêng cho từng request.
- `libs/ui/locales` sở hữu namespace `ui`, export qua `@p4/ui/locales`.
- Web sở hữu namespace `common` và ghép với `uiResources` khi khởi tạo.
- UI gọi `useTranslation('ui')`; nội dung truyền qua props được ưu tiên.
- Storybook dùng cùng factory và resources UI, đổi ngôn ngữ qua toolbar Language.

Package xuất TypeScript trực tiếp, giống các workspace library hiện tại;
Vite của ứng dụng thực hiện build. Nếu thêm bundler riêng cho thư viện,
externalize React, i18next và react-i18next để tránh bản sao runtime.

Thử nghiệm: mở story Components/Empty → Default và đổi Language giữa vi/en.
Story WithDescription giữ nguyên title được truyền qua props.
