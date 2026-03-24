import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  AppProvider as PolarisAppProvider,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField,
  Spinner,
} from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { login } from "../../shopify.server";

import { loginErrorMessage } from "./error.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return { errors: loginErrorMessage({} as any), polarisTranslations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("selldrawer-test.myshopify.com");
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const { errors } = actionData || loaderData;

  useEffect(() => {
    // Check if we're in an embedded context (iframe)
    const isEmbedded = window.self !== window.top;
    
    if (isEmbedded) {
      // Give embedded auth a moment to complete
      const timer = setTimeout(() => {
        setIsAuthenticating(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Not embedded, show form immediately
      setIsAuthenticating(false);
    }
  }, []);

  // Show loading spinner while authenticating in embedded context
  if (isAuthenticating) {
    return (
      <PolarisAppProvider i18n={loaderData.polarisTranslations}>
        <Page>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '200px' 
          }}>
            <Spinner accessibilityLabel="Authenticating" size="large" />
          </div>
        </Page>
      </PolarisAppProvider>
    );
  }

  return (
    <PolarisAppProvider i18n={loaderData.polarisTranslations}>
      <Page>
        <Card>
          <form method="post" target="_top">
            <FormLayout>
              <Text variant="headingMd" as="h2">
                Log in
              </Text>
              <TextField
                type="text"
                name="shop"
                label="Shop domain"
                helpText="example.myshopify.com"
                value={shop}
                onChange={setShop}
                autoComplete="on"
                error={errors.shop}
              />
              <Button submit>Log in</Button>
            </FormLayout>
          </form>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}
