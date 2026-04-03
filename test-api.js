import fetch from 'node-fetch';

async function main() {
  const shop = 'selldrawer-test.myshopify.com';
  const url = `https://eminem-cork-bandwidth-closes.trycloudflare.com/api/cart-drawer?shop=${shop}`;
  try {
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${text.substring(0, 1000)}`);
  } catch (err) {
    console.error('Error:', err);
  }
}
main();
