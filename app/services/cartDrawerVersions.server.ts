import { createHash } from 'crypto';
import prisma from '../db.server';

/**
 * Get the cart drawer version for a shop
 * Uses deterministic rollout based on percentage
 */
export async function getShopCartDrawerVersion(shop: string): Promise<string> {
    // 1. Check if shop has explicit version assignment
    const assignment = await prisma.shopCartDrawerVersionAssignment.findUnique({
        where: { shop },
        include: { version: true },
    });

    if (assignment && assignment.version.isActive) {
        return assignment.version.key;
    }

    // 2. Check for active versions with rollout
    const activeVersions = await prisma.cartDrawerVersion.findMany({
        where: { isActive: true },
        orderBy: { priority: 'desc' }, // Newer versions first
    });

    // Find default version first
    const defaultVersion = activeVersions.find(v => v.isDefault);
    if (defaultVersion && defaultVersion.rolloutPercentage === 100) {
        return defaultVersion.key;
    }

    // Check non-default versions for rollout
    for (const version of activeVersions) {
        if (version.isDefault) continue; // Skip default for now

        if (version.rolloutPercentage > 0 && version.rolloutPercentage <= 100) {
            // Check if shop is in rollout percentage (deterministic)
            if (isShopInRollout(shop, version.key, version.rolloutPercentage)) {
                return version.key;
            }
        }
    }

    // 3. Fallback to default version or 'default'
    return defaultVersion?.key || 'default';
}

/**
 * Deterministic rollout check based on shop domain + version key
 * Same shop will always get same result for same version
 */
function isShopInRollout(shop: string, versionKey: string, percentage: number): boolean {
    const hash = createHash('md5').update(shop + versionKey).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    const position = hashValue % 100;
    return position < percentage;
}

/**
 *Assign shop to specific version (manual override)
 */
export async function assignShopToVersion(shop: string, versionKey: string): Promise<void> {
    const version = await prisma.cartDrawerVersion.findUnique({
        where: { key: versionKey },
    });

    if (!version) {
        throw new Error(`Version ${versionKey} not found`);
    }

    await prisma.shopCartDrawerVersionAssignment.upsert({
        where: { shop },
        create: {
            shop,
            versionId: version.id,
        },
        update: {
            versionId: version.id,
        },
    });
}

/**
 * Remove manual assignment (shop will use rollout percentage)
 */
export async function removeShopVersionAssignment(shop: string): Promise<void> {
    await prisma.shopCartDrawerVersionAssignment.deleteMany({
        where: { shop },
    });
}

/**
 * Get all cart drawer versions with merchant counts
 */
export async function getAllVersions() {
    const versions = await prisma.cartDrawerVersion.findMany({
        orderBy: { priority: 'desc' },
        include: {
            _count: {
                select: { assignments: true },
            },
        },
    });

    // Calculate estimated merchant counts based on rollout percentage
    const totalShops = await prisma.cartDrawer.count();

    return versions.map(version => {
        const manualAssignments = version._count.assignments;

        // Estimate shops in this version based on rollout
        let estimatedShops = manualAssignments;
        if (version.rolloutPercentage > 0) {
            estimatedShops += Math.floor((totalShops * version.rolloutPercentage) / 100);
        }

        return {
            ...version,
            estimatedShops,
            manualAssignments,
        };
    });
}

/**
 * Update version rollout percentage
 */
export async function setVersionRollout(
    versionKey: string,
    percentage: number
): Promise<void> {
    if (percentage < 0 || percentage > 100) {
        throw new Error('Percentage must be between 0 and 100');
    }

    await prisma.cartDrawerVersion.update({
        where: { key: versionKey },
        data: {
            isActive: percentage > 0,
            rolloutPercentage: percentage,
        },
    });
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
}

/**
 * Initialize default version if not exists
 */
export async function initializeDefaultVersion(): Promise<void> {
    const defaultVersion = await prisma.cartDrawerVersion.findUnique({
        where: { key: 'default' },
    });

    if (!defaultVersion) {
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
    }
}

/**
 * Get version stats for analytics
 */
export async function getVersionStats() {
    const versions = await getAllVersions();
    const totalShops = await prisma.cartDrawer.count();

    return {
        totalShops,
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
