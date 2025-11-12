// Types based on Prisma schema
export interface CartConfigurationTarget {
  id: string;
  configurationId: string;
  targetType: string;
  shopifyId: string;
  title: string | null;
}

export interface CartConfiguration {
  id: string;
  shop: string;
  name: string;
  description: string | null;
  isActive: boolean;
  conditionType: string;
  conditionOperator: string;
  conditionValue: number;
  actionType: string;
  actionValue: number | null;
  actionMessage: string;
  targetType: string;
  targets: CartConfigurationTarget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopifyCartItem {
  product_id?: string | number;
  price?: string;
  quantity?: string;
}

export interface CartAnalysis {
  total: number;
  itemCount: number;
  currency: string;
}

export interface ConfigurationResponse {
  id: string;
  name: string;
  conditionType: string;
  conditionOperator: string;
  conditionValue: number;
  actionType: string;
  actionValue: number | null;
  actionMessage: string;
  targetType: string;
  targets: CartConfigurationTarget[];
}

// FBT Types
export interface FBTProduct {
  id: string;
  ruleId: string;
  shopifyProductId: string;
  shopifyVariantId: string | null;
  title: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  handle: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FBTRule {
  id: string;
  fbtId: string;
  triggerType: string;
  triggerValue: string;
  triggerProductId: string | null;
  triggerTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
  products: FBTProduct[];
}

export interface FrequentlyBoughtTogether {
  id: string;
  shop: string;
  isActive: boolean;
  title: string;
  recommendationType: string;
  algorithm: string;
  useAI: boolean;
  useSmartVariantMatching: boolean;
  showOfferIfInCart: boolean;
  limitUpsellsInCart: boolean;
  maxUpsellsInCart: number;
  showProductReviews: boolean;
  layout: string;
  buttonText: string;
  buttonColor: string;
  buttonTextColor: string;
  showDiscount: boolean;
  showTotalPrice: boolean;
  showIndividualPrices: boolean;
  showCheckboxes: boolean;
  discountType: string;
  discountValue: number | null;
  createdAt: Date;
  updatedAt: Date;
  rules: FBTRule[];
}

export interface FBTConfig {
  title: string;
  layout: string;
  buttonText: string;
  buttonColor: string;
  buttonTextColor: string;
  showDiscount: boolean;
  showTotalPrice: boolean;
  showIndividualPrices: boolean;
  showCheckboxes: boolean;
  showProductReviews: boolean;
  discountType: string;
  discountValue: number | null;
  useAI: boolean;
  algorithm: string;
  showOfferIfInCart: boolean;
  limitUpsellsInCart: boolean;
  maxUpsellsInCart: number;
}

export interface FBTRecommendation {
  id: string;
  variantId: string | null;
  title: string;
  handle: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  position: number;
}

// Nudge Popup Types
export interface NudgeProduct {
  id: string;
  ruleId: string;
  shopifyProductId: string;
  shopifyVariantId: string | null;
  title: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  handle: string;
  description: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NudgeRule {
  id: string;
  nudgeId: string;
  triggerType: string;
  triggerValue: string;
  triggerProductId: string | null;
  triggerTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
  products: NudgeProduct[];
}

export interface NudgePopup {
  id: string;
  shop: string;
  isActive: boolean;
  title: string;
  subtitle: string;
  recommendationType: string;
  algorithm: string;
  useAI: boolean;
  showOnAddToCart: boolean;
  popupDelay: number;
  overlayColor: string;
  overlayOpacity: number;
  popupBackgroundColor: string;
  popupBorderRadius: number;
  titleColor: string;
  subtitleColor: string;
  continueButtonText: string;
  continueButtonColor: string;
  continueButtonTextColor: string;
  selectButtonText: string;
  selectButtonColor: string;
  selectButtonTextColor: string;
  closeButtonColor: string;
  showProductImage: boolean;
  showProductPrice: boolean;
  showProductComparePrice: boolean;
  showProductDescription: boolean;
  maxProducts: number;
  layout: string;
  enableAnimation: boolean;
  animationType: string;
  createdAt: Date;
  updatedAt: Date;
  rules: NudgeRule[];
}

export interface NudgeConfig {
  title: string;
  subtitle: string;
  layout: string;
  overlayColor: string;
  overlayOpacity: number;
  popupBackgroundColor: string;
  popupBorderRadius: number;
  titleColor: string;
  subtitleColor: string;
  continueButtonText: string;
  continueButtonColor: string;
  continueButtonTextColor: string;
  selectButtonText: string;
  selectButtonColor: string;
  selectButtonTextColor: string;
  closeButtonColor: string;
  showProductImage: boolean;
  showProductPrice: boolean;
  showProductComparePrice: boolean;
  showProductDescription: boolean;
  maxProducts: number;
  enableAnimation: boolean;
  animationType: string;
  recommendationType: string;
  useAI: boolean;
  algorithm: string;
  showOnAddToCart: boolean;
  popupDelay: number;
}

export interface NudgeRecommendation {
  id: string;
  variantId: string | null;
  title: string;
  handle: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  description: string | null;
  position: number;
}
