import { createHash } from 'crypto';
import prisma from '../db.server';
import { checkCustomerSegmentMembershipByShop } from './shopifySegments.server';

/**
 * Get the cart drawer version for a customer
 * Uses deterministic rollout based on percentage or customer segment
 * @param customerId - Shopify customer ID (required) - e.g., "gid://shopify/Customer/123456"
 * @param shop - Shop domain for segment checking in public API
 * @param request - Optional request object for fetching customer segments from Shopify
 * @returns Version key for this customer
 */
export async function getCartDrawerVersionForCustomer(
    customerId: string,
    shop?: string,
    request?: Request
): Promise<string> {
    console.log('[A/B Test] =====================================');
    console.log('[A/B Test] Starting version selection');
    console.log('[A/B Test] Customer ID:', customerId);

    // Get all active versions ordered by priority (highest first)
    const activeVersions = await prisma.cartDrawerVersion.findMany({
        where: { isActive: true },
        orderBy: { priority: 'desc' },
    });

    console.log('[A/B Test] Found', activeVersions.length, 'active versions');
    activeVersions.forEach(v => {
        console.log('[A/B Test]   - Version:', v.key, '(mode:', v.targetingMode + ', priority:', v.priority + ')');
    });

    // Find default version
    const defaultVersion = activeVersions.find(v => v.isDefault);
    console.log('[A/B Test] Default version:', defaultVersion?.key || 'none');

    // If default is at 100%, return it immediately
    if (defaultVersion && defaultVersion.rolloutPercentage === 100 && defaultVersion.targetingMode === 'percentage') {
        console.log('[A/B Test] ✓ Default version at 100% rollout, returning:', defaultVersion.key);
        console.log('[A/B Test] =====================================');
        return defaultVersion.key;
    }

    // Collect all unique segment IDs from segment-targeted versions
    const allSegmentIds = new Set<string>();
    activeVersions.forEach(v => {
        if (v.targetingMode === 'segment' && v.segmentIds.length > 0) {
            v.segmentIds.forEach((segmentId: string) => allSegmentIds.add(segmentId));
        }
    });

    // Fetch customer segment memberships if needed
    let customerSegments: string[] = [];
    if (allSegmentIds.size > 0 && customerId.startsWith('gid://shopify/Customer/')) {
        try {
            console.log('[A/B Test] Checking customer membership for', allSegmentIds.size, 'segments...');

            if (shop) {
                // Use shop-based method for public API (unauthenticated)
                console.log('[A/B Test] Using shop-based segment checking');
                customerSegments = await checkCustomerSegmentMembershipByShop(shop, customerId, Array.from(allSegmentIds));
            }

            console.log('[A/B Test] Customer belongs to segments:', customerSegments);
        } catch (error) {
            console.error('[A/B Test] Error checking customer segments:', error);
            console.log('[A/B Test] Continuing without segments');
        }
    } else if (allSegmentIds.size > 0 && !customerId.startsWith('gid://shopify/Customer/')) {
        console.log('[A/B Test] Session-based ID detected, skipping segment check');
    }

    // Calculate hash once for this customer (consistent across all percentage checks)
    const hash = createHash('md5').update(customerId).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    const position = hashValue % 100;

    console.log('[A/B Test] Customer hash position:', position, '(0-99)');
    console.log('[A/B Test] Hash:', hash.substring(0, 16) + '...');

    // Track cumulative percentage for non-overlapping ranges
    let cumulativePercentage = 0;

    // Check non-default versions for targeting
    for (const version of activeVersions) {
        if (version.isDefault) {
            console.log('[A/B Test] Skipping default version in loop:', version.key);
            continue;
        }

        console.log('[A/B Test] -----------------------------------');
        console.log('[A/B Test] Evaluating version:', version.key);
        console.log('[A/B Test]   Targeting mode:', version.targetingMode);
        console.log('[A/B Test]   Is active:', version.isActive);

        // Check segment-based targeting
        if (version.targetingMode === 'segment') {
            console.log('[A/B Test]   → Segment mode');
            console.log('[A/B Test]      Target segments:', version.segmentIds);

            if (version.segmentIds.length === 0) {
                console.log('[A/B Test]   ✗ No segments configured, skipping');
                continue;
            }

            if (!customerSegments || customerSegments.length === 0) {
                console.log('[A/B Test]   ✗ Customer has no segments, skipping');
                continue;
            }

            // Check if customer belongs to any target segment
            const matchingSegments = version.segmentIds.filter((segmentId: string) =>
                customerSegments.includes(segmentId)
            );

            if (matchingSegments.length > 0) {
                console.log('[A/B Test]   ✓ MATCH! Customer in segments:', matchingSegments);
                console.log('[A/B Test] Selected version:', version.key);
                console.log('[A/B Test] =====================================');
                return version.key;
            } else {
                console.log('[A/B Test]   ✗ Customer not in target segments');
                console.log('[A/B Test]      Customer has:', customerSegments);
                console.log('[A/B Test]      Version needs:', version.segmentIds);
            }
        }

        // Check percentage-based targeting with non-overlapping ranges
        if (version.targetingMode === 'percentage') {
            console.log('[A/B Test]   → Percentage mode');
            console.log('[A/B Test]      Rollout percentage:', version.rolloutPercentage + '%');

            if (version.rolloutPercentage === 0) {
                console.log('[A/B Test]   ✗ Rollout is 0%, skipping');
                continue;
            }

            if (version.rolloutPercentage > 100) {
                console.log('[A/B Test]   ✗ Invalid rollout percentage (>100), skipping');
                continue;
            }

            // Calculate range for this version
            const rangeStart = cumulativePercentage;
            const rangeEnd = cumulativePercentage + version.rolloutPercentage;

            console.log('[A/B Test]      Range: [' + rangeStart + ', ' + rangeEnd + ')');
            console.log('[A/B Test]      Position:', position);

            // Check if position falls within this version's range
            const isInRolloutResult = position >= rangeStart && position < rangeEnd;

            console.log('[A/B Test]      In rollout?:', isInRolloutResult);

            if (isInRolloutResult) {
                console.log('[A/B Test]   ✓ MATCH! Customer in rollout range');
                console.log('[A/B Test] Selected version:', version.key);
                console.log('[A/B Test] =====================================');
                return version.key;
            } else {
                console.log('[A/B Test]   ✗ Customer not in rollout range');
            }

            // Add this version's percentage to cumulative total
            cumulativePercentage += version.rolloutPercentage;
        }
    }

    // Fallback to default version or 'default'
    const fallbackVersion = defaultVersion?.key || 'default';
    console.log('[A/B Test] -----------------------------------');
    console.log('[A/B Test] No matches found');
    console.log('[A/B Test] Using fallback version:', fallbackVersion);
    console.log('[A/B Test] =====================================');

    return fallbackVersion;
}

