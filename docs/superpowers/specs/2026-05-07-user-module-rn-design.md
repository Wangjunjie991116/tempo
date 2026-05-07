# User 模块 RN 页面设计文档

## 概述

使用 React Native 高度还原 Figma 设计稿中的 8 个用户相关页面/弹窗，包括：用户列表页、个人资料编辑、修改密码、通用设置、语言设置弹窗、皮肤设置弹窗、登出确认弹窗。

## 设计决策摘要

| 决策 | 选择 | 原因 |
|------|------|------|
| 实现方案 | 模块级组件复用 | 平衡复用率和实现效率 |
| 头像更换 | 使用默认占位图，不开放更换 | 无后端接口支持 |
| VIP 订阅卡片 | 不实现 | 用户确认无需实现 |
| Appearance | 仅展示 Light 选项 | 暗色主题暂未实现 |
| 国旗图标 | `react-native-country-flag` 库 | 精确还原设计稿 |
| Forgot Password | 暂不实现 | 用户确认 |
| Billing/Notifications 等入口 | 暂不显示 | 无对应设计稿页面 |
| Save Changes 按钮 | 完整实现禁用/启用态 | 用户确认 |
| 手机号区号选择器 | 完整实现 | 用户确认 |
| Date Of Birth | 完整实现日期选择器 | 用户确认 |
| 语言列表 | 仅展示 en / zh | 仅支持两种语言 |
| 登出文案 | 替换为日程相关文案 | 原设计稿文案为电商场景 |
| 状态管理 | useState 本地状态 | 无需后端同步 |

## 导航结构

### 新增路由

```ts
// app/core/navigation/routes.ts
export const USER_STACK = {
  UserHome: "UserHome",
  UserWebTest: "UserWebTest",
  Account: "Account",                 // 新增
  EditProfile: "EditProfile",         // 新增
  ChangePassword: "ChangePassword",   // 新增
  Settings: "Settings",               // 新增
} as const;
```

### 页面跳转关系

```
Account（列表页）
  ├── 点击用户信息区 → EditProfile（个人资料编辑）
  ├── 点击 Change Password → ChangePassword（修改密码）
  ├── 点击 Settings → Settings（通用设置）
  │       ├── 点击 Language → LanguageBottomSheet
  │       └── 点击 Appearance → AppearanceBottomSheet
  └── 点击 Log Out → LogoutDialog
```

## 模块文件结构

```
app/modules/user/
├── navigation/
│   └── UserStackNavigator.tsx
├── screens/
│   ├── AccountScreen.tsx
│   ├── EditProfileScreen.tsx
│   ├── ChangePasswordScreen.tsx
│   ├── SettingsScreen.tsx
│   └── ...（保留现有页面）
└── components/
    ├── AccountListItem.tsx
    ├── UserBottomSheet.tsx
    ├── FormField.tsx
    ├── SaveButton.tsx
    └── LogoutDialog.tsx
```

## 公共组件设计

### AccountListItem

用于列表行，支持三种变体：

- `profile`：头像 + 主标题 + 副标题 + 右箭头
- `nav`：图标 + 标题 + 可选右侧值 + 右箭头
- `action`：标题（可指定颜色，如红色）

### UserBottomSheet

底部弹窗容器，Language / Appearance 共用：

- 顶部小横条指示器
- 标题 + 右上角 X 关闭按钮
- 子元素为 `BottomSheetItem`

### FormField

表单输入框组件：

- 上方灰色小字 label
- 输入区域（支持 `TextInput` 或点击触发弹窗）
- 可选右侧图标
- 支持左侧附加区域（如区号选择器）

### SaveButton

底部固定大按钮：

