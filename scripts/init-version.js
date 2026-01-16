import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Initialize default cart drawer version
 * Run this once to set up the default version in the database
 */
async function initializeDefaultVersion() {
    try {
        // Check if default version already exists
        const existing = await prisma.cartDrawerVersion.findUnique({
            where: { key: 'default' },
        });

        if (existing) {
            console.log('✓ Default version already exists');
            console.log(`  Name: ${existing.name}`);
            console.log(`  Rollout: ${existing.rolloutPercentage}%`);
            console.log(`  Active: ${existing.isActive}`);
            return;
        }

        // Create default version
        const defaultVersion = await prisma.cartDrawerVersion.create({
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

        console.log('✅ Successfully created default version!');
        console.log(`  ID: ${defaultVersion.id}`);
        console.log(`  Key: ${defaultVersion.key}`);
        console.log(`  Name: ${defaultVersion.name}`);
        console.log(`  Rollout: ${defaultVersion.rolloutPercentage}%`);
    } catch (error) {
        console.error('❌ Error initializing default version:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the initialization
initializeDefaultVersion();
