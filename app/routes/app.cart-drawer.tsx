import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  InlineStack,
  Badge,
  Icon,
  Box,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { 
  ChartVerticalIcon,
  MegaphoneIcon,
  ProductIcon,
  DiscountIcon,
  CashDollarIcon,
  DeliveryIcon,
} from '@shopify/polaris-icons';
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Get or create cart drawer configuration
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      freeShippingBars: { where: { isActive: true } },
      promotionalBanners: { where: { isActive: true } },
      productRecommendations: { where: { isActive: true } },
      savingsDisplays: { where: { isActive: true } },
      freeShippingMessages: { where: { isActive: true } },
    },
  });

  if (!cartDrawer) {
    cartDrawer = await prisma.cartDrawer.create({
      data: {
        shop,
        isActive: true,
      },
      include: {
        freeShippingBars: true,
        promotionalBanners: true,
        productRecommendations: true,
        savingsDisplays: true,
        freeShippingMessages: true,
      },
    });
  }

  const couponCodeField = await prisma.couponCodeField.findUnique({
    where: { shop },
  });

  return json({ cartDrawer, couponCodeField, shop });
};

export default function CartDrawerIndex() {
  const { cartDrawer, couponCodeField } = useLoaderData<typeof loader>();

  const features = [
    {
      id: 'free-shipping-bar',
      title: 'Free Shipping Progress Bar',
      description: 'Show customers how much more they need to spend for free shipping',
      icon: ChartVerticalIcon,
      enabled: cartDrawer.freeShippingProgressBarEnabled,
      count: cartDrawer.freeShippingBars.length,
      path: '/app/cart-drawer/free-shipping-bar',
    },
    {
      id: 'promotional-banner',
      title: 'Promotional Banner',
      description: 'Display promotional offers and sales in the cart',
      icon: MegaphoneIcon,
      enabled: cartDrawer.promotionalBannerEnabled,
      count: cartDrawer.promotionalBanners.length,
      path: '/app/cart-drawer/promotional-banner',
    },
    {
      id: 'product-recommendations',
      title: 'Product Recommendations',
      description: 'Upsell related products with "You may also like"',
      icon: ProductIcon,
      enabled: cartDrawer.productRecommendationsEnabled,
      count: cartDrawer.productRecommendations.length,
      path: '/app/cart-drawer/product-recommendations',
    },
    {
      id: 'coupon-code',
      title: 'Coupon Code Field',
      description: 'Allow customers to apply discount codes in cart',
      icon: DiscountIcon,
      enabled: cartDrawer.couponCodeFieldEnabled,
      count: couponCodeField ? 1 : 0,
      path: '/app/cart-drawer/coupon-code',
    },
    {
      id: 'savings-display',
      title: 'Savings Display',
      description: 'Show total amount saved to encourage checkout',
      icon: CashDollarIcon,
      enabled: cartDrawer.savingsDisplayEnabled,
      count: cartDrawer.savingsDisplays.length,
      path: '/app/cart-drawer/savings-display',
    },
    {
      id: 'free-shipping-message',
      title: 'Free Shipping Message',
      description: 'Display free shipping threshold at bottom of cart',
      icon: DeliveryIcon,
      enabled: cartDrawer.freeShippingMessageEnabled,
      count: cartDrawer.freeShippingMessages.length,
      path: '/app/cart-drawer/free-shipping-message',
    },
  ];

  return (
    <Page>
      <TitleBar title="Cart Drawer Customization">
        <button variant="primary" url="/app/cart-drawer/preview">
          Preview Cart
        </button>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Customize Your Cart Experience
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Enable and configure features to enhance your cart drawer. Toggle features on/off to see how they enhance the shopping experience.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <BlockStack gap="400">
              {features.map((feature) => (
                <Card key={feature.id}>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="400" blockAlign="center">
                        <Box>
                          <Icon source={feature.icon} tone="base" />
                        </Box>
                        <BlockStack gap="100">
                          <InlineStack gap="200" blockAlign="center">
                            <Text as="h3" variant="headingMd">
                              {feature.title}
                            </Text>
                            {feature.enabled ? (
                              <Badge tone="success">Enabled</Badge>
                            ) : (
                              <Badge>Disabled</Badge>
                            )}
                          </InlineStack>
                          <Text as="p" variant="bodyMd" tone="subdued">
                            {feature.description}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                      <InlineStack gap="200">
                        {feature.count > 0 && (
                          <Text as="span" variant="bodySm" tone="subdued">
                            {feature.count} active
                          </Text>
                        )}
                        <Button
                          url={feature.path}
                        >
                          Configure
                        </Button>
                      </InlineStack>
                    </InlineStack>
                  </BlockStack>
                </Card>
              ))}
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Installation
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Enable the cart drawer in your theme to start showing these features to customers.
                  </Text>
                  <Button
                    url="/app/cart-drawer/installation"
                  >
                    View Instructions
                  </Button>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Live Preview
                  </Text>
                  <Text as="p" variant="bodyMd">
                    See how your cart drawer will look with all enabled features.
                  </Text>
                  <Button
                    variant="primary"
                    url="/app/cart-drawer/preview"
                  >
                    Open Preview
                  </Button>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