- 禁用态：灰色背景 (#A5A5A5)
- 启用态：黑色背景 (#151515)
- 圆角 pill（25px）
- 固定在安全区底部上方

### LogoutDialog

中间确认弹窗：

- 半透明黑色遮罩
- 白色圆角卡片
- 顶部图标区（黑色圆形 + 退出箭头图标）
- 标题 + 描述文案
- Close（黑色填充按钮）+ Logout（白色边框按钮）

## 页面详细规格

### AccountScreen

- **Header**：自定义，`<` 返回按钮 + "Account" 标题
- **用户信息区**：
  - 圆形默认头像占位图（80×80）
  - 姓名：18px，Manrope_600SemiBold，#151515
  - 邮箱：14px，Manrope_400Regular，#575757
  - 整行可点击，跳转 EditProfile
- **Security 分组**（白色卡片，圆角 16px）：
  - Change Password（锁图标 + 箭头）
- **Account 分组**（白色卡片，圆角 16px）：
  - Log Out（红色文字 #E53935，无箭头）
- **颜色**：页面背景 #F5F5F5，卡片白色，分隔线 #E8E8E8

### EditProfileScreen

- **Header**：`<` + "Edit Profile"
- **头像区**：
  - 圆形默认头像占位图（100×100），居中
  - 右下角小相机图标（灰色圆形底 + 相机图标）—— 纯视觉，点击无响应
- **"Personal Info" 标签**：14px，#A5A5A5，左对齐，margin 20px
- **白色卡片表单**（圆角 16px，padding 20px）：
  - Full Name 输入框
  - Email 输入框（email 键盘类型）
  - Phone 输入框（左侧：美国国旗 + "+1" + 下拉箭头，点击弹出底部区号选择器）
  - Date Of Birth 输入框（右侧日历图标，点击弹出日期选择器）
- **Save Changes 按钮**：固定在底部，根据表单有效性切换禁用/启用态
- **校验规则**：Full Name 非空、Email 格式正确、Phone 非空、DOB 非空

### ChangePasswordScreen

- **Header**：`<` + "Change Password"
- **白色卡片**（圆角 16px，padding 20px）：
  - Your password（密码输入，带可见性切换图标）
  - New password（密码输入，带可见性切换图标）
  - Confirm new your password（密码输入，带可见性切换图标）
  - 密码规则列表（3 项，带动态勾选状态）：
    - At least 8 characters
    - At least 1 number
    - Both upper and lower case letters
    - 未满足：灰色圆圈；满足：绿色圆圈 + 白色勾
- **Save Changes 按钮**：3 个输入框均非空且规则全部满足时启用

### SettingsScreen

- **Header**：`<` + "Settings"
- **白色卡片列表**（圆角 16px）：
  - Notifications（铃铛图标 + 箭头）
  - Language（地球图标 + 当前值 "English (US)" + 箭头）→ 弹出 LanguageBottomSheet
  - Appearance（月亮图标 + 当前值 "Light" + 箭头）→ 弹出 AppearanceBottomSheet

### LanguageBottomSheet

- 底部弹出，白色背景，顶部小横条
- 标题 "Language" + 右上角 X
- 列表项（2 项）：
  - 英国国旗 + "English" — 当前选中时右侧蓝色圆底白勾
  - 中国国旗 + "中文" — 同上
- 选择后调用 `setAppLanguage()` 切换全局语言

### AppearanceBottomSheet

- 同 LanguageBottomSheet 结构
- 标题 "Appearance"
- 列表项：
  - 太阳图标 + "Light" — 默认选中（蓝色勾）
  - 月亮图标 + "Dark" — 灰色不可选，无交互

### LogoutDialog

- 中间弹出 Modal，黑色半透明遮罩
- 白色圆角卡片（圆角 20px）
- 顶部：黑色圆形背景（60×60）+ 白色退出箭头图标
- 标题："Log Out?"（18px，600 字重，居中）
- 描述："Your schedule data is saved locally. You can sign in again anytime."（14px，#575757，居中）
- 按钮区（垂直排列，gap 12px）：
  - Close：黑色填充，白色文字，圆角 pill
  - Logout：白色填充，黑色文字，1px 黑色边框，圆角 pill
- 点击 Logout 调用 `signOut()`，点击 Close 关闭弹窗

## 状态管理

- 所有页面使用 `useState` 管理本地表单状态
- 语言切换复用 `app/core/i18n/appLanguage.ts` 的 `setAppLanguage()`
- 登出复用 `SessionContext` 的 `signOut()`
- 个人资料编辑和修改密码暂时只做前端校验 + Toast 提示保存成功，不调用真实 API

## i18n 新增翻译键

### en/common.json

```json
{
  "accountTitle": "Account",
  "editProfileTitle": "Edit Profile",
  "changePasswordTitle": "Change Password",
  "settingsTitle": "Settings",
  "fullNameLabel": "Full Name",
  "emailLabel": "Email",
  "phoneLabel": "Phone",
  "dobLabel": "Date Of Birth",
  "yourPasswordLabel": "Your password",
  "newPasswordLabel": "New password",
  "confirmPasswordLabel": "Confirm new your password",
  "passwordReq8Chars": "At least 8 characters",
  "passwordReq1Number": "At least 1 number",
  "passwordReqCases": "Both upper and lower case letters",
  "saveChanges": "Save Changes",
  "personalInfo": "Personal Info",
  "notifications": "Notifications",
  "language": "Language",
  "appearance": "Appearance",
  "light": "Light",
  "dark": "Dark",
  "security": "Security",
  "changePassword": "Change Password",
  "logOut": "Log Out",
  "logOutTitle": "Log Out?",
  "logOutDesc": "Your schedule data is saved locally. You can sign in again anytime.",
  "close": "Close",
  "billing": "Billing"
}
```

### zh/common.json

对应中文翻译（略，实现时同步添加）。

## 依赖

- `react-native-country-flag`：国旗图标（LanguageBottomSheet）
- `@react-native-community/datetimepicker`：日期选择器（EditProfileScreen DOB）
- `react-native-paper`：已存在，提供图标（MaterialCommunityIcons）

## 视觉 Token 使用

- 页面背景：`t.screenBg` → #F5F5F5
- 主文字：`t.textPrimary` → #151515
- 次要文字：`t.textMeta` → #575757
- 占位文字：`t.textMuted` → #A5A5A5
- 品牌色：`t.brand` → #6065E6
- 成功色：`tempoPrimitives.color.success500` → #17B26A
- 错误色：`tempoPrimitives.color.error500` → #F04438
- 分隔线：`t.divider` → #E8E8E8
- 圆角卡片：`tempoPrimitives.radius.md` → 16
- 圆角按钮：`tempoPrimitives.radius.pill` → 25
- 字体：Manrope_400Regular / Manrope_600SemiBold
