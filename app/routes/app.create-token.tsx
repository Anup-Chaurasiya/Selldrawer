/**
 * Manual token creation endpoint for debugging
 * Navigate to /app/create-token to manually create a storefront access token
 */

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Page, Card, BlockStack, Text, Banner, InlineGrid } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useLoaderData } from "@remix-run/react";
import { ensureStorefrontAccessToken, getStorefrontAccessToken } from "../utils/storefrontToken.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    let existingToken = null;
    let newTokenCreated = false;
    let error = null;
    let errorStack = null;

    try {
        console.log(`[CreateToken Page] Checking token for shop: ${shop}`);

        // Check if token already exists
        existingToken = await getStorefrontAccessToken(shop);
        console.log(`[CreateToken Page] Existing token found: ${!!existingToken}`);

        if (!existingToken) {
            console.log(`[CreateToken Page] No existing token, creating new one...`);
            // Create new token
            const token = await ensureStorefrontAccessToken(request);
            existingToken = token;
            newTokenCreated = true;
            console.log(`[CreateToken Page] New token created successfully`);
        }
    } catch (err) {
        console.error(`[CreateToken Page] Error:`, err);
        error = err instanceof Error ? err.message : String(err);
        errorStack = err instanceof Error ? err.stack : null;
    }

    return json({
        shop,
        hasToken: !!existingToken,
        tokenPreview: existingToken ? `${existingToken.substring(0, 10)}...` : null,
        newTokenCreated,
        error,
        errorStack,
    });
};

export default function CreateToken() {
    const data = useLoaderData<typeof loader>();

    return (
        <Page>
            <TitleBar title="Storefront Access Token" />
            <BlockStack gap="400">
                <Card>
                    <BlockStack gap="400">
                        <Text as="h2" variant="headingMd">
                            Storefront Access Token Status
                        </Text>

                        {data.error && (
                            <Banner tone="critical" title="Error">
                                <BlockStack gap="200">
                                    <Text as="p" variant="bodyMd">{data.error}</Text>
                                    {data.errorStack && (
                                        <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', overflowX: 'auto' }}>
                                            <Text as="p" variant="bodyXs">
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {data.errorStack}
                                                </pre>
                                            </Text>
                                        </div>
                                    )}
                                    <Text as="p" variant="bodyMd" tone="subdued">
                                        Check your server console for detailed logs.
                                    </Text>
                                </BlockStack>
                            </Banner>
                        )}

                        {data.newTokenCreated && (
                            <Banner tone="success" title="Token Created">
                                A new Storefront Access Token has been created for your shop!
                            </Banner>
                        )}

                        {!data.newTokenCreated && data.hasToken && (
                            <Banner tone="info" title="Token Exists">
                                Your shop already has a Storefront Access Token.
                            </Banner>
                        )}

                        <BlockStack gap="200">
                            <Text as="p" variant="bodyMd">
                                <strong>Shop:</strong> {data.shop}
                            </Text>
                            <Text as="p" variant="bodyMd">
                                <strong>Has Token:</strong> {data.hasToken ? "Yes" : "No"}
                            </Text>
                            {data.tokenPreview && (
                                <Text as="p" variant="bodyMd">
                                    <strong>Token Preview:</strong> {data.tokenPreview}
                                </Text>
                            )}
                        </BlockStack>
                    </BlockStack>
                </Card>
            </BlockStack>
        </Page>
    );
}
