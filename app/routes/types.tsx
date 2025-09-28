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
