import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
 
 import { login } from "../../shopify.server";
 
 import styles from "./styles.module.css";
 
 export const loader = async ({ request }: LoaderFunctionArgs) => {
   const url = new URL(request.url);
 
   if (url.searchParams.get("shop")) {
     throw redirect(`/app?${url.searchParams.toString()}`);
   }
 
   return { showForm: Boolean(login) };
 };
 
 export default function App() {
   const { showForm } = useLoaderData<typeof loader>();
 
   return (
     <div className={styles.page}>
       <header className={styles.hero}>
         <div className={styles.heroContent}>
           <h1 className={styles.heading}>Upsellity AI for High-Converting Shopify Carts</h1>
           <p className={styles.text}>
             Turn every cart into a personalized shopping experience. Upsellity AI combines
             real-time cart intelligence, AI recommendations, and proven merchandising
             tactics to lift average order value without hurting conversion.
           </p>
           {showForm && (
             <Form className={styles.form} method="post" action="/auth/login">
               <label className={styles.label}>
                 <span>Shop domain</span>
                 <input
                   className={styles.input}
                   type="text"
                   name="shop"
                   placeholder="my-shop.myshopify.com"
                   aria-label="Shop domain"
                 />
                 <span className={styles.helpText}>Install Upsellity AI on your Shopify store</span>
               </label>
               <button className={styles.button} type="submit">
                 Log in
               </button>
             </Form>
           )}
         </div>
         <ul className={styles.featureList}>
           <li>
             <strong>AI Upsell Engine</strong>
             <span>Blend manual rules with AI-powered suggestions that learn from customer behavior.</span>
           </li>
           <li>
             <strong>Cart Drawer Customization</strong>
             <span>Control banners, motivators, and progress bars to match your brand.</span>
           </li>
           <li>
             <strong>Performance Analytics</strong>
             <span>Track conversions, order value lift, and campaign impact in real time.</span>
           </li>
           <li>
             <strong>No-Code Setup</strong>
             <span>Install in minutes with guided onboarding and theme app extensions.</span>
           </li>
         </ul>
       </header>
 
       <section className={styles.section}>
         <h2>Product Tour</h2>
         <div className={styles.screenshotGrid}>
           <figure>
             <img src="https://via.placeholder.com/720x420?text=Cart+Drawer+Preview" alt="Upsellity AI cart drawer preview" />
             <figcaption>Preview and launch a fully branded cart drawer in real time.</figcaption>
           </figure>
           <figure>
             <img src="https://via.placeholder.com/720x420?text=AI+Recommendations" alt="AI recommendation settings" />
             <figcaption>Configure hybrid upsell logic with manual rules and Shopify recommendations.</figcaption>
           </figure>
           <figure>
             <img src="https://via.placeholder.com/720x420?text=Performance+Dashboard" alt="Performance analytics dashboard" />
             <figcaption>Monitor campaigns, AOV lift, and customer engagement at a glance.</figcaption>
           </figure>
         </div>
       </section>
 
       <section className={styles.section}>
         <h2>Support &amp; Success</h2>
         <div className={styles.supportGrid}>
           <div>
             <h3>We are here to help</h3>
             <p>
               Reach our merchant success team any time at <a href="mailto:support@upsellity.ai">support@upsellity.ai</a> or
               schedule a strategy session to plan your upsell funnels.
             </p>
           </div>
           <div>
             <h3>Documentation</h3>
             <p>
               Visit our help center for implementation guides, theme setup tutorials, and best practices for AI
               merchandising.
             </p>
             <a className={styles.linkButton} href="https://upsellity.ai/help" target="_blank" rel="noreferrer">
               Explore documentation
             </a>
           </div>
           <div>
             <h3>Compliance</h3>
             <p>
               Upsellity AI is GDPR-ready and responds to all Shopify privacy webhooks. Review our
               <Link to="/privacy-policy">Privacy Policy</Link> and <Link to="/terms-of-service">Terms of Service</Link> for details.
             </p>
           </div>
         </div>
       </section>
 
       <footer className={styles.footer}>
         <p>
           &copy; {new Date().getFullYear()} Upsellity AI. <Link to="/privacy-policy">Privacy Policy</Link> ·
           <Link to="/terms-of-service"> Terms of Service</Link> · <a href="mailto:support@upsellity.ai">Support</a>
         </p>
       </footer>
     </div>
   );
 }
