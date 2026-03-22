export default function PrivacyPolicy() {
  return (
    <main style={{ padding: "4rem 6vw", maxWidth: "960px", margin: "0 auto", lineHeight: 1.7 }}>
      <h1>Selldrawer AI Privacy Policy</h1>
      <p>Last updated: November 10, 2025</p>

      <section>
        <h2>1. Overview</h2>
        <p>
          Selldrawer AI ("we", "us", "our") helps Shopify merchants drive higher average order value through
          cart drawer experiences, upsells, and personalized recommendations. This privacy policy explains how we
          collect, use, and protect personal information processed through our Shopify app.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <ul>
          <li>Shop data such as shop name, domain, plan type, and billing status provided by Shopify.</li>
          <li>
            Customer interaction data necessary to deliver upsell experiences, including anonymous cart events and
            customer identifiers used to power recommendations.
          </li>
          <li>Theme and configuration settings created by the merchant inside Selldrawer AI.</li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Information</h2>
        <p>We use collected data to:</p>
        <ul>
          <li>Render dynamic cart drawer and upsell experiences on behalf of the merchant.</li>
          <li>Provide analytics on campaign performance and conversion lift.</li>
          <li>Maintain billing records, respond to support requests, and improve the product.</li>
        </ul>
      </section>

      <section>
        <h2>4. Data Sharing</h2>
        <p>
          We do not sell merchant or customer data. We share data only with service providers engaged to host our
          infrastructure, process payments, or provide analytics strictly for Selldrawer AI operations. All
          processors are bound by confidentiality and data protection agreements.
        </p>
      </section>

      <section>
        <h2>5. Data Retention &amp; Deletion</h2>
        <p>
          We retain merchant configuration data for the duration of the subscription. Customer interaction data is
          retained for up to 12 months for performance reporting. Merchants can request deletion at any time by
          uninstalling the app or by contacting support. Our app automatically handles Shopify&#39;s mandatory privacy
          webhooks, including <code>customers/data_request</code>, <code>customers/redact</code>, and
          <code>app/uninstalled</code>.
        </p>
      </section>

      <section>
        <h2>6. Security</h2>
        <p>
          Selldrawer AI uses industry-standard security practices including SSL encryption, scoped access tokens,
          and role-based access controls. We never store Shopify credentials or customer payment information.
        </p>
      </section>

      <section>
        <h2>7. Your Rights</h2>
        <p>
          Merchants and their customers may exercise data access, correction, or deletion rights by emailing
          <a href="mailto:privacy@selldrawer.ai"> privacy@selldrawer.ai</a>. We respond to all verified requests within 30 days.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>
          Selldrawer Labs Inc.<br />
          123 Market Street, Suite 500<br />
          San Francisco, CA 94105<br />
          <a href="mailto:privacy@selldrawer.ai">privacy@selldrawer.ai</a>
        </p>
      </section>
    </main>
  );
}
