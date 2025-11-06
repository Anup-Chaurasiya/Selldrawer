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
