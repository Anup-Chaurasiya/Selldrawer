import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkVersions() {
    console.log('📊 Cart Drawer Versions:\n');

    const versions = await prisma.cartDrawerVersion.findMany({
        orderBy: { priority: 'desc' },
        include: {
            _count: {
                select: { assignments: true }
            }
        }
    });

    if (versions.length === 0) {
        console.log('❌ No versions found!');
        return;
    }

    versions.forEach(v => {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📦 ${v.name} (${v.key})`);
        console.log(`   Active: ${v.isActive ? '✅ Yes' : '❌ No'}`);
        console.log(`   Default: ${v.isDefault ? '✅ Yes' : '❌ No'}`);
        console.log(`   Rollout: ${v.rolloutPercentage}%`);
        console.log(`   Priority: ${v.priority}`);
        console.log(`   Manual Assignments: ${v._count.assignments}`);
        console.log(`   Created: ${v.createdAt.toLocaleString()}`);
        if (v.description) {
            console.log(`   Description: ${v.description}`);
        }
    });

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`Total versions: ${versions.length}`);

    await prisma.$disconnect();
}

checkVersions().catch(console.error);
