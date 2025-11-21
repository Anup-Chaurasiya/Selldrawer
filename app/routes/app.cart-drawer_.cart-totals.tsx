import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  BlockStack,
  Text,
  InlineStack,
  Banner,
  Checkbox,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback } from "react";
import { CartTotals as CartTotalsComponent } from "../components/shared/CartTotals";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      cartTotals: { where: { isActive: true } },
    },
  });

  const cartTotals = cartDrawer?.cartTotals[0] || null;

  return json({ cartDrawer, cartTotals });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle") {
    const enabled = formData.get("enabled") === "true";

    // Check if data exists before enabling
    if (enabled) {
      const cartDrawer = await prisma.cartDrawer.findUnique({
        where: { shop },
        include: {
          cartTotals: { where: { isActive: true } },
        },
      });

      if (!cartDrawer || cartDrawer.cartTotals.length === 0) {
        return json({ 
          success: false, 
          error: "Configuration required. Please save the configuration first before enabling." 
        }, { status: 400 });
      }
    }
    
    await prisma.cartDrawer.update({
      where: { shop },
      data: { cartTotalsEnabled: enabled },
    });

    return json({ success: true });
  }

  if (intent === "save") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: { cartTotals: { where: { isActive: true } } },
    });

    if (!cartDrawer) {
      return json({ error: "Cart drawer not found" }, { status: 404 });
    }

    const data = {
      showOriginalPrice: formData.get("showOriginalPrice") === "true",
      showItemDiscounts: formData.get("showItemDiscounts") === "true",
      showSubtotal: formData.get("showSubtotal") === "true",
      showCouponDiscount: formData.get("showCouponDiscount") === "true",
      showTaxNotice: formData.get("showTaxNotice") === "true",
      subtotalLabel: formData.get("subtotalLabel") as string,
      totalLabel: formData.get("totalLabel") as string,
      taxNoticeText: formData.get("taxNoticeText") as string,
      originalPriceLabel: formData.get("originalPriceLabel") as string,
      itemDiscountsLabel: formData.get("itemDiscountsLabel") as string,
      borderColor: formData.get("borderColor") as string,
      backgroundColor: formData.get("backgroundColor") as string,
      textColor: formData.get("textColor") as string,
      totalTextColor: formData.get("totalTextColor") as string,
      discountColor: formData.get("discountColor") as string,
    };

    const existingCartTotals = cartDrawer.cartTotals[0];

    if (existingCartTotals) {
      await prisma.cartTotals.update({
        where: { id: existingCartTotals.id },
        data,
      });
    } else {
      await prisma.cartTotals.create({
        data: {
          ...data,
          shop,
          cartDrawerId: cartDrawer.id,
          isActive: true,
        },
      });
    }

    // Auto-enable the feature after saving configuration
    await prisma.cartDrawer.update({
      where: { shop },
      data: { cartTotalsEnabled: true },
    });

    return redirect("/app/cart-drawer");
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function CartTotals() {
  const { cartDrawer, cartTotals } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    showOriginalPrice: cartTotals?.showOriginalPrice ?? true,
    showItemDiscounts: cartTotals?.showItemDiscounts ?? true,
    showSubtotal: cartTotals?.showSubtotal ?? true,
    showCouponDiscount: cartTotals?.showCouponDiscount ?? true,
    showTaxNotice: cartTotals?.showTaxNotice ?? true,
    subtotalLabel: cartTotals?.subtotalLabel || "Subtotal",
    totalLabel: cartTotals?.totalLabel || "Total",
    taxNoticeText: cartTotals?.taxNoticeText || "Taxes and shipping calculated at checkout",
    originalPriceLabel: cartTotals?.originalPriceLabel || "Original Price",
    itemDiscountsLabel: cartTotals?.itemDiscountsLabel || "Item Discounts",
    borderColor: cartTotals?.borderColor || "#e5e7eb",
    backgroundColor: cartTotals?.backgroundColor || "#ffffff",
    textColor: cartTotals?.textColor || "#374151",
    totalTextColor: cartTotals?.totalTextColor || "#111827",
    discountColor: cartTotals?.discountColor || "#f59e0b",
  });

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.cartTotalsEnabled).toString());
    submit(formData, { method: "post" });
  }, [cartDrawer?.cartTotalsEnabled, submit]);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    submit(formData, { method: "post" });
  }, [formState, submit]);

  // Sample cart data for preview
  const sampleCartItems = [
    {
      original_price: 4999 * 100, // in cents
      final_price: 2999 * 100,
      quantity: 1,
    },
    {
      original_price: 1999 * 100,
      final_price: 1499 * 100,
      quantity: 2,
    }
  ];

  const sampleTotalPrice = sampleCartItems.reduce((sum, item) => 
    sum + (item.final_price * item.quantity), 0
  );

  const sampleDiscount = {
    code: 'SAVE20',
    type: 'percentage' as const,
    value: 20
  };

  return (
    <Page
      backAction={{ url: "/app/cart-drawer" }}
      title="Cart Totals"
      primaryAction={{
        content: "Save",
        onAction: handleSubmit,
        loading: isLoading,
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Configuration
                  </Text>
                  <Button onClick={handleToggle} loading={isLoading}>
                    {cartDrawer?.cartTotalsEnabled ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>
                
                {!cartDrawer?.cartTotalsEnabled && (
                  <Banner tone="warning">
                    This feature is currently disabled. Enable it to show customized cart totals.
                  </Banner>
                )}

                <Text as="h3" variant="headingSm">
                  Display Options
                </Text>

                <FormLayout>
                  <Checkbox
                    label="Show Original Price (when items have discounts)"
                    checked={formState.showOriginalPrice}
                    onChange={(value) => setFormState({ ...formState, showOriginalPrice: value })}
                  />

                  <Checkbox
                    label="Show Item Discounts Breakdown"
                    checked={formState.showItemDiscounts}
                    onChange={(value) => setFormState({ ...formState, showItemDiscounts: value })}
                  />

                  <Checkbox
                    label="Show Subtotal"
                    checked={formState.showSubtotal}
                    onChange={(value) => setFormState({ ...formState, showSubtotal: value })}
                  />

                  <Checkbox
                    label="Show Coupon Discount (when applied)"
                    checked={formState.showCouponDiscount}
                    onChange={(value) => setFormState({ ...formState, showCouponDiscount: value })}
                  />

                  <Checkbox
                    label="Show Tax & Shipping Notice"
                    checked={formState.showTaxNotice}
                    onChange={(value) => setFormState({ ...formState, showTaxNotice: value })}
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Labels & Text
                </Text>

                <FormLayout>
                  <TextField
                    label="Subtotal Label"
                    value={formState.subtotalLabel}
                    onChange={(value) => setFormState({ ...formState, subtotalLabel: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Total Label"
                    value={formState.totalLabel}
                    onChange={(value) => setFormState({ ...formState, totalLabel: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Original Price Label"
                    value={formState.originalPriceLabel}
                    onChange={(value) => setFormState({ ...formState, originalPriceLabel: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Item Discounts Label"
                    value={formState.itemDiscountsLabel}
                    onChange={(value) => setFormState({ ...formState, itemDiscountsLabel: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Tax Notice Text"
                    value={formState.taxNoticeText}
                    onChange={(value) => setFormState({ ...formState, taxNoticeText: value })}
                    autoComplete="off"
                    multiline={2}
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Styling
                </Text>

                <FormLayout>
                  <TextField
                    label="Border Color"
                    type="color"
                    value={formState.borderColor}
                    onChange={(value) => setFormState({ ...formState, borderColor: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Background Color"
                    type="color"
                    value={formState.backgroundColor}
                    onChange={(value) => setFormState({ ...formState, backgroundColor: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Text Color"
                    type="color"
                    value={formState.textColor}
                    onChange={(value) => setFormState({ ...formState, textColor: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Total Text Color"
                    type="color"
                    value={formState.totalTextColor}
                    onChange={(value) => setFormState({ ...formState, totalTextColor: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Discount Color"
                    type="color"
                    value={formState.discountColor}
                    onChange={(value) => setFormState({ ...formState, discountColor: value })}
                    autoComplete="off"
                  />
                </FormLayout>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Preview
              </Text>
              
              <div style={{ 
                backgroundColor: formState.backgroundColor,
                padding: '16px',
                borderRadius: '8px'
              }}>
                <CartTotalsComponent
                  items={sampleCartItems}
                  totalPrice={sampleTotalPrice}
                  appliedDiscount={sampleDiscount}
                  config={{
                    showOriginalPrice: formState.showOriginalPrice,
                    showItemDiscounts: formState.showItemDiscounts,
                    showSubtotal: formState.showSubtotal,
                    showCouponDiscount: formState.showCouponDiscount,
                    showTaxNotice: formState.showTaxNotice,
                    subtotalLabel: formState.subtotalLabel,
                    totalLabel: formState.totalLabel,
                    taxNoticeText: formState.taxNoticeText,
                    originalPriceLabel: formState.originalPriceLabel,
                    itemDiscountsLabel: formState.itemDiscountsLabel,
                    borderColor: formState.borderColor,
                    backgroundColor: formState.backgroundColor,
                    textColor: formState.textColor,
                    totalTextColor: formState.totalTextColor,
                    discountColor: formState.discountColor,
                  }}
                  isPreview={true}
                />
              </div>

              <Text as="p" variant="bodyMd" tone="subdued">
                This is how the cart totals will appear in your cart drawer with sample data including discounts.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

