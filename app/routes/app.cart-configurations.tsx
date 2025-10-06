import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  DataTable,
  Badge,
  Text,
  BlockStack,
  InlineStack,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import type { CartConfiguration, CartConfigurationTarget } from "./types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const configurations = await (prisma as any).cartConfiguration.findMany({
    where: { shop: session.shop },
    include: { targets: true },
    orderBy: { createdAt: "desc" },
  });

  return json({ configurations });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");
  const configId = formData.get("configId");

  if (action === "toggle" && configId) {
    const config = await (prisma as any).cartConfiguration.findFirst({
      where: { id: configId.toString(), shop: session.shop },
    });

    if (config) {
      await (prisma as any).cartConfiguration.update({
        where: { id: configId.toString() },
        data: { isActive: !config.isActive },
      });
    }
  }

  if (action === "delete" && configId) {
    await (prisma as any).cartConfiguration.delete({
      where: { id: configId.toString() },
    });
  }

  return json({ success: true });
};

export default function CartConfigurations() {
  const { configurations } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const toggleConfiguration = (configId: string, currentStatus: boolean) => {
    fetcher.submit(
      { action: "toggle", configId },
      { method: "POST" }
    );
    shopify.toast.show(`Configuration ${currentStatus ? 'disabled' : 'enabled'}`);
  };

  const deleteConfiguration = (configId: string) => {
    if (confirm("Are you sure you want to delete this configuration?")) {
      fetcher.submit(
        { action: "delete", configId },
        { method: "POST" }
      );
      shopify.toast.show("Configuration deleted");
    }
  };

  const formatCondition = (config: Pick<CartConfiguration, 'conditionOperator' | 'conditionType' | 'conditionValue'>) => {
    const operatorText: { [key: string]: string } = {
      greater_than: ">",
      less_than: "<",
      equals: "=",
    };
    
    const conditionText: { [key: string]: string } = {
      cart_value: "Cart Value",
      product_count: "Product Count",
      category_value: "Category Value",
    };

    return `${conditionText[config.conditionType] || config.conditionType} ${operatorText[config.conditionOperator] || config.conditionOperator} ${config.conditionValue}`;
  };

  const formatAction = (config: Pick<CartConfiguration, 'actionType' | 'actionValue'>) => {
    const actionText: { [key: string]: string } = {
      discount_percentage: `${config.actionValue}% discount`,
      discount_fixed: `$${config.actionValue} off`,
      free_shipping: "Free shipping",
      upsell_product: "Product upsell",
    };

    return actionText[config.actionType] || config.actionType;
  };

  const formatTargeting = (config: Pick<CartConfiguration, 'targetType' | 'targets'>) => {
    if (config.targetType === "store_wide") return "Store-wide";
    if (config.targets.length === 0) return config.targetType;
    return `${config.targetType} (${config.targets.length} items)`;
  };

  const rows = configurations.map((config: CartConfiguration) => [
    config.name,
    formatCondition(config),
    formatAction(config),
    formatTargeting(config),
    <Badge key={config.id} tone={config.isActive ? "success" : "critical"}>
      {config.isActive ? "Active" : "Inactive"}
    </Badge>,
    <InlineStack key={config.id} gap="200">
      <Button
        size="micro"
        onClick={() => toggleConfiguration(config.id, config.isActive)}
      >
        {config.isActive ? "Disable" : "Enable"}
      </Button>
      <Button
        size="micro"
        variant="primary"
        url={`/app/cart-configurations/${config.id}`}
      >
        Edit
      </Button>
      <Button
        size="micro"
        tone="critical"
        onClick={() => deleteConfiguration(config.id)}
      >
        Delete
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page>
      <TitleBar title="Cart Configurations" />
      
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <InlineStack align="end">
              <Button variant="primary" url="/app/cart-configurations/new">
                Create Configuration
              </Button>
            </InlineStack>
          {configurations.length === 0 ? (
            <Card>
              <EmptyState
                heading="No cart configurations yet"
                action={{
                  content: "Create your first configuration",
                  url: "/app/cart-configurations/new",
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <Text as="p" variant="bodyMd">
                  Create cart configurations to show personalized offers and incentives to your customers based on their cart contents.
                </Text>
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <DataTable
                columnContentTypes={[
                  "text",
                  "text", 
                  "text",
                  "text",
                  "text",
                  "text",
                ]}
                headings={[
                  "Name",
                  "Condition", 
                  "Action",
                  "Targeting",
                  "Status",
                  "Actions",
                ]}
                rows={rows}
              />
            </Card>
          )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