/**
 * Get all cart drawer versions with estimated customer counts
 */
export async function getAllVersions() {
    const versions = await prisma.cartDrawerVersion.findMany({
        orderBy: { priority: 'desc' },
    });

    // Calculate estimated counts based on rollout percentage or segment size
    const totalCustomers = await prisma.cartDrawer.count();

    return versions.map(version => {
        // Estimate customers in this version
        let estimatedShops = 0;

        if (version.targetingMode === 'percentage' && version.rolloutPercentage > 0) {
            // For percentage mode, estimate based on rollout percentage
            estimatedShops = Math.floor((totalCustomers * version.rolloutPercentage) / 100);
        } else if (version.targetingMode === 'segment' && version.segmentIds.length > 0) {
            // For segment mode, we can't accurately estimate without querying Shopify
            // Just show that it's segment-based
            estimatedShops = 0; // or you could query Shopify here
        }

        return {
            ...version,
            estimatedShops,
            manualAssignments: 0, // No longer using manual assignments
        };
    });
}

/**
 * Update version rollout configuration
 * Supports both percentage-based and segment-based targeting
 */
export async function setVersionRollout(
    versionKey: string,
    percentage?: number,
    targetingMode?: string,
    segmentIds?: string[]
): Promise<void> {
    const updateData: any = {};

    console.log('[Version Update] Updating version:', versionKey);
    console.log('[Version Update] Targeting mode:', targetingMode);
    console.log('[Version Update] Percentage:', percentage);
    console.log('[Version Update] Segment IDs:', segmentIds);

    // If targetingMode is provided, use it
    if (targetingMode) {
        updateData.targetingMode = targetingMode;

        if (targetingMode === 'percentage' && percentage !== undefined) {
            if (percentage < 0 || percentage > 100) {
                throw new Error('Percentage must be between 0 and 100');
            }
            updateData.rolloutPercentage = percentage;
            updateData.isActive = percentage > 0;
            updateData.segmentIds = []; // Clear segment IDs when using percentage
            console.log('[Version Update] Set to percentage mode:', percentage + '%');
        } else if (targetingMode === 'segment' && segmentIds) {
            updateData.segmentIds = segmentIds;
            updateData.isActive = segmentIds.length > 0;
            console.log('[Version Update] Set to segment mode:', segmentIds.length, 'segments');
        }
    } else if (percentage !== undefined) {
        // Backwards compatibility: if only percentage is provided
        if (percentage < 0 || percentage > 100) {
            throw new Error('Percentage must be between 0 and 100');
        }
        updateData.rolloutPercentage = percentage;
        updateData.isActive = percentage > 0;
        console.log('[Version Update] Set rollout percentage:', percentage + '%');
    }

    await prisma.cartDrawerVersion.update({
        where: { key: versionKey },
        data: updateData,
    });

    console.log('[Version Update] Update complete!');
}

