# User 模块 RN 页面实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用 React Native 高度还原 Figma 设计稿中的 8 个用户相关页面/弹窗。

**Architecture:** 在 `app/modules/user` 下新增 4 个页面和 5 个公共组件，复用现有主题系统、i18n 和导航基础设施。所有表单状态使用本地 `useState`，不调用真实 API。

**Tech Stack:** React Native (Expo), TypeScript, React Navigation, react-native-paper, i18next, react-native-country-flag, @react-native-community/datetimepicker

---

## 文件结构

### 新建文件

| 文件 | 职责 |
|------|------|
| `app/modules/user/components/SaveButton.tsx` | 底部固定保存按钮（禁用/启用态） |
| `app/modules/user/components/AccountListItem.tsx` | 列表行组件（profile/nav/action 三种变体） |
| `app/modules/user/components/FormField.tsx` | 表单输入框（支持 TextInput / 点击弹窗 / 左侧附加区） |
| `app/modules/user/components/UserBottomSheet.tsx` | 底部弹窗容器 + 列表项（语言/外观共用） |
| `app/modules/user/components/LogoutDialog.tsx` | 登出确认中间弹窗 |
| `app/modules/user/screens/AccountScreen.tsx` | 用户板块列表页 |
| `app/modules/user/screens/EditProfileScreen.tsx` | 个人资料编辑页 |
| `app/modules/user/screens/ChangePasswordScreen.tsx` | 修改密码页 |
| `app/modules/user/screens/SettingsScreen.tsx` | 通用设置页（内含 Language/Appearance BottomSheet） |

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `app/package.json` | 安装 react-native-country-flag、@react-native-community/datetimepicker |
| `app/jest.config.js` | 支持 `.test.tsx` 匹配 |
| `app/core/navigation/routes.ts` | USER_STACK 新增 Account、EditProfile、ChangePassword、Settings |
| `app/core/navigation/types.ts` | UserStackParamList 新增对应类型 |
| `app/core/i18n/locales/en/common.json` | 新增用户模块英文翻译键 |
| `app/core/i18n/locales/zh/common.json` | 新增用户模块中文翻译键 |
| `app/modules/user/navigation/UserStackNavigator.tsx` | 注册所有新页面 |

---

## Task 1: 安装依赖并更新 Jest 配置

**Files:**
- Modify: `app/package.json`
- Modify: `app/jest.config.js`

- [ ] **Step 1: 安装依赖**

```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app
pnpm add react-native-country-flag @react-native-community/datetimepicker
```

- [ ] **Step 2: 更新 jest.config.js 支持 .test.tsx**

