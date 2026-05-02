# Figma 索引（Tempo）

本目录沉淀设计稿 **节点 ID、版面大意与可追溯链接写法**，便于检索；完整产品与交互决策仍以 `docs/superpowers/specs/` 为准。

## 文档一览

| 文档 | 说明 |
|------|------|
| [schedule-rn.md](./schedule-rn.md) | 日程 Tab + 通知收件箱（RN，`2026-05-02` 冻结规格对应节点） |

## 如何打开节点

1. 在浏览器打开团队 Figma 文件，地址形如：  
   `https://www.figma.com/design/<FILE_KEY>/<文件名>?...`
2. 将 `<FILE_KEY>` 与下文各表中的 **`node-id`** 组合即可直达节点（Figma 使用 **连字符** 替代冒号）：

```text
https://www.figma.com/design/<FILE_KEY>?node-id=<NODE_ID>
```

示例：`8111:3433` → URL 参数写为 `node-id=8111-3433`。

若未知 `FILE_KEY`，在 Figma 中选中对应画板/帧 → **Share → Copy link**，链接里即包含 `fileKey` 与 `node-id`。

## MCP / 设计对齐

实施计划中抛光步骤提到使用 MCP **`get_design_context`** 等能力按节点拉标注；节点列表见各子文档「节点对照表」。