/**
 * Create a new version
 */
export async function createVersion(params: {
    key: string;
    name: string;
    description?: string;
    priority?: number;
}): Promise<void> {
    const { key, name, description, priority } = params;

    console.log('[Version Create] Creating new version:', key);

    // Check if version already exists
    const existing = await prisma.cartDrawerVersion.findUnique({
        where: { key },
    });

    if (existing) {
        throw new Error(`Version with key ${key} already exists`);
    }

    // Get max priority and add 1
    const maxPriority = await prisma.cartDrawerVersion.aggregate({
        _max: { priority: true },
    });

    await prisma.cartDrawerVersion.create({
        data: {
            key,
            name,
            description,
            isActive: false,
            isDefault: false,
            rolloutPercentage: 0,
            priority: priority ?? (maxPriority._max.priority ?? 0) + 1,
        },
    });

    console.log('[Version Create] Version created successfully');
}

/**
 * Initialize default version if not exists
 */
export async function initializeDefaultVersion(): Promise<void> {
    const defaultVersion = await prisma.cartDrawerVersion.findUnique({
        where: { key: 'default' },
    });

    if (!defaultVersion) {
        console.log('[Version Init] Creating default version');
        await prisma.cartDrawerVersion.create({
            data: {
                key: 'default',
                name: 'Version 1 (Default)',
                description: 'Original cart drawer configuration',
                isActive: true,
                isDefault: true,
                rolloutPercentage: 100,
                priority: 1,
            },
        });
        console.log('[Version Init] Default version created');
    }
}

/**
 * Get version stats for analytics
 */
export async function getVersionStats() {
    const versions = await getAllVersions();
    const totalCustomers = await prisma.cartDrawer.count();

    return {
        totalShops: totalCustomers,
        versions: versions.map(v => ({
            key: v.key,
            name: v.name,
            rollout: v.rolloutPercentage,
            estimatedShops: v.estimatedShops,
            manualAssignments: v.manualAssignments,
            isActive: v.isActive,
            isDefault: v.isDefault,
        })),
    };
}

/**
 * Delete a version
 * Cannot delete the default version
 */
export async function deleteVersion(versionKey: string): Promise<void> {
    console.log('[Version Delete] Deleting version:', versionKey);

    // Check if version exists
    const version = await prisma.cartDrawerVersion.findUnique({
        where: { key: versionKey },
    });

    if (!version) {
        throw new Error(`Version with key ${versionKey} not found`);
    }

    // Prevent deleting the default version
    if (version.isDefault) {
        throw new Error('Cannot delete the default version');
    }

    // Delete the version
    await prisma.cartDrawerVersion.delete({
        where: { key: versionKey },
    });

    console.log('[Version Delete] Version deleted successfully');
}