修改 `app/jest.config.js`：

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  testPathIgnorePatterns: ["/node_modules/"],
  clearMocks: true,
};
```

- [ ] **Step 3: Commit**

```bash
git add app/package.json app/jest.config.js
pnpm install --frozen-lockfile
git add pnpm-lock.yaml
git commit -m "chore: add react-native-country-flag and datetimepicker, update jest config"
```

---

## Task 2: 更新路由与导航类型

**Files:**
- Modify: `app/core/navigation/routes.ts`
- Modify: `app/core/navigation/types.ts`

- [ ] **Step 1: 修改 routes.ts 添加 USER_STACK 路由**

在 `app/core/navigation/routes.ts` 中修改 `USER_STACK`：

```ts
export const USER_STACK = {
  UserHome: "UserHome",
  UserWebTest: "UserWebTest",
  Account: "Account",
  EditProfile: "EditProfile",
  ChangePassword: "ChangePassword",
  Settings: "Settings",
} as const;
```

- [ ] **Step 2: 修改 types.ts 添加 ParamList 类型**

在 `app/core/navigation/types.ts` 中修改 `UserStackParamList`：

```ts
export type UserStackParamList = {
  [USER_STACK.UserHome]: undefined;
  [USER_STACK.UserWebTest]: undefined;
  [USER_STACK.Account]: undefined;
  [USER_STACK.EditProfile]: undefined;
  [USER_STACK.ChangePassword]: undefined;
  [USER_STACK.Settings]: undefined;
};
```

- [ ] **Step 3: Commit**

```bash
git add app/core/navigation/routes.ts app/core/navigation/types.ts
git commit -m "feat(user): add new user stack routes and types"
```

---

## Task 3: 添加 i18n 翻译键

**Files:**
- Modify: `app/core/i18n/locales/en/common.json`
- Modify: `app/core/i18n/locales/zh/common.json`

- [ ] **Step 1: 在 en/common.json 中新增键**

在现有 JSON 中追加（保持按字母顺序）：

```json
{
  "accountTitle": "Account",
  "appearance": "Appearance",
  "billing": "Billing",
  "changePassword": "Change Password",
  "changePasswordTitle": "Change Password",
  "close": "Close",
  "confirmPasswordLabel": "Confirm new your password",
  "dark": "Dark",
  "dobLabel": "Date Of Birth",
  "editProfileTitle": "Edit Profile",
  "emailLabel": "Email",
  "fullNameLabel": "Full Name",
  "language": "Language",
  "light": "Light",
  "logOut": "Log Out",
  "logOutDesc": "Your schedule data is saved locally. You can sign in again anytime.",
  "logOutTitle": "Log Out?",
  "newPasswordLabel": "New password",
  "notifications": "Notifications",
  "passwordReq8Chars": "At least 8 characters",
  "passwordReq1Number": "At least 1 number",
  "passwordReqCases": "Both upper and lower case letters",
  "personalInfo": "Personal Info",
  "phoneLabel": "Phone",
  "saveChanges": "Save Changes",
  "security": "Security",
  "settingsTitle": "Settings",
  "yourPasswordLabel": "Your password"
}
```

- [ ] **Step 2: 在 zh/common.json 中新增对应中文翻译**

```json
{
  "accountTitle": "账号",
  "appearance": "外观",
  "billing": "账单",
  "changePassword": "修改密码",
  "changePasswordTitle": "修改密码",
  "close": "关闭",
  "confirmPasswordLabel": "确认新密码",
  "dark": "深色",
  "dobLabel": "出生日期",
  "editProfileTitle": "编辑资料",
  "emailLabel": "邮箱",
  "fullNameLabel": "姓名",
  "language": "语言",
  "light": "浅色",
  "logOut": "退出登录",
  "logOutDesc": "您的日程数据已保存在本地，随时可以重新登录。",
  "logOutTitle": "退出登录？",
  "newPasswordLabel": "新密码",
  "notifications": "通知",
  "passwordReq8Chars": "至少 8 个字符",
  "passwordReq1Number": "至少 1 个数字",
  "passwordReqCases": "包含大小写字母",
  "personalInfo": "个人信息",
  "phoneLabel": "手机号",
  "saveChanges": "保存更改",
  "security": "安全",
  "settingsTitle": "设置",
  "yourPasswordLabel": "当前密码"
}
```

- [ ] **Step 3: Commit**

```bash
git add app/core/i18n/locales/en/common.json app/core/i18n/locales/zh/common.json
git commit -m "feat(i18n): add user module translation keys"
```

---

## Task 4: SaveButton 组件

**Files:**
- Create: `app/modules/user/components/SaveButton.tsx`
- Create: `app/modules/user/components/__tests__/SaveButton.test.tsx`

- [ ] **Step 1: 写测试**

创建 `app/modules/user/components/__tests__/SaveButton.test.tsx`：

```tsx
import { render, firePress } from "@testing-library/react-native";
import { SaveButton } from "../SaveButton";

