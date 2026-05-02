/** 设计 primitive token（当前仅亮色；暗色占位可在类型层扩展）。 */
export const tempoPrimitives = {
  color: {
    backgroundTertiary: "#f5f5f5",
    primaryText: "#151515",
    placeholderText: "#a5a5a5",
    /** Figma tertiary-text-color */
    tertiaryText: "#575757",
    brand500: "#6065e6",
    success500: "#17b26a",
    success50: "#ecfdf3",
    error500: "#f04438",
    error50: "#fef3f2",
    cardUpcomingTint: "#dfe0fa",
    cardDoneTint: "#e8f5e9",
    /** 日程卡片描边（浅中性灰，兜底）。 */
    scheduleCardBorder: "#e6e6ea",
    /** Figma：进行中卡片描边 border-secondary-brand */
    scheduleCardBorderBrand: "#caccf7",
    /** Figma：已完成卡片描边 border-positive */
    scheduleCardBorderPositive: "#abefc6",
    white: "#ffffff",
    divider: "#e8e8e8",
  },
  space: { xs: 4, sm: 8, md: 16, lg: 20, xl: 24 },
  radius: { sm: 8, md: 16, pill: 25, round: 100 },
  fontSize: { tiny: 12, small: 14, body: 16, title: 18, hero: 22 },
  lineHeight: { tiny: 16, small: 22, body: 24, title: 26 },
} as const;
