import { createHash } from 'crypto';
import prisma from '../db.server';

/**
 * Get the cart drawer version for a customer
 * Uses deterministic rollout based on percentage or customer segment
 * @param customerId - Shopify customer ID (required) - e.g., "gid://shopify/Customer/123456"
 * @param customerSegments - Array of segment IDs the customer belongs to (optional)
 * @returns Version key for this customer
 */
export async function getCartDrawerVersionForCustomer(
    customerId: string,
    customerSegments?: string[]
): Promise<string> {
    console.log('[A/B Test] =====================================');
    console.log('[A/B Test] Starting version selection');
    console.log('[A/B Test] Customer ID:', customerId);
    console.log('[A/B Test] Customer segments:', customerSegments || 'none provided');

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

        // Check percentage-based targeting
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

            // Calculate hash position
            const hash = createHash('md5').update(customerId + version.key).digest('hex');
            const hashValue = parseInt(hash.substring(0, 8), 16);
            const position = hashValue % 100;
            const isInRolloutResult = position < version.rolloutPercentage;

            console.log('[A/B Test]      Hash:', hash.substring(0, 16) + '...');
            console.log('[A/B Test]      Hash value:', hashValue);
            console.log('[A/B Test]      Position (0-99):', position);
            console.log('[A/B Test]      Threshold:', version.rolloutPercentage);
            console.log('[A/B Test]      In rollout?:', isInRolloutResult);

            if (isInRolloutResult) {
                console.log('[A/B Test]   ✓ MATCH! Customer in rollout percentage');
                console.log('[A/B Test] Selected version:', version.key);
                console.log('[A/B Test] =====================================');
                return version.key;
            } else {
                console.log('[A/B Test]   ✗ Customer not in rollout percentage');
            }
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
