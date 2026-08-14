// Simple on-brand cartoon illustrations per category, used on business cards and
// the business detail header. Bundled locally — no network call needed to show
// them, unlike the earlier hotlinked stock photos.
const ILLUSTRATIONS: Record<string, ReturnType<typeof require>> = {
  Hair: require("../../assets/illustrations/hair.png"),
  Nails: require("../../assets/illustrations/nails.png"),
  Beauty: require("../../assets/illustrations/beauty.png"),
  Waxing: require("../../assets/illustrations/waxing.png"),
  Massage: require("../../assets/illustrations/massage.png"),
};

const FALLBACK = ILLUSTRATIONS.Hair;

export function getCategoryIllustration(category: string) {
  return ILLUSTRATIONS[category] ?? FALLBACK;
}
