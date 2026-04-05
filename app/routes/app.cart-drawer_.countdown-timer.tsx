import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
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
  Box,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { syncCartDrawerConfigToMetafields } from "../utils/sync-config.server";
import { useState, useCallback, useEffect, useRef } from "react";
import { CountdownTimer as CountdownTimerComponent } from "../components/shared/CountdownTimer";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      countdownTimers: { where: { isActive: true } },
    },
  });

  const countdownTimer = cartDrawer?.countdownTimers[0] || null;

  return json({ cartDrawer, countdownTimer });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle") {
    const enabled = formData.get("enabled") === "true";

    if (enabled) {
      const cartDrawer = await prisma.cartDrawer.findUnique({
        where: { shop },
        include: {
          countdownTimers: { where: { isActive: true } },
        },
      });

      if (!cartDrawer || cartDrawer.countdownTimers.length === 0) {
        return json({
          success: false,
          error: "Configuration required. Please save the configuration first before enabling."
        }, { status: 400 });
      }
    }

    await prisma.cartDrawer.update({
      where: { shop },
      data: { countdownTimerEnabled: enabled },
    });

    await syncCartDrawerConfigToMetafields(admin, shop);
    return json({ success: true });
  }

  if (intent === "save") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: { countdownTimers: { where: { isActive: true } } },
    });

    if (!cartDrawer) {
      return json({ error: "Cart drawer not found" }, { status: 404 });
    }

    const durationMinutes = parseInt(formData.get("durationMinutes") as string) || 15;
    const messageText = formData.get("messageText") as string;
    const backgroundColor = formData.get("backgroundColor") as string;
    const textColor = formData.get("textColor") as string;

    const data = {
      durationMinutes,
      messageText,
      backgroundColor,
      textColor,
    };

    const existingTimer = cartDrawer.countdownTimers[0];

    if (existingTimer) {
      await prisma.countdownTimer.update({
        where: { id: existingTimer.id },
        data,
      });
    } else {
      await prisma.countdownTimer.create({
        data: {
          id: crypto.randomUUID(),
          ...data,
          shop,
          cartDrawerId: cartDrawer.id,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }

    await prisma.cartDrawer.update({
      where: { shop },
      data: { countdownTimerEnabled: true },
    });

    await syncCartDrawerConfigToMetafields(admin, shop);
    return redirect(`/app/cart-drawer`);
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function CountdownTimerAdmin() {
  const { cartDrawer, countdownTimer } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    durationMinutes: countdownTimer?.durationMinutes || 15,
    messageText: countdownTimer?.messageText || "Your reserves expire in {time}",
    backgroundColor: countdownTimer?.backgroundColor || "#FEF2F2",
    textColor: countdownTimer?.textColor || "#991B1B",
  });

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.countdownTimerEnabled).toString());
    submit(formData, { method: "post" });
  }, [cartDrawer?.countdownTimerEnabled, submit]);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    Object.entries(formState).forEach(([key, value]) => formData.append(key, value.toString()));
    submit(formData, { method: "post" });
  }, [formState, submit]);

  return (
    <Page
      backAction={{ url: `/app/cart-drawer` }}
      title="Countdown Timer"
      primaryAction={{
        content: "Save",
        onAction: handleSubmit,
        loading: isLoading,
      }}
    >
      <style>{`
        .premium-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          margin-bottom: 20px;
        }
        .premium-card-header { padding: 20px 24px; border-bottom: 1px solid #f3f4f6; background: linear-gradient(to right, #f8fafc, #ffffff); display: flex; justify-content: space-between; align-items: center; }
        .premium-card-body { padding: 24px; }
        .icon-circle { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); color: #ffffff; font-size: 20px; }
      `}</style>

      <Layout>
        <Layout.Section>
          <div className="premium-card">
            <div className="premium-card-header">
              <InlineStack gap="400" align="center">
                <div className="icon-circle">⏱️</div>
                <BlockStack>
                  <Text as="h2" variant="headingMd" fontWeight="bold">Urgency Timer Settings</Text>
                  <Text as="p" variant="bodySm" tone="subdued">Drive faster conversions by reminding users their carts are reserved for a limited time.</Text>
                </BlockStack>
              </InlineStack>
              <Button variant="primary" tone={cartDrawer?.countdownTimerEnabled ? "critical" : "success"} onClick={handleToggle}>
                {cartDrawer?.countdownTimerEnabled ? 'Disable Timer' : 'Enable Timer'}
              </Button>
            </div>
            <div className="premium-card-body">
              <FormLayout>
                <TextField 
                  label="Timer Duration (Minutes)"
                  type="number"
                  value={formState.durationMinutes.toString()}
                  onChange={(v) => setFormState({ ...formState, durationMinutes: parseInt(v) || 0 })}
                  autoComplete="off"
                />
                <TextField 
                  label="Message Text"
                  value={formState.messageText}
                  onChange={(v) => setFormState({ ...formState, messageText: v })}
                  helpText="Use {time} to display the remaining minutes and seconds."
                  autoComplete="off"
                />
                
                <Box paddingBlockStart="400">
                  <Text as="h3" variant="headingSm" fontWeight="bold">Colors</Text>
                  <Box paddingBlockStart="200">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <TextField label="Background Color" type={"color" as any} value={formState.backgroundColor} onChange={(v) => setFormState({ ...formState, backgroundColor: v })} autoComplete="off" />
                      <TextField label="Text Color" type={"color" as any} value={formState.textColor} onChange={(v) => setFormState({ ...formState, textColor: v })} autoComplete="off" />
                    </div>
                  </Box>
                </Box>
              </FormLayout>
            </div>
          </div>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingSm" fontWeight="bold">Live Preview</Text>
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <CountdownTimerComponent config={{ isActive: true, ...formState }} />
              </Box>
              <Text as="p" variant="bodySm" tone="subdued" textAlign="center">
                This timer appears at the very top of your cart drawer.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
