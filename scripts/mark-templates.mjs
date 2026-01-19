import prisma from '../db.server.js';

async function markExisting Templates() {
    console.log('Finding existing CartDrawers...');

    // Get all unique versions
    const versions = await prisma.cartDrawer.findMany({
        select: { version: true },
        distinct: ['version'],
    });

    console.log(`Found ${versions.length} unique versions`);

    for (const { version } of versions) {
        // Find oldest CartDrawer for this version
        const oldest = await prisma.cartDrawer.findFirst({
            where: { version },
            orderBy: { createdAt: 'asc' },
        });

        if (oldest) {
            // Unmark all templates for this version first
            await prisma.cartDrawer.updateMany({
                where: { version, isTemplate: true },
                data: { isTemplate: false },
            });

            // Mark the oldest as template
            await prisma.cartDrawer.update({
                where: { id: oldest.id },
                data: { isTemplate: true },
            });

            console.log(`✓ Marked template for version "${version}" (shop: ${oldest.shop})`);
        }
    }

    // Verify
    const templates = await prisma.cartDrawer.findMany({
        where: { isTemplate: true },
        select: { version: true, shop: true },
    });

    console.log('\nTemplates marked:');
    templates.forEach(t => {
        console.log(`  - ${t.version}: ${t.shop}`);
    });

    console.log('\n✅ Template marking complete!');
    await prisma.$disconnect();
}

markExistingTemplates()
    .catch(console.error)
    .finally(() => process.exit());
