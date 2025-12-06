export interface BillingPlan {
  id: string;
  name: string;
  tagline: string;
  features: string[];
  freeTrialDays: number;
  monthlyPrice: number;
  annualPrice: number;
  orderCap: string;
  isPopular?: boolean;
  planType: 'trial' | 'upsell' | 'cart' | 'enterprise';
}

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "trial",
    name: "Trial Pack",
    tagline: "Start for free, grow with confidence.",
    features: [
      "50 orders",
      "Upsells (2 FBT & Milestone)",
      "Reports and analytics",
      "24x7 Email support"
    ],
    freeTrialDays: 14,
    monthlyPrice: 0,
    annualPrice: 0,
    orderCap: "50 orders",
    planType: 'trial'
  },
  {
    id: "upsell_growth",
    name: "Upsell Plan Growth",
    tagline: "AI powered upsell & cross features.",
    features: [
      "AI Powered Features",
      "Customizable design",
      "One Click Upsell/Cross-sell Nudge",
      "One Click Frequently Bought Together",
      "Promotional Promo Widget",
      "Milestones Tracking",
      "Custom Gifting & Offers",
      "AB Tests & Limited Rollout",
      "Custom Audiences",
      "Reports and analytics",
      "Priority Phone 24x7 Support",
      "Max Orders 2000/Month"
    ],
    freeTrialDays: 14,
    monthlyPrice: 49,
    annualPrice: 539,
    orderCap: "<2000 orders per month",
    isPopular: true,
    planType: 'upsell'
  },
  {
    id: "upsell_pro",
    name: "Upsell Plan Pro",
    tagline: "AI powered upsell & cross features.",
    features: [
      "AI Powered Features",
      "Customizable design",
      "One Click Upsell/Cross-sell Nudge",
      "One Click Frequently Bought Together",
      "Promotional Promo Widget",
      "Milestones Tracking",
      "Custom Gifting & Offers",
      "AB Tests & Limited Rollout",
      "Custom Audiences",
      "Reports and analytics",
      "Priority Phone 24x7 Support"
    ],
    freeTrialDays: 14,
    monthlyPrice: 89,
    annualPrice: 981,
    orderCap: "2000+ orders per month",
    planType: 'upsell'
  },
  {
    id: "cart_growth",
    name: "Cart Plan Growth",
    tagline: "AI powered highly converting & customizable cart.",
    features: [
      "AI Powered Cart Drawer",
      "Customizable design",
      "Savings Display Widget",
      "Promotional Promo Widget",
      "Motivator bar for free shipping and discounts",
      "Upsells and add-ons",
      "Auto Apply Discount Coupon Codes Functionality",
      "Customisable Notes",
      "AB Tests & Limited Rollout",
      "Custom Audiences",
      "Reports and analytics",
      "Priority Phone 24x7 Support"
    ],
    freeTrialDays: 14,
    monthlyPrice: 78,
    annualPrice: 862,
    orderCap: "<2000 orders per month",
    planType: 'cart'
  },
  {
    id: "cart_pro",
    name: "Cart Plan Pro",
    tagline: "AI powered highly converting & customizable cart.",
    features: [
      "AI Powered Cart Drawer",
      "Customizable design",
      "Savings Display Widget",
      "Promotional Promo Widget",
      "Motivator bar for free shipping and discounts",
      "Upsells and add-ons",
      "Auto Apply Discount Coupon Codes Functionality",
      "Customisable Notes",
      "AB Tests & Limited Rollout",
      "Custom Audiences",
      "Reports and analytics",
      "Priority Phone 24x7 Support"
    ],
    freeTrialDays: 14,
    monthlyPrice: 141,
    annualPrice: 1552,
    orderCap: "2000+ orders per month",
    planType: 'cart'
  },
  {
    id: "enterprise",
    name: "Enterprise Plan",
    tagline: "Complete solution for high-volume stores.",
    features: [
      "Combination of Growth Plans of Cart drawer & upsell",
      "Custom solutions",
      "Dedicated account manager"
    ],
    freeTrialDays: 14,
    monthlyPrice: 111,
    annualPrice: 1219,
    orderCap: "<2000 orders per month",
    planType: 'enterprise'
  },
  {
    id: "enterprise_plus",
    name: "Enterprise+ Plan",
    tagline: "Complete solution for high-volume stores.",
    features: [
      "Combination of Pro Plans of Cart drawer & upsell",
      "Custom solutions",
      "Dedicated account manager"
    ],
    freeTrialDays: 14,
    monthlyPrice: 200,
    annualPrice: 2195,
    orderCap: "2000+ orders per month",
    planType: 'enterprise'
  }
];

export function getPlanById(planId: string): BillingPlan | undefined {
  return BILLING_PLANS.find(plan => plan.id === planId);
}

export function getPlanName(planId: string): string {
  const plan = getPlanById(planId);
  return plan?.name || planId;
}

export function getPlanPrice(planId: string): number {
  const plan = getPlanById(planId);
  return plan?.monthlyPrice || 0;
}

export function canAccessFeature(planId: string | null | undefined, feature: string): boolean {
  if (!planId) return false;
  
  const plan = getPlanById(planId);
  if (!plan) return false;

  // Trial plan has limited access
  if (planId === 'trial') {
    const trialFeatures = ['fbt', 'nudge', 'analytics'];
    return trialFeatures.includes(feature);
  }

  // Map features to plans
  const featureMap: Record<string, string[]> = {
    'cart_drawer': ['cart_growth', 'cart_pro', 'enterprise', 'enterprise_plus'],
    'fbt': ['upsell_growth', 'upsell_pro', 'enterprise', 'enterprise_plus', 'trial'],
    'nudge': ['upsell_growth', 'upsell_pro', 'enterprise', 'enterprise_plus', 'trial'],
    'nudge_add_together': ['upsell_growth', 'upsell_pro', 'enterprise', 'enterprise_plus'],
    'promotional_banner': ['cart_growth', 'cart_pro', 'enterprise', 'enterprise_plus'],
    'analytics': ['upsell_growth', 'upsell_pro', 'cart_growth', 'cart_pro', 'enterprise', 'enterprise_plus', 'trial'],
    'ai_features': ['upsell_growth', 'upsell_pro', 'cart_growth', 'cart_pro', 'enterprise', 'enterprise_plus'],
    'ab_testing': ['upsell_growth', 'upsell_pro', 'cart_growth', 'cart_pro', 'enterprise', 'enterprise_plus'],
  };

  const allowedPlans = featureMap[feature];
  return allowedPlans ? allowedPlans.includes(planId) : true;
}

export function getOrderLimit(planId: string): number {
  const plan = getPlanById(planId);
  if (!plan) return 0;
  
  if (planId === 'trial') return 50;
  if (plan.orderCap.includes('<2000')) return 2000;
  if (plan.orderCap.includes('2000+')) return Infinity;
  
  return Infinity;
}

