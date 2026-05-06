---
name: AI语音录音交互重构
description: 重构AI模块语音录音交互，移除手势检测，新增气泡式实时转文字UI
type: project
---

# AI语音录音交互重构设计

## 背景

当前AI语音录音采用手势滑动交互（左上滑取消、右上滑转文字），用户体验复杂。重构为更直观的气泡式交互，参考微信语音输入模式。

## 目标

- 简化交互：移除手势滑动，采用气泡+按钮模式
- 实时反馈：录音时实时显示语音转文字内容
- 灵活编辑：松手后允许编辑再发送

## 交互流程

### 状态机

```
idle ──按下录音──▶ recording ──松手──▶ preview
  ▲                                        │
  │                                        ├── 取消 ──▶ idle
  │                                        │
  │                                        └── 发送 ──▶ idle
  │                                              │
  │                                              ▼
  └────────────────── 编辑后取消/发送 ────────────┘
```

### UI状态

**1. 录音中**
```
┌─────────────────────────┐
│  语音转文字...          │  ← 气泡（动态高度）
│  实时更新               │
└───────────┬─────────────┘
            │
       [🎤]  ← 录音icon（按下态）
```

**2. 松手后**
```
┌─────────────────────────┐
│  识别完成的文字         │  ← 气泡
├─────────┬───────────────┤
│  [取消] │      [发送]    │  ← 底部按钮
└─────────┴───────────────┘
       [🎤]
```

**3. 编辑态**
```
┌─────────────────────────┐
│  可编辑文字|            │  ← TextInput
│                         │
├─────────┬───────────────┤
│  [取消] │      [发送]    │  ← 按钮保持
└─────────┴───────────────┘
```

## 详细规格

### 气泡组件

| 属性 | 值 |
|------|-----|
| 位置 | 录音icon正上方 |
| 宽度 | 屏幕宽度 - 32px (左右各16px边距) |
| 最小高度 | 2行 (~44px) |
| 最大高度 | 4行 (~88px) |
| 背景 | theme.surfaceElevated |
| 圆角 | 12px |
| 阴影 | elevation: 4 |
| 内边距 | 12px |
| 内容溢出 | ScrollView，垂直滚动 |

### 按钮区

| 属性 | 值 |
|------|-----|
| 布局 | 水平排列，space-between |
| 取消按钮 | 左侧，图标 × + 文字"取消" |
| 发送按钮 | 右侧，图标 ✓ + 文字"发送" |
| 高度 | 44px |
| 背景 | 取消: 透明边框，发送: theme.brand |

### 动画

- 气泡出现：`withSpring(0, { damping: 25, stiffness: 200 })`
- 气泡消失：`withSpring(-height, { damping: 25, stiffness: 200 })`

## 代码变更

### 移除

- `AiFloatingAssistant.tsx` 中的手势检测代码：
  - `activeZone` state
  - `zoneOpacityCancel`, `zoneOpacityText` 等 shared values
  - `getGestureZone` 函数
  - `panGesture` useMemo
  - `Gesture.Pan()` 相关逻辑
  - 手势区域渲染 UI

- 可能移除 `react-native-gesture-handler` 依赖（检查其他使用）

### 新增

- `VoiceBubble` 组件：气泡+按钮的组合组件
  - Props: `visible`, `text`, `onSend`, `onCancel`, `theme`
  - 内部状态：`isEditing`, `editableText`
  - 实时模式：只读显示转文字
  - 编辑模式：TextInput 可聚焦编辑

### 修改

- `AiFloatingAssistant.tsx`：
  - 引入 `VoiceBubble`
  - 录音状态管理：新增 `preview` 状态
  - 松手后保持气泡显示，等待用户操作

## 文件清单

| 文件 | 操作 |
|------|------|
| `app/modules/ai/components/VoiceBubble.tsx` | 新增 |
| `app/modules/ai/components/AiFloatingAssistant.tsx` | 修改 |
| `app/modules/ai/components/VoiceEditPanel.tsx` | 可能删除 |
| `app/package.json` | 检查并移除无用依赖 |

## 参考

- 微信语音输入交互
- 截图：`微信图片_20260506161012_274_743.png` (录音态)
- 截图：`微信图片_20260506162503_275_743.jpg` (编辑态)
