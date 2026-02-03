import prisma from "../db.server";

/**
 * Get analytics for a specific version
 */
export interface Analytics {
    impressions: number;
    clicks: number;
    addToCarts: number;
    orders: number;
    revenue: number;
    ctr: number;
    conversionRate: number;
    orderRate: number;
    aov: number;
}

/**
 * Get analytics for a specific version
 */
export async function getVersionAnalytics(shop: string, version: string, days = 30): Promise<Analytics> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.analyticsEvent.findMany({
        where: {
            shop,
            version,
            createdAt: { gte: since }
        }
    });

    // Calculate metrics
    const impressions = events.filter(e => e.eventType === 'impression' || e.eventType === 'view').length;
    const clicks = events.filter(e => e.eventType === 'click').length;
    const addToCarts = events.filter(e => e.eventType === 'add_to_cart').length;
    const orders = events.filter(e => e.eventType === 'purchase' || e.eventType === 'order').length;

    const revenue = events
        .filter(e => e.eventType === 'purchase' || e.eventType === 'order')
        .reduce((sum, e) => sum + Number(e.value || 0), 0);

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = impressions > 0 ? (addToCarts / impressions) * 100 : 0;
    const orderRate = impressions > 0 ? (orders / impressions) * 100 : 0;
    const aov = orders > 0 ? revenue / orders : 0;

    return {
        impressions,
        clicks,
        addToCarts,
        orders,
        revenue,
        ctr,
        conversionRate,
        orderRate,
        aov
    };
}

/**
 * Compare two versions
 */
export function compareVersions(analyticsA: Analytics, analyticsB: Analytics) {
    // Calculate percentage improvements
    const improvement = {
        impressions: calculatePercentDiff(analyticsA.impressions, analyticsB.impressions),
        clicks: calculatePercentDiff(analyticsA.clicks, analyticsB.clicks),
        addToCarts: calculatePercentDiff(analyticsA.addToCarts, analyticsB.addToCarts),
        orders: calculatePercentDiff(analyticsA.orders, analyticsB.orders),
        revenue: calculatePercentDiff(analyticsA.revenue, analyticsB.revenue),
        ctr: calculatePercentDiff(analyticsA.ctr, analyticsB.ctr),
        conversionRate: calculatePercentDiff(analyticsA.conversionRate, analyticsB.conversionRate),
        orderRate: calculatePercentDiff(analyticsA.orderRate, analyticsB.orderRate),
        aov: calculatePercentDiff(analyticsA.aov, analyticsB.aov)
    };

    // Statistical significance test
    const significance = calculateSignificance(
        analyticsA.addToCarts,
        analyticsA.impressions,
        analyticsB.addToCarts,
        analyticsB.impressions
    );

    // Determine winner based on conversion rate
    let winner: 'A' | 'B' | 'inconclusive' = 'inconclusive';
    if (significance.isSignificant) {
        if (analyticsB.conversionRate > analyticsA.conversionRate) {
            winner = 'B';
        } else if (analyticsA.conversionRate > analyticsB.conversionRate) {
            winner = 'A';
        }
    }

    return {
        analyticsA,
        analyticsB,
        improvement,
        significance,
        winner
    };
}

/**
 * Calculate percentage difference
 */
function calculatePercentDiff(baseline: number, test: number): number {
    if (baseline === 0) return test > 0 ? 100 : 0;
    return ((test - baseline) / baseline) * 100;
}

/**
 * Calculate statistical significance using Z-test for proportions
 */
function calculateSignificance(
    conversionsA: number,
    viewsA: number,
    conversionsB: number,
    viewsB: number
) {
    // Handle edge cases
    if (viewsA === 0 || viewsB === 0) {
        return {
            isSignificant: false,
            pValue: 1,
            confidenceLevel: 0,
            sampleSizeNeeded: 1000
        };
    }

    const pA = conversionsA / viewsA;
    const pB = conversionsB / viewsB;
    const pPool = (conversionsA + conversionsB) / (viewsA + viewsB);

    const se = Math.sqrt(pPool * (1 - pPool) * (1 / viewsA + 1 / viewsB));

    // Handle division by zero
    if (se === 0) {
        return {
            isSignificant: false,
            pValue: 1,
            confidenceLevel: 0,
            sampleSizeNeeded: 1000
        };
    }

    const z = Math.abs((pB - pA) / se);

    // Calculate two-tailed p-value
    const pValue = 2 * (1 - normalCDF(z));

    const isSignificant = pValue < 0.05; // 95% confidence
    const confidenceLevel = 1 - pValue;

    // Calculate sample size needed if not significant
    let sampleSizeNeeded = 0;
    if (!isSignificant) {
        const mde = 0.1; // 10% minimum detectable effect
        sampleSizeNeeded = calculateSampleSize(pA, mde);
        sampleSizeNeeded = Math.max(0, sampleSizeNeeded - viewsA);
    }

    return {
        isSignificant,
        pValue,
        confidenceLevel,
        sampleSizeNeeded
    };
}

/**
 * Standard normal cumulative distribution function
 */
function normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
}

/**
 * Calculate required sample size for A/B test
 */
function calculateSampleSize(baseline: number, mde: number): number {
    const zAlpha = 1.96; // 95% confidence
    const zBeta = 0.84;  // 80% power

    const p1 = baseline;
    const p2 = baseline * (1 + mde);
    const pAvg = (p1 + p2) / 2;

    const n = Math.pow(zAlpha + zBeta, 2) * 2 * pAvg * (1 - pAvg) / Math.pow(p2 - p1, 2);

    return Math.ceil(n);
}
