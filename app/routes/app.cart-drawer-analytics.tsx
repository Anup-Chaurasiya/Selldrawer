import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
    Page,
    Layout,
    Card,
    Text,
    DataTable,
    Banner,
    InlineStack,
    BlockStack,
    Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getVersionAnalytics, compareVersions } from "../utils/versionAnalytics.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    // Get all active versions
    const versions = await prisma.cartDrawerVersion.findMany({
        where: { isActive: true },
        orderBy: { priority: 'desc' }
    });

    if (versions.length < 2) {
        return json({
            hasEnoughVersions: false as const,
            versions
        });
    }

    // Get default and first test version
    const versionA = versions.find(v => v.isDefault) || versions[0];
    const versionB = versions.find(v => !v.isDefault) || versions[1];

    if (!versionA || !versionB) {
        return json({
            hasEnoughVersions: false as const,
            versions
        });
    }

    // Get analytics for both
    const analyticsA = await getVersionAnalytics(shop, versionA.key);
    const analyticsB = await getVersionAnalytics(shop, versionB.key);

    // Compare
    const comparison = compareVersions(analyticsA, analyticsB);

    return json({
        hasEnoughVersions: true,
        versionA,
        versionB,
        comparison,
        versions
    });
};

export default function VersionComparison() {
    const data = useLoaderData<typeof loader>();

    if (!data.hasEnoughVersions) {
        return (
            <Page title="Version Comparison">
                <Layout>
                    <Layout.Section>
                        <Banner tone="info">
                            <p>Create at least 2 active versions to compare analytics.</p>
                        </Banner>
                    </Layout.Section>
                </Layout>
            </Page>
        );
    }

    const { versionA, versionB, comparison } = data;
    const { analyticsA, analyticsB, improvement, significance, winner } = comparison;

    return (
        <Page
            title="A/B Test Results"
            subtitle="Compare cart drawer versions"
        >
            <Layout>
                {/* Version Headers */}
                <Layout.Section>
                    <InlineStack gap="400">
                        <div style={{ flex: 1 }}>
                            <Card>
                                <BlockStack gap="200">
                                    <Text variant="headingMd" as="h2">Version A (Control)</Text>
                                    <Text variant="headingLg" as="h3">{versionA.name}</Text>
                                    <InlineStack gap="200">
                                        <Badge tone={versionA.isDefault ? "success" : "info"}>
                                            {versionA.isDefault ? "Default" : "Test"}
                                        </Badge>
                                        <Badge>{`${versionA.rolloutPercentage}% rollout`}</Badge>
                                    </InlineStack>
                                </BlockStack>
                            </Card>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Card>
                                <BlockStack gap="200">
                                    <Text variant="headingMd" as="h2">Version B (Test)</Text>
                                    <Text variant="headingLg" as="h3">{versionB.name}</Text>
                                    <InlineStack gap="200">
                                        <Badge tone={versionB.isDefault ? "success" : "info"}>
                                            {versionB.isDefault ? "Default" : "Test"}
                                        </Badge>
                                        <Badge>{`${versionB.rolloutPercentage}% rollout`}</Badge>
                                    </InlineStack>
                                </BlockStack>
                            </Card>
                        </div>
                    </InlineStack>
                </Layout.Section>

                {/* Statistical Significance */}
                <Layout.Section>
                    <Card>
                        {significance.isSignificant ? (
                            <Banner tone="success">
                                <BlockStack gap="200">
                                    <Text variant="headingMd" as="h2">
                                        🏆 Winner: Version {winner}
                                    </Text>
                                    <Text as="p">
                                        Results are statistically significant with <strong>{(significance.confidenceLevel * 100).toFixed(1)}%</strong> confidence.
                                    </Text>
                                    <Text as="p">
                                        Conversion rate improved by <strong>{Math.abs(improvement.conversionRate).toFixed(1)}%</strong>
                                    </Text>
                                </BlockStack>
                            </Banner>
                        ) : (
                            <Banner tone="warning">
                                <BlockStack gap="200">
                                    <Text variant="headingMd" as="h2">Not Statistically Significant</Text>
                                    <Text as="p">
                                        Need approximately <strong>{Math.ceil(significance.sampleSizeNeeded)}</strong> more impressions to reach 95% confidence.
                                    </Text>
                                    <Text as="p" tone="subdued">
                                        P-value: {significance.pValue.toFixed(4)} (need &lt; 0.05)
                                    </Text>
                                </BlockStack>
                            </Banner>
                        )}
                    </Card>
                </Layout.Section>

                {/* Metrics Comparison */}
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingLg" as="h2">Performance Metrics (Last 30 Days)</Text>
                            <DataTable
                                columnContentTypes={['text', 'numeric', 'numeric', 'text']}
                                headings={[
                                    'Metric',
                                    versionA.name,
                                    versionB.name,
                                    'Difference'
                                ]}
                                rows={[
                                    [
                                        'Impressions',
                                        analyticsA.impressions.toLocaleString(),
                                        analyticsB.impressions.toLocaleString(),
                                        formatDifference(improvement.impressions)
                                    ],
                                    [
                                        'Add to Carts',
                                        analyticsA.addToCarts.toLocaleString(),
                                        analyticsB.addToCarts.toLocaleString(),
                                        formatDifference(improvement.addToCarts)
                                    ],
                                    [
                                        'Click-Through Rate',
                                        `${analyticsA.ctr.toFixed(2)}%`,
                                        `${analyticsB.ctr.toFixed(2)}%`,
                                        formatDifference(improvement.ctr)
                                    ],
                                    [
                                        'Conversion Rate',
                                        `${analyticsA.conversionRate.toFixed(2)}%`,
                                        `${analyticsB.conversionRate.toFixed(2)}%`,
                                        formatDifference(improvement.conversionRate)
                                    ],
                                    [
                                        'Revenue',
                                        `$${analyticsA.revenue.toFixed(2)}`,
                                        `$${analyticsB.revenue.toFixed(2)}`,
                                        formatDifference(improvement.revenue)
                                    ],
                                    [
                                        'Average Order Value',
                                        `$${analyticsA.aov.toFixed(2)}`,
                                        `$${analyticsB.aov.toFixed(2)}`,
                                        formatDifference(improvement.aov)
                                    ],
                                ]}
                            />
                        </BlockStack>
                    </Card>
                </Layout.Section>

                {/* Sample Size Info */}
                <Layout.Section>
                    <Card>
                        <BlockStack gap="200">
                            <Text variant="headingMd" as="h2">Sample Size</Text>
                            <DataTable
                                columnContentTypes={['text', 'numeric', 'numeric']}
                                headings={['Version', 'Impressions', 'Conversions']}
                                rows={[
                                    [versionA.name, analyticsA.impressions.toLocaleString(), analyticsA.addToCarts.toLocaleString()],
                                    [versionB.name, analyticsB.impressions.toLocaleString(), analyticsB.addToCarts.toLocaleString()]
                                ]}
                            />
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

function formatDifference(diff: number): string {
    if (Math.abs(diff) < 0.01) return '—';
    const prefix = diff > 0 ? '↑ ' : '↓ ';
    return `${prefix}${Math.abs(diff).toFixed(1)}%`;
}
