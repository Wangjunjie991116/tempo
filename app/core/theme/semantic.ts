import { tempoPrimitives } from "./tokens";

/**
 * 将原始 token（`tempoPrimitives`）组装为 UI 使用的语义色与间距别名（亮色主题单一路径）。
 *
 * @returns `TempoSemantic` — 供 `ThemeProvider` / Paper 主题桥接消费
 *
 * @example
 * ```ts
 * const semantic = buildSemanticLight();
 * semantic.brand; // 品牌主色
 * semantic.space.lg; // 间距 token
 * ```
 */
export function buildSemanticLight() {
  const p = tempoPrimitives;
  return {
    screenBg: p.color.backgroundTertiary,
    textPrimary: p.color.primaryText,
    textMuted: p.color.placeholderText,
    brand: p.color.brand500,
    divider: p.color.divider,
    scheduleCardUpcoming: p.color.cardUpcomingTint,
    scheduleCardDone: p.color.cardDoneTint,
    badge: {
      designReview: { bg: p.color.cardUpcomingTint, fg: p.color.brand500 },
      workshop: { bg: p.color.success50, fg: p.color.success500 },
      brainstorm: { bg: p.color.error50, fg: p.color.error500 },
    },
    space: p.space,
    radius: p.radius,
    fontSize: p.fontSize,
    lineHeight: p.lineHeight,
  };
}

/** {@link buildSemanticLight} 的返回类型，用于 Paper / 组件 props。 */
export type TempoSemantic = ReturnType<typeof buildSemanticLight>;
