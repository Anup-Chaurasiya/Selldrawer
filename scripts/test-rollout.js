import { getShopCartDrawerVersion } from '../app/services/cartDrawerVersions.server.js';

const testShop = process.argv[2] || 'test-shop.myshopify.com';

console.log('🧪 Testing Deterministic Rollout\n');
console.log(`Shop: ${testShop}\n`);

// Test consistency (same shop should always get same version)
console.log('Testing consistency (5 requests):');
const results = [];
for (let i = 0; i < 5; i++) {
    const version = await getShopCartDrawerVersion(testShop);
    results.push(version);
    console.log(`  ${i + 1}. ${version}`);
}

const allSame = results.every(v => v === results[0]);
console.log(`\n${allSame ? '✅' : '❌'} Consistency: ${allSame ? 'PASS - All same version' : 'FAIL - Different versions'}`);

// Test distribution across multiple shops
console.log('\n\nTesting distribution (10 shops):');
const testShops = Array.from({ length: 10 }, (_, i) => `shop${i + 1}.myshopify.com`);
const distribution = {};

for (const shop of testShops) {
    const version = await getShopCartDrawerVersion(shop);
    distribution[version] = (distribution[version] || 0) + 1;
    console.log(`  ${shop.padEnd(25)} → ${version}`);
}

console.log('\n📊 Distribution Summary:');
Object.entries(distribution).forEach(([version, count]) => {
    console.log(`  ${version.padEnd(10)} ${count} shops (${count * 10}%)`);
});

console.log('\n✅ Test complete!');
process.exit(0);