describe("SaveButton", () => {
  it("renders title correctly", () => {
    const { getByText } = render(<SaveButton title="Save Changes" onPress={() => {}} />);
    expect(getByText("Save Changes")).toBeTruthy();
  });

  it("is disabled when disabled prop is true", () => {
    const onPress = jest.fn();
    const { getByText } = render(<SaveButton title="Save" disabled onPress={onPress} />);
    firePress(getByText("Save"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app
pnpm test -- __tests__/SaveButton.test.tsx
```

Expected: FAIL - "Cannot find module '../SaveButton'"

- [ ] **Step 3: 实现组件**

创建 `app/modules/user/components/SaveButton.tsx`：

```tsx
import { Pressable, Text, StyleSheet, type PressableProps } from "react-native";

type Props = Omit<PressableProps, "style"> & {
  title: string;
  disabled?: boolean;
};

export function SaveButton({ title, disabled, onPress, ...rest }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.disabled : styles.enabled,
        pressed && !disabled && { opacity: 0.9 },
      ]}
      onPress={onPress}
      disabled={disabled}
      {...rest}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  enabled: {
    backgroundColor: "#151515",
  },
  disabled: {
    backgroundColor: "#A5A5A5",
  },
  text: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
  disabledText: {
    color: "#FFFFFF",
  },
});
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test -- __tests__/SaveButton.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/modules/user/components/SaveButton.tsx app/modules/user/components/__tests__/SaveButton.test.tsx
git commit -m "feat(user): add SaveButton component"
```

---

## Task 5: AccountListItem 组件

**Files:**
- Create: `app/modules/user/components/AccountListItem.tsx`
- Create: `app/modules/user/components/__tests__/AccountListItem.test.tsx`

- [ ] **Step 1: 写测试**

创建 `app/modules/user/components/__tests__/AccountListItem.test.tsx`：

```tsx
import { render, fireEvent } from "@testing-library/react-native";
import { AccountListItem } from "../AccountListItem";

describe("AccountListItem", () => {
  it("renders nav variant with title", () => {
    const { getByText } = render(<AccountListItem variant="nav" title="Settings" />);
    expect(getByText("Settings")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(<AccountListItem variant="nav" title="Test" onPress={onPress} />);
    fireEvent.press(getByText("Test"));
    expect(onPress).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test -- __tests__/AccountListItem.test.tsx
```

Expected: FAIL

- [ ] **Step 3: 实现组件**

创建 `app/modules/user/components/AccountListItem.tsx`：

```tsx
import { Pressable, View, Text, Image, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ImageSourcePropType } from "react-native";

type Variant = "profile" | "nav" | "action";

type Props = {
  variant: Variant;
  title: string;
  subtitle?: string;
  value?: string;
  icon?: string;
  avatar?: ImageSourcePropType;
  textColor?: string;
  onPress?: () => void;
  showDivider?: boolean;
};

export function AccountListItem({
  variant,
  title,
  subtitle,
  value,
  icon,
  avatar,
  textColor,
  onPress,
  showDivider = true,
}: Props) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      {variant === "profile" && avatar && (
        <Image source={avatar} style={styles.avatar} />
      )}
      {variant !== "profile" && icon && (
        <MaterialCommunityIcons name={icon as any} size={22} color="#151515" style={styles.icon} />
      )}
      <View style={styles.content}>
        <Text style={[styles.title, textColor ? { color: textColor } : null]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {value && <Text style={styles.value}>{value}</Text>}
      {variant !== "action" && (
        <MaterialCommunityIcons name="chevron-right" size={20} color="#A5A5A5" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  icon: {
    width: 24,
    textAlign: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    lineHeight: 24,
    color: "#151515",
  },
  subtitle: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: "#575757",
  },
  value: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: "#575757",
    marginRight: 4,
  },
});
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test -- __tests__/AccountListItem.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/modules/user/components/AccountListItem.tsx app/modules/user/components/__tests__/AccountListItem.test.tsx
git commit -m "feat(user): add AccountListItem component"
```

---

## Task 6: FormField 组件

**Files:**
- Create: `app/modules/user/components/FormField.tsx`
- Create: `app/modules/user/components/__tests__/FormField.test.tsx`

- [ ] **Step 1: 写测试**

创建 `app/modules/user/components/__tests__/FormField.test.tsx`：

```tsx
import { render, fireEvent } from "@testing-library/react-native";
import { FormField } from "../FormField";

describe("FormField", () => {
  it("renders label and value", () => {
    const { getByText, getByDisplayValue } = render(
      <FormField label="Full Name" value="Wade" onChangeText={() => {}} />
    );
    expect(getByText("Full Name")).toBeTruthy();
    expect(getByDisplayValue("Wade")).toBeTruthy();
  });

  it("calls onChangeText when typing", () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <FormField label="Email" value="" onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByDisplayValue(""), "test@example.com");
    expect(onChangeText).toHaveBeenCalledWith("test@example.com");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test -- __tests__/FormField.test.tsx
```

Expected: FAIL

- [ ] **Step 3: 实现组件**

创建 `app/modules/user/components/FormField.tsx`：

```tsx
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";

type Props = {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
  rightIcon?: string;
  leftElement?: React.ReactNode;
  editable?: boolean;
};

export function FormField({
  label,
  value,
  onChangeText,
  onPress,
  placeholder,
  keyboardType = "default",
  secureTextEntry,
  rightIcon,
  leftElement,
  editable = true,
}: Props) {
  const [isVisible, setIsVisible] = useState(!secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const inputRowStyle = [
    styles.inputRow,
    isFocused && styles.inputRowFocused,
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onPress} disabled={!onPress} style={{ alignSelf: "stretch" }}>
        <View style={inputRowStyle} pointerEvents={onPress ? "none" : "auto"}>
          {leftElement}
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#A5A5A5"
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry && !isVisible}
            editable={editable && !onPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize="none"
          />
          {secureTextEntry && (
            <Pressable onPress={() => setIsVisible((v) => !v)} hitSlop={8}>
              <MaterialCommunityIcons
                name={isVisible ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#444444"
              />
            </Pressable>
          )}
          {rightIcon && (
            <MaterialCommunityIcons name={rightIcon as any} size={20} color="#444444" />
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: "#A5A5A5",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7D7D7",
    borderRadius: 12,
  },
  inputRowFocused: {
    borderColor: "#151515",
  },
  input: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    lineHeight: 24,
    color: "#151515",
    padding: 0,
  },
});
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test -- __tests__/FormField.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/modules/user/components/FormField.tsx app/modules/user/components/__tests__/FormField.test.tsx
git commit -m "feat(user): add FormField component"
```

---

## Task 7: UserBottomSheet 组件

**Files:**
- Create: `app/modules/user/components/UserBottomSheet.tsx`
- Create: `app/modules/user/components/__tests__/UserBottomSheet.test.tsx`

- [ ] **Step 1: 写测试**

创建 `app/modules/user/components/__tests__/UserBottomSheet.test.tsx`：

```tsx
import { render, fireEvent } from "@testing-library/react-native";
import { UserBottomSheet, BottomSheetItem } from "../UserBottomSheet";

describe("UserBottomSheet", () => {
  it("renders title and children when visible", () => {
    const { getByText } = render(
      <UserBottomSheet visible title="Language" onClose={() => {}}>
        <BottomSheetItem title="English" selected onPress={() => {}} />
      </UserBottomSheet>
    );
    expect(getByText("Language")).toBeTruthy();
    expect(getByText("English")).toBeTruthy();
  });

  it("calls onClose when X pressed", () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <UserBottomSheet visible title="Test" onClose={onClose}>
        <BottomSheetItem title="Item" onPress={() => {}} />
      </UserBottomSheet>
    );
    fireEvent.press(getByText("✕"));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test -- __tests__/UserBottomSheet.test.tsx
```

Expected: FAIL

- [ ] **Step 3: 实现组件**

创建 `app/modules/user/components/UserBottomSheet.tsx`：

```tsx
import { Modal, Pressable, View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type UserBottomSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function UserBottomSheet({ visible, title, onClose, children }: UserBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.content}>{children}</View>
        </View>
      </Pressable>
    </Modal>
  );
}

type BottomSheetItemProps = {
  icon?: React.ReactNode;
  title: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function BottomSheetItem({ icon, title, selected, onPress, disabled }: BottomSheetItemProps) {
  return (
    <Pressable
      style={[styles.item, disabled && styles.itemDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon}
      <Text style={[styles.itemTitle, disabled && styles.itemTitleDisabled]}>{title}</Text>
      {selected && (
        <View style={styles.checkCircle}>
          <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D7D7D7",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    lineHeight: 26,
    color: "#151515",
    flex: 1,
    textAlign: "center",
  },
  close: {
    fontSize: 18,
    color: "#151515",
    padding: 4,
  },
  content: {
    gap: 0,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  itemDisabled: {
    opacity: 0.4,
  },
  itemTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    lineHeight: 24,
    color: "#151515",
    flex: 1,
  },
  itemTitleDisabled: {
    color: "#A5A5A5",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6065E6",
    alignItems: "center",
    justifyContent: "center",
  },
});
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test -- __tests__/UserBottomSheet.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/modules/user/components/UserBottomSheet.tsx app/modules/user/components/__tests__/UserBottomSheet.test.tsx
git commit -m "feat(user): add UserBottomSheet component"
```

---

## Task 8: LogoutDialog 组件

**Files:**
- Create: `app/modules/user/components/LogoutDialog.tsx`
- Create: `app/modules/user/components/__tests__/LogoutDialog.test.tsx`

- [ ] **Step 1: 写测试**

创建 `app/modules/user/components/__tests__/LogoutDialog.test.tsx`：

```tsx
import { render, fireEvent } from "@testing-library/react-native";
import { LogoutDialog } from "../LogoutDialog";

describe("LogoutDialog", () => {
  it("renders when visible", () => {
    const { getByText } = render(
      <LogoutDialog visible onClose={() => {}} onConfirm={() => {}} />
    );
    expect(getByText("Log Out?")).toBeTruthy();
  });

  it("calls onClose when Close pressed", () => {
    const onClose = jest.fn();
    const { getByText } = render(<LogoutDialog visible onClose={onClose} onConfirm={() => {}} />);
    fireEvent.press(getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test -- __tests__/LogoutDialog.test.tsx
```

Expected: FAIL

- [ ] **Step 3: 实现组件**

创建 `app/modules/user/components/LogoutDialog.tsx`：

```tsx
import { Modal, Pressable, View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function LogoutDialog({ visible, onClose, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="logout-variant" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Log Out?</Text>
          <Text style={styles.description}>
            Your schedule data is saved locally. You can sign in again anytime.
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
          <Pressable style={styles.logoutButton} onPress={onConfirm}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "100%",
    gap: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#151515",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    lineHeight: 26,
    color: "#151515",
  },
  description: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: "#575757",
    textAlign: "center",
  },
  closeButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#151515",
    borderRadius: 25,
  },
  closeText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
  logoutButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#151515",
  },
  logoutText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
    color: "#151515",
  },
});
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test -- __tests__/LogoutDialog.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/modules/user/components/LogoutDialog.tsx app/modules/user/components/__tests__/LogoutDialog.test.tsx
git commit -m "feat(user): add LogoutDialog component"
```

---

## Task 9: AccountScreen 页面

**Files:**
- Create: `app/modules/user/screens/AccountScreen.tsx`

- [ ] **Step 1: 实现页面**

创建 `app/modules/user/screens/AccountScreen.tsx`：

```tsx
import { Pressable, View, Text, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "../../../core/i18n";
import { USER_STACK } from "../../../core/navigation/routes";
import type { UserStackParamList } from "../../../core/navigation/types";
import { useTempoTheme } from "../../../core/theme";
import { useSession } from "../../../core/session";
import { AccountListItem } from "../components/AccountListItem";
import { LogoutDialog } from "../components/LogoutDialog";
import { useState } from "react";

type Props = NativeStackScreenProps<UserStackParamList, typeof USER_STACK.Account>;

const DEFAULT_AVATAR = require("../../../../assets/images/default-avatar.png");

export default function AccountScreen({ navigation }: Props) {
  const t = useTempoTheme();
  const { t: tr } = useTranslation(["common"]);
  const { signOut } = useSession();
  const [logoutVisible, setLogoutVisible] = useState(false);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.screenBg }]} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#151515" />
        </Pressable>
        <Text style={styles.headerTitle}>{tr("common:accountTitle")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* Profile */}
        <Pressable
          style={styles.profileCard}
          onPress={() => navigation.navigate(USER_STACK.EditProfile)}
        >
          <Image source={DEFAULT_AVATAR} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>Wade Warren</Text>
            <Text style={styles.email}>WadeWarren@gmail.com</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#A5A5A5" />
        </Pressable>

        {/* Security */}
        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>{tr("common:security")}</Text>
          <AccountListItem
            variant="nav"
            icon="lock-outline"
            title={tr("common:changePassword")}
            onPress={() => navigation.navigate(USER_STACK.ChangePassword)}
          />
        </View>

        {/* Account */}
        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>{tr("common:accountTitle")}</Text>
          <AccountListItem
            variant="action"
            title={tr("common:logOut")}
            textColor="#E53935"
            onPress={() => setLogoutVisible(true)}
          />
        </View>
      </View>

      <LogoutDialog
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        onConfirm={() => {
          setLogoutVisible(false);
          signOut();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    lineHeight: 26,
    color: "#151515",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    lineHeight: 26,
    color: "#151515",
  },
  email: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: "#575757",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: "#A5A5A5",
    marginBottom: 4,
    textTransform: "uppercase",
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/modules/user/screens/AccountScreen.tsx
git commit -m "feat(user): add AccountScreen"
```

---

## Task 10: SettingsScreen 页面 + BottomSheets

**Files:**
- Create: `app/modules/user/screens/SettingsScreen.tsx`

- [ ] **Step 1: 实现页面**

创建 `app/modules/user/screens/SettingsScreen.tsx`：

```tsx
import { useState } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CountryFlag from "react-native-country-flag";
import { useTranslation } from "../../../core/i18n";
import { USER_STACK } from "../../../core/navigation/routes";
import type { UserStackParamList } from "../../../core/navigation/types";
import { useTempoTheme } from "../../../core/theme";
import { getAppLanguage, setAppLanguage } from "../../../core/i18n/appLanguage";
import { AccountListItem } from "../components/AccountListItem";
import { UserBottomSheet, BottomSheetItem } from "../components/UserBottomSheet";

type Props = NativeStackScreenProps<UserStackParamList, typeof USER_STACK.Settings>;

export default function SettingsScreen({ navigation }: Props) {
  const t = useTempoTheme();
  const { t: tr, i18n } = useTranslation(["common"]);
  const [langVisible, setLangVisible] = useState(false);
  const [appearanceVisible, setAppearanceVisible] = useState(false);
  const currentLang = getAppLanguage() || "en";

  async function handleLanguageChange(lang: string) {
    await setAppLanguage(lang);
    setLangVisible(false);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.screenBg }]} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#151515" />
        </Pressable>
        <Text style={styles.headerTitle}>{tr("common:settingsTitle")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <AccountListItem
            variant="nav"
            icon="bell-outline"
            title={tr("common:notifications")}
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <AccountListItem
            variant="nav"
            icon="earth"
            title={tr("common:language")}
            value={currentLang === "zh" ? "中文" : "English (US)"}
            onPress={() => setLangVisible(true)}
          />
          <View style={styles.divider} />
          <AccountListItem
            variant="nav"
            icon="moon-waning-crescent"
            title={tr("common:appearance")}
            value={tr("common:light")}
            onPress={() => setAppearanceVisible(true)}
          />
        </View>
      </View>

      {/* Language BottomSheet */}
      <UserBottomSheet
        visible={langVisible}
        title={tr("common:language")}
        onClose={() => setLangVisible(false)}
      >
        <BottomSheetItem
          icon={<CountryFlag isoCode="gb" size={22} />}
          title="English"
          selected={currentLang === "en"}
          onPress={() => handleLanguageChange("en")}
        />
        <BottomSheetItem
          icon={<CountryFlag isoCode="cn" size={22} />}
          title="中文"
          selected={currentLang === "zh"}
          onPress={() => handleLanguageChange("zh")}
        />
      </UserBottomSheet>

      {/* Appearance BottomSheet */}
      <UserBottomSheet
        visible={appearanceVisible}
        title={tr("common:appearance")}
        onClose={() => setAppearanceVisible(false)}
      >
        <BottomSheetItem
          icon={<MaterialCommunityIcons name="white-balance-sunny" size={22} color="#151515" />}
          title={tr("common:light")}
          selected={true}
          onPress={() => setAppearanceVisible(false)}
        />
        <BottomSheetItem
          icon={<MaterialCommunityIcons name="moon-waning-crescent" size={22} color="#151515" />}
          title={tr("common:dark")}
          selected={false}
          disabled={true}
          onPress={() => {}}
        />
      </UserBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    lineHeight: 26,
    color: "#151515",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginLeft: 16,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/modules/user/screens/SettingsScreen.tsx
git commit -m "feat(user): add SettingsScreen with Language and Appearance bottom sheets"
```

---

## Task 11: EditProfileScreen 页面

**Files:**
- Create: `app/modules/user/screens/EditProfileScreen.tsx`

- [ ] **Step 1: 实现页面**

创建 `app/modules/user/screens/EditProfileScreen.tsx`：

```tsx
import { useState, useCallback } from "react";
import { Pressable, View, Text, Image, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import CountryFlag from "react-native-country-flag";
import { useTranslation } from "../../../core/i18n";
import { USER_STACK } from "../../../core/navigation/routes";
import type { UserStackParamList } from "../../../core/navigation/types";
import { useTempoTheme } from "../../../core/theme";
import { useToast } from "../../../core/ui";
import { FormField } from "../components/FormField";
import { SaveButton } from "../components/SaveButton";
import { UserBottomSheet, BottomSheetItem } from "../components/UserBottomSheet";

type Props = NativeStackScreenProps<UserStackParamList, typeof USER_STACK.EditProfile>;

const DEFAULT_AVATAR = require("../../../../assets/images/default-avatar.png");

const COUNTRY_CODES = [
  { code: "us", dial: "+1", name: "United States" },
  { code: "cn", dial: "+86", name: "China" },
  { code: "gb", dial: "+44", name: "United Kingdom" },
];

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function parseDate(str: string): Date | null {
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function EditProfileScreen({ navigation }: Props) {
  const t = useTempoTheme();
  const { t: tr } = useTranslation(["common"]);
  const toast = useToast();

  const [name, setName] = useState("Wade Warren");
  const [email, setEmail] = useState("wade-warren@gmail.com");
  const [phone, setPhone] = useState("(239) 555-0108");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [dob, setDob] = useState("04/12/1992");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const isValid = name.trim().length > 0 && isValidEmail(email) && phone.trim().length > 0 && dob.trim().length > 0;

  const onDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDob(formatDate(selectedDate));
    }
  }, []);

  function handleSave() {
    toast.show({ message: "Profile saved successfully", type: "success" });
    navigation.goBack();
  }

  const countrySelector = (
    <Pressable style={styles.countrySelector} onPress={() => setShowCountryPicker(true)}>
      <CountryFlag isoCode={countryCode.code} size={18} />
      <Text style={styles.countryDial}>{countryCode.dial}</Text>
      <MaterialCommunityIcons name="chevron-down" size={16} color="#444444" />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.screenBg }]} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#151515" />
        </Pressable>
        <Text style={styles.headerTitle}>{tr("common:editProfileTitle")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image source={DEFAULT_AVATAR} style={styles.avatar} />
          <View style={styles.cameraBadge}>
            <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
          </View>
        </View>

        {/* Personal Info */}
        <Text style={styles.sectionLabel}>{tr("common:personalInfo")}</Text>
        <View style={styles.formCard}>
          <FormField label={tr("common:fullNameLabel")} value={name} onChangeText={setName} />
          <FormField
            label={tr("common:emailLabel")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <FormField
            label={tr("common:phoneLabel")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftElement={countrySelector}
          />
          <FormField
            label={tr("common:dobLabel")}
            value={dob}
            onPress={() => setShowDatePicker(true)}
            rightIcon="calendar-outline"
            editable={false}
          />
        </View>
      </ScrollView>

      <SaveButton
        title={tr("common:saveChanges")}
        disabled={!isValid}
        onPress={handleSave}
      />

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={parseDate(dob) || new Date(1990, 0, 1)}
          mode="date"
          display="spinner"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Country Code Picker */}
      <UserBottomSheet
        visible={showCountryPicker}
        title="Country Code"
        onClose={() => setShowCountryPicker(false)}
      >
        {COUNTRY_CODES.map((c) => (
          <BottomSheetItem
            key={c.code}
            icon={<CountryFlag isoCode={c.code} size={22} />}
            title={`${c.name} (${c.dial})`}
            selected={countryCode.code === c.code}
            onPress={() => {
              setCountryCode(c);
              setShowCountryPicker(false);
            }}
          />
        ))}
      </UserBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    lineHeight: 26,
    color: "#151515",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  avatarContainer: {
    alignSelf: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#A5A5A5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  sectionLabel: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: "#A5A5A5",
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: "#E8E8E8",
    marginRight: 4,
  },
  countryDial: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: "#151515",
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/modules/user/screens/EditProfileScreen.tsx
git commit -m "feat(user): add EditProfileScreen with date picker and country code selector"
```

---

## Task 12: ChangePasswordScreen 页面

**Files:**
- Create: `app/modules/user/screens/ChangePasswordScreen.tsx`

- [ ] **Step 1: 实现页面**

创建 `app/modules/user/screens/ChangePasswordScreen.tsx`：

```tsx
import { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "../../../core/i18n";
import { USER_STACK } from "../../../core/navigation/routes";
import type { UserStackParamList } from "../../../core/navigation/types";
import { useTempoTheme } from "../../../core/theme";
import { useToast } from "../../../core/ui";
import { FormField } from "../components/FormField";
import { SaveButton } from "../components/SaveButton";

type Props = NativeStackScreenProps<UserStackParamList, typeof USER_STACK.ChangePassword>;

function validatePassword(password: string) {
  return {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasMixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
  };
}

type CheckItemProps = {
  satisfied: boolean;
  label: string;
};

function CheckItem({ satisfied, label }: CheckItemProps) {
  return (
    <View style={styles.checkRow}>
      <View style={[styles.checkCircle, satisfied && styles.checkCircleActive]}>
        {satisfied && <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />}
      </View>
      <Text style={[styles.checkText, satisfied && styles.checkTextActive]}>{label}</Text>
    </View>
  );
}

export default function ChangePasswordScreen({ navigation }: Props) {
  const t = useTempoTheme();
  const { t: tr } = useTranslation(["common"]);
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const checks = useMemo(() => validatePassword(newPassword), [newPassword]);
  const allChecksPass = checks.minLength && checks.hasNumber && checks.hasMixedCase;
  const canSave = currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0 && allChecksPass;

  function handleSave() {
    if (newPassword !== confirmPassword) {
      toast.show({ message: "Passwords do not match", type: "error" });
      return;
    }
    toast.show({ message: "Password changed successfully", type: "success" });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.screenBg }]} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#151515" />
        </Pressable>
        <Text style={styles.headerTitle}>{tr("common:changePasswordTitle")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <FormField
            label={tr("common:yourPasswordLabel")}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Your password"
          />
          <FormField
            label={tr("common:newPasswordLabel")}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="New password"
          />
          <FormField
            label={tr("common:confirmPasswordLabel")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Confirm new your password"
          />

          <View style={styles.checksContainer}>
            <CheckItem
              satisfied={checks.minLength}
              label={tr("common:passwordReq8Chars")}
            />
            <CheckItem
              satisfied={checks.hasNumber}
              label={tr("common:passwordReq1Number")}
            />
            <CheckItem
              satisfied={checks.hasMixedCase}
              label={tr("common:passwordReqCases")}
            />
          </View>
        </View>
      </ScrollView>

      <SaveButton
        title={tr("common:saveChanges")}
        disabled={!canSave}
        onPress={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    lineHeight: 26,
    color: "#151515",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  checksContainer: {
    gap: 8,
    marginTop: 4,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleActive: {
    backgroundColor: "#17B26A",
  },
  checkText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: "#A5A5A5",
  },
  checkTextActive: {
    color: "#151515",
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/modules/user/screens/ChangePasswordScreen.tsx
git commit -m "feat(user): add ChangePasswordScreen with live validation"
```

---

## Task 13: 注册新页面到 UserStackNavigator

**Files:**
- Modify: `app/modules/user/navigation/UserStackNavigator.tsx`

- [ ] **Step 1: 修改 UserStackNavigator**

修改 `app/modules/user/navigation/UserStackNavigator.tsx`：

```tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "../../../core/i18n";
import { USER_STACK } from "../../../core/navigation/routes";
import type { UserStackParamList } from "../../../core/navigation/types";
import UserHomeScreen from "../UserHomeScreen";
import WebTestScreen from "../WebTestScreen";
import AccountScreen from "../screens/AccountScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import SettingsScreen from "../screens/SettingsScreen";

const UserNativeStack = createNativeStackNavigator<UserStackParamList>();

export function UserStackNavigator() {
  const { t } = useTranslation(["common"]);
  return (
    <UserNativeStack.Navigator>
      <UserNativeStack.Screen
        name={USER_STACK.Account}
        component={AccountScreen}
        options={{ headerShown: false }}
      />
      <UserNativeStack.Screen
        name={USER_STACK.EditProfile}
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <UserNativeStack.Screen
        name={USER_STACK.ChangePassword}
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
      <UserNativeStack.Screen
        name={USER_STACK.Settings}
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <UserNativeStack.Screen
        name={USER_STACK.UserHome}
        component={UserHomeScreen}
        options={{ headerShown: false }}
      />
      <UserNativeStack.Screen
        name={USER_STACK.UserWebTest}
        component={WebTestScreen}
        options={{ title: t("common:webTestTitle"), headerShown: true }}
      />
    </UserNativeStack.Navigator>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/modules/user/navigation/UserStackNavigator.tsx
git commit -m "feat(user): register new screens in UserStackNavigator"
```

---

## Task 14: 最终验证与清理

- [ ] **Step 1: TypeScript 类型检查**

```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app
npx tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 2: 运行测试**

```bash
pnpm test
```

Expected: 所有新测试通过

- [ ] **Step 3: 检查未使用导入和代码格式**

快速检查各文件是否有未使用的 import 或变量。如有，清理后提交。

- [ ] **Step 4: 最终 Commit（如有清理）**

```bash
git add -A
git commit -m "refactor(user): cleanup unused imports and fix types" || echo "No changes to commit"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec 需求 | 对应 Task |
|-----------|-----------|
| AccountScreen（用户列表页） | Task 9 |
| EditProfileScreen（个人资料编辑） | Task 11 |
| ChangePasswordScreen（修改密码） | Task 12 |
| SettingsScreen（通用设置） | Task 10 |
| Language BottomSheet | Task 10 |
| Appearance BottomSheet | Task 10 |
| Logout Dialog | Task 8 + Task 9 |
| SaveButton 禁用/启用态 | Task 4 |
| 日期选择器 | Task 11 |
| 区号选择器 | Task 11 |
| i18n 翻译键 | Task 3 |
| 路由注册 | Task 2 + Task 13 |

**无遗漏。**

### 2. Placeholder Scan

- 无 TBD / TODO / "implement later"
- 所有步骤包含完整代码
- 无 "Similar to Task N" 引用

### 3. Type Consistency

- `USER_STACK` 常量名在 routes.ts、types.ts、各 Screen 中一致
- `UserStackParamList` 类型名在各 Screen props 中一致
- 组件名（SaveButton、AccountListItem 等）在测试和实现中一致

**无类型不一致问题。**
