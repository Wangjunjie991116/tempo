import { tempoPrimitives } from "./tokens";

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

export type TempoSemantic = ReturnType<typeof buildSemanticLight>;
