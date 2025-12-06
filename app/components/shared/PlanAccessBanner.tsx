import { Banner, Button } from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";

interface PlanAccessBannerProps {
  planAccess: {
    hasAccess: boolean;
    reason?: string;
  };
  featureName?: string;
}

export function PlanAccessBanner({ planAccess, featureName }: PlanAccessBannerProps) {
  const navigate = useNavigate();

  if (planAccess.hasAccess) {
    return null;
  }

  return (
    <Banner
      title={`${featureName || "This feature"} is not available in your current plan`}
      tone="warning"
      action={{
        content: "Upgrade Plan",
        onAction: () => navigate("/app/billing"),
      }}
    >
      {planAccess.reason || "Please upgrade your plan to access this feature."}
    </Banner>
  );
}

interface OrderLimitBannerProps {
  currentCount: number;
  limit: number;
  withinLimit: boolean;
}

export function OrderLimitBanner({ currentCount, limit, withinLimit }: OrderLimitBannerProps) {
  const navigate = useNavigate();
  
  if (withinLimit && currentCount < limit * 0.8) {
    return null;
  }

  const percentage = (currentCount / limit) * 100;
  const isNearLimit = percentage >= 80 && percentage < 100;
  const isOverLimit = percentage >= 100;

  return (
    <Banner
      title={isOverLimit ? "Order limit reached" : "Approaching order limit"}
      tone={isOverLimit ? "critical" : "warning"}
      action={{
        content: "Upgrade Plan",
        onAction: () => navigate("/app/billing"),
      }}
    >
      You've used {currentCount} of {limit === Infinity ? "unlimited" : limit} orders this month
      {isOverLimit && ". Please upgrade to continue using all features."}
      {isNearLimit && ". Consider upgrading to avoid interruptions."}
    </Banner>
  );
}

