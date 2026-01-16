import { getShopCartDrawerVersion } from '../app/services/cartDrawerVersions.server.js';
import prisma from '../app/db.server.js';

const testShop = process.argv[2] || 'test-shop.myshopify.com';

console.log('🧪 Testing Version Detection in API\n');
console.log(`Shop: ${testShop}\n`);

async function test() {
    // Test 1: Version Detection
    console.log('1️⃣ Testing Version Assignment:');
    const version = await getShopCartDrawerVersion(testShop);
    console.log(`   Assigned Version: ${version}\n`);

    // Test 2: Check if config exists for this version
    console.log('2️⃣ Checking Configuration:');
    const config = await prisma.cartDrawer.findUnique({
        where: {
            shop_version: {
                shop: testShop,
                version: version
            }
        }
    });

    if (config) {
        console.log(`   ✅ Configuration exists for ${version}`);
        console.log(`   Theme: ${config.theme}`);
        console.log(`   Primary Color: ${config.primaryColor}`);
        console.log(`   Active: ${config.isActive}`);
    } else {
        console.log(`   ❌ No configuration for ${version}`);
        console.log(`   Will use fallback to default`);
    }

    // Test 3: Test API Response Simulation
    console.log('\n3️⃣ Simulating API Response:');
    let finalConfig = config;
    let fallbackUsed = false;

    if (!finalConfig && version !== 'default') {
        fallbackUsed = true;
        finalConfig = await prisma.cartDrawer.findUnique({
            where: {
                shop_version: {
                    shop: testShop,
                    version: 'default'
                }
            }
        });
    }

    if (finalConfig) {
        console.log('   Response would include:');
        console.log(`   {`);
        console.log(`     _version: "${version}",`);
        console.log(`     _versionMeta: {`);
        console.log(`       assignedVersion: "${version}",`);
        console.log(`       fallbackUsed: ${fallbackUsed},`);
        console.log(`       loadedVersion: "${finalConfig.version}"`);
        console.log(`     },`);
        console.log(`     enabled: ${finalConfig.isActive},`);
        console.log(`     theme: "${finalConfig.theme}"`);
        console.log(`   }`);
    }

    console.log('\n✅ Test complete!');
    await prisma.$disconnect();
}

test().catch(console.error);
