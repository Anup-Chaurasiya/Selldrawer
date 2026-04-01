import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  BlockStack,
  Text,
  Select,
  InlineStack,
  Banner,
  Modal,
  ResourceList,
  ResourceItem,
  Badge,
  Divider,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { DeleteIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { FreeGiftSelector } from "../components/shared/FreeGiftSelector";
import { createMilestoneDiscount, updateMilestoneDiscount, deleteShopifyDiscount } from "../utils/shopify-discount.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);

  // Get cart drawer configuration
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      freeGifts: {
        include: {
          giftProducts: {
            orderBy: { position: 'asc' },
          },
          targets: true,
        },
        orderBy: { priority: 'asc' },
      },
    },
  });

  if (!cartDrawer) {
    cartDrawer = await prisma.cartDrawer.create({
      data: { 
        id: crypto.randomUUID(),
        shop, 
        updatedAt: new Date(),
      },
      include: {
        freeGifts: {
          include: {
            giftProducts: {
              orderBy: { position: 'asc' },
            },
            targets: true,
          },
          orderBy: { priority: 'asc' },
        },
      },
    });
  }

  // Fetch products from Shopify
  let shopProducts: any[] = [];
  let shopCollections: any[] = [];

  try {
    const response = await admin.graphql(`
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              status
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                  }
                }
              }
            }
          }
        }
      }
    `, {
      variables: { first: 100 }
    });

    const responseJson = await response.json();

    if (responseJson.data?.products?.edges) {
      shopProducts = responseJson.data.products.edges.map((edge: any) => {
        const product = edge.node;
        const image = product.images.edges[0]?.node;
        const variant = product.variants.edges[0]?.node;

        return {
          id: product.handle,
          shopifyProductId: product.id.replace('gid://shopify/Product/', ''),
          title: product.title,
          handle: product.handle,
          status: product.status.toLowerCase(),
          images: image ? [{ src: image.url, alt: image.altText }] : [],
          variants: variant ? [{
            id: variant.id.replace('gid://shopify/ProductVariant/', ''),
            price: variant.price,
          }] : []
        };
      });
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  // Fetch collections
  try {
    const collectionsResponse = await admin.graphql(`
      query getCollections($first: Int!) {
        collections(first: $first) {
          edges {
            node {
              id
              title
              handle
              productsCount {
                count
              }
            }
          }
        }
      }
    `, {
      variables: { first: 100 }
    });

    const collectionsJson = await collectionsResponse.json();

    if (collectionsJson.data?.collections?.edges) {
      shopCollections = collectionsJson.data.collections.edges.map((edge: any) => {
        const collection = edge.node;
        return {
          id: collection.handle,
          shopifyCollectionId: collection.id.replace('gid://shopify/Collection/', ''),
          title: collection.title,
          handle: collection.handle,
          productsCount: collection.productsCount?.count || 0
        };
      });
    }
  } catch (error) {
    console.error('Error fetching collections:', error);
  }

  return json({ cartDrawer, shopProducts, shopCollections });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Get or create cart drawer
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop }
  });

  if (!cartDrawer) {
    cartDrawer = await prisma.cartDrawer.create({
      data: { 
        id: crypto.randomUUID(),
        shop,
        updatedAt: new Date(),
      }
    });
  }

  if (intent === "add-free-gift") {
    try {
      const name = formData.get("name") as string;
      const triggerType = formData.get("triggerType") as string;

      // Parse trigger value for all trigger types
      const triggerValueRaw = formData.get("triggerValue") as string;
      const triggerValue = parseFloat(triggerValueRaw) || 0;

      const customerLimit = parseInt(formData.get("customerLimit") as string);

      // Parse gift products
      const giftProductsJson = formData.get("giftProducts") as string;
      let giftProducts: any[] = [];

      if (giftProductsJson) {
        giftProducts = JSON.parse(giftProductsJson);
      }

      // Validate that at least one gift product is selected
      if (giftProducts.length === 0) {
        return json({ error: "Please select at least one gift product" }, { status: 400 });
      }

      // Parse targets (for products/collections trigger types)
      const targetsJson = formData.get("targets") as string;
      let targets: any[] = [];
      if (targetsJson) {
        targets = JSON.parse(targetsJson);
      }

      // Create Shopify discount automatically (using gift_wrapping type)
      // Extract target IDs for products/collections trigger types
      const targetIds = targets.map((t: any) => t.shopifyId);

      const discountResult = await createMilestoneDiscount(admin, {
        title: `Free Gift: ${name}`,
        rewardType: "gift_wrapping",
        rewardValue: null,
        giftProducts,
        triggerType,
        triggerValue,
        targetIds: (triggerType === "products" || triggerType === "collections") ? targetIds : [],
      });

      if (!discountResult) {
        return json({ error: "Failed to create Shopify discount. Please check your configuration and try again." }, { status: 500 });
      }

      // Get the highest priority and add 1
      const highestPriority = await prisma.freeGift.findFirst({
        where: { cartDrawerId: cartDrawer.id },
        orderBy: { priority: 'desc' },
        select: { priority: true }
      });

      const priority = (highestPriority?.priority || 0) + 1;

      const freeGift = await prisma.freeGift.create({
        data: {
          id: crypto.randomUUID(),
          cartDrawerId: cartDrawer.id,
          shop,
          name,
          triggerType,
          triggerValue,
          customerLimit,
          shopifyDiscountId: discountResult.discountId,
          discountCode: discountResult.code,
          priority,
          updatedAt: new Date(),
        }
      });

      // Add gift products
      for (let i = 0; i < giftProducts.length; i++) {
        const product = giftProducts[i];
        await prisma.freeGiftProduct.create({
          data: {
            id: crypto.randomUUID(),
            freeGiftId: freeGift.id,
            shopifyProductId: product.shopifyProductId,
            shopifyVariantId: product.shopifyVariantId || null,
            title: product.title,
            price: product.price,
            compareAtPrice: product.compareAtPrice || null,
            imageUrl: product.imageUrl || null,
            handle: product.handle,
            position: i,
            updatedAt: new Date(),
          }
        });
      }

      // Add targets if applicable
      if (targets.length > 0) {
        for (const target of targets) {
          await prisma.freeGiftTarget.create({
            data: {
              id: crypto.randomUUID(),
              freeGiftId: freeGift.id,
              shopifyId: target.shopifyId,
              type: target.type,
              updatedAt: new Date(),
            }
          });
        }
      }

      return json({ success: true });
    } catch (error) {
      console.error("Error in add-free-gift:", error);
      return json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 });
    }
  }

  if (intent === "update-free-gift") {
    const freeGiftId = formData.get("freeGiftId") as string;
    const name = formData.get("name") as string;
    const triggerType = formData.get("triggerType") as string;

    // Parse trigger value for all trigger types
    const triggerValueRaw = formData.get("triggerValue") as string;
    const triggerValue = parseFloat(triggerValueRaw) || 0;

    const customerLimit = parseInt(formData.get("customerLimit") as string);

    // Get existing free gift to retrieve old discount ID
    const existingFreeGift = await prisma.freeGift.findUnique({
      where: { id: freeGiftId },
      select: { shopifyDiscountId: true }
    });

    // Parse gift products
    const giftProductsJson = formData.get("giftProducts") as string;
    let giftProducts: any[] = [];

    if (giftProductsJson) {
      giftProducts = JSON.parse(giftProductsJson);
    }

    // Validate that at least one gift product is selected
    if (giftProducts.length === 0) {
      return json({ error: "Please select at least one gift product" }, { status: 400 });
    }

    // Parse targets
    const targetsJson = formData.get("targets") as string;
    let targets: any[] = [];
    if (targetsJson) {
      targets = JSON.parse(targetsJson);
    }

    // Update Shopify discount (delete old, create new)
    // Extract target IDs for products/collections trigger types
    const targetIds = targets.map((t: any) => t.shopifyId);

    const discountResult = await updateMilestoneDiscount(
      admin,
      existingFreeGift?.shopifyDiscountId || null,
      {
        title: `Free Gift: ${name}`,
        rewardType: "gift_wrapping",
        rewardValue: null,
        giftProducts,
        triggerType,
        triggerValue,
        targetIds: (triggerType === "products" || triggerType === "collections") ? targetIds : [],
      }
    );

    if (!discountResult) {
      return json({ error: "Failed to update Shopify discount. Please check your configuration and try again." }, { status: 500 });
    }

    await prisma.freeGift.update({
      where: { id: freeGiftId },
      data: {
        name,
        triggerType,
        triggerValue,
        customerLimit,
        shopifyDiscountId: discountResult.discountId,
        discountCode: discountResult.code,
      }
    });

    // Update gift products
    await prisma.freeGiftProduct.deleteMany({
      where: { freeGiftId }
    });

    for (let i = 0; i < giftProducts.length; i++) {
      const product = giftProducts[i];
      await prisma.freeGiftProduct.create({
        data: {
          id: crypto.randomUUID(),
          freeGiftId,
          shopifyProductId: product.shopifyProductId,
          shopifyVariantId: product.shopifyVariantId || null,
          title: product.title,
          price: product.price,
          compareAtPrice: product.compareAtPrice || null,
          imageUrl: product.imageUrl || null,
          handle: product.handle,
          position: i,
          updatedAt: new Date(),
        }
      });
    }

    // Update targets
    await prisma.freeGiftTarget.deleteMany({
      where: { freeGiftId }
    });

    if (targets.length > 0) {
      for (const target of targets) {
        await prisma.freeGiftTarget.create({
          data: {
            id: crypto.randomUUID(),
            freeGiftId,
            shopifyId: target.shopifyId,
            type: target.type,
            updatedAt: new Date(),
          }
        });
      }
    }

    return json({ success: true });
  }

  if (intent === "delete-free-gift") {
    const freeGiftId = formData.get("freeGiftId") as string;

    // Get free gift to retrieve discount ID
    const freeGift = await prisma.freeGift.findUnique({
      where: { id: freeGiftId },
      select: { shopifyDiscountId: true }
    });

    // Delete from Shopify if discount exists
    if (freeGift?.shopifyDiscountId) {
      await deleteShopifyDiscount(admin, freeGift.shopifyDiscountId);
    }

    // Delete from database
    await prisma.freeGift.delete({
      where: { id: freeGiftId }
    });

    return json({ success: true });
  }

  if (intent === "toggle-free-gift") {
    const freeGiftId = formData.get("freeGiftId") as string;
    const isActive = formData.get("isActive") === "true";
    await prisma.freeGift.update({
      where: { id: freeGiftId },
      data: { isActive }
    });
    return json({ success: true });
  }

  if (intent === "enable-free-gifts") {
    await prisma.cartDrawer.update({
      where: { id: cartDrawer.id },
      data: { freeGiftsEnabled: true }
    });
    return redirect(`/app/cart-drawer`);
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function FreeGifts() {
  const { cartDrawer, shopProducts, shopCollections } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const [showModal, setShowModal] = useState(false);
  const [editingFreeGift, setEditingFreeGift] = useState<any>(null);

  const [formState, setFormState] = useState({
    name: "",
    triggerType: "spend",
    triggerValue: "",
    customerLimit: "1",
  });

  const [selectedGiftProducts, setSelectedGiftProducts] = useState<any[]>([]);
  const [showGiftProductModal, setShowGiftProductModal] = useState(false);
  const [editingGiftProductIndex, setEditingGiftProductIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<any[]>([]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetTab, setTargetTab] = useState<"product" | "collection">("product");

  const handleOpenModal = useCallback((freeGift?: any) => {
    if (freeGift) {
      setEditingFreeGift(freeGift);
      setFormState({
        name: freeGift.name,
        triggerType: freeGift.triggerType,
        triggerValue: freeGift.triggerValue.toString(),
        customerLimit: freeGift.customerLimit.toString(),
      });
      setSelectedGiftProducts(freeGift.giftProducts || []);
      setSelectedTargets(freeGift.targets || []);
    } else {
      setEditingFreeGift(null);
      setFormState({
        name: "",
        triggerType: "spend",
        triggerValue: "",
        customerLimit: "1",
      });
      setSelectedGiftProducts([]);
      setSelectedTargets([]);
    }
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", editingFreeGift ? "update-free-gift" : "add-free-gift");

    if (editingFreeGift) {
      formData.append("freeGiftId", editingFreeGift.id);
    }

    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    // Always set customerLimit to 1 (users can only choose one product)
    formData.set("customerLimit", "1");

    formData.append("giftProducts", JSON.stringify(selectedGiftProducts));
    formData.append("targets", JSON.stringify(selectedTargets));

    submit(formData, { method: "post", action: `/app/cart-drawer/free-gifts` });
    setShowModal(false);
  }, [formState, selectedGiftProducts, selectedTargets, editingFreeGift, submit]);

  const handleDelete = useCallback((freeGiftId: string) => {
    if (confirm("Are you sure you want to delete this free gift?")) {
      const formData = new FormData();
      formData.append("intent", "delete-free-gift");
      formData.append("freeGiftId", freeGiftId);
      submit(formData, { method: "post", action: `/app/cart-drawer/free-gifts` });
    }
  }, [submit]);

  const handleToggle = useCallback((freeGiftId: string, isActive: boolean) => {
    const formData = new FormData();
    formData.append("intent", "toggle-free-gift");
    formData.append("freeGiftId", freeGiftId);
    formData.append("isActive", (!isActive).toString());
    submit(formData, { method: "post", action: `/app/cart-drawer/free-gifts` });
  }, [submit]);

  const getFilteredProducts = () => {
    return shopProducts.filter((product: any) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      spend: "Minimum Spend",
      quantity: "Minimum Quantity",
      products: "Specific Products",
      collections: "Specific Collections",
    };
    return labels[type] || type;
  };

  // Generate preview data
  const getPreviewFreeGifts = () => {
    if (cartDrawer.freeGifts && cartDrawer.freeGifts.length > 0) {
      return cartDrawer.freeGifts
        .filter((fg: any) => fg.isActive)
        .map((fg: any) => ({
          id: fg.id,
          name: fg.name,
          triggerType: fg.triggerType,
          triggerValue: parseFloat(fg.triggerValue.toString()),
          customerLimit: fg.customerLimit,
          discountCode: fg.discountCode,
          giftProducts: fg.giftProducts.map((p: any) => ({
            id: p.id,
            shopifyProductId: p.shopifyProductId,
            shopifyVariantId: p.shopifyVariantId,
            title: p.title,
            price: 0, // Free gifts are always price 0 (discount applies at checkout)
            compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice.toString()) : parseFloat(p.price.toString()),
            imageUrl: p.imageUrl,
            handle: p.handle,
          })),
          qualified: true,
        }));
    }

    // Default sample
    return [{
      id: 'sample-1',
      name: 'Free Gift on ₹999+',
      triggerType: 'spend',
      triggerValue: 999,
      customerLimit: 1,
      giftProducts: [
        {
          id: 'sample-gift-1',
          title: 'Premium Keychain',
          price: 0,
          compareAtPrice: 299,
          imageUrl: null,
          handle: 'sample-1',
          shopifyProductId: '1',
          shopifyVariantId: '1',
        },
        {
          id: 'sample-gift-2',
          title: 'Branded Sticker Pack',
          price: 0,
          compareAtPrice: 199,
          imageUrl: null,
          handle: 'sample-2',
          shopifyProductId: '2',
          shopifyVariantId: '2',
        },
      ],
      qualified: true,
    }];
  };

  const previewFreeGifts = getPreviewFreeGifts();

  const handleEnableFreeGifts = () => {
    const formData = new FormData();
    formData.append("intent", "enable-free-gifts");
    submit(formData, { method: "post", action: `/app/cart-drawer/free-gifts` });
  };

  return (
    <Page
      backAction={{ url: `/app/cart-drawer` }}
      title="Free Gifts Configuration"
      primaryAction={{
        content: "Save changes",
        onAction: handleEnableFreeGifts,
        loading: isSubmitting,
      }}
    >
      <style>{`
        /* Premium UI CSS */
        .premium-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          margin-bottom: 20px;
        }
        .premium-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
          transform: translateY(-2px);
        }
        .premium-card-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f3f4f6;
          background: linear-gradient(to right, #f8fafc, #ffffff);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .premium-card-body {
          padding: 24px;
        }
        
        .icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #d97706;
          font-size: 20px;
        }

        .gift-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          background: #ffffff;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .gift-card:hover {
          box-shadow: 0 8px 12px -3px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
          transform: translateY(-2px);
        }
        .gift-card-active {
          border-left: 4px solid #10b981;
        }
        .gift-card-inactive {
          border-left: 4px solid #9ca3af;
          background: #f9fafb;
        }

        /* Custom Toggle Switch */
        .premium-toggle-label {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          margin: 0;
        }
        .premium-toggle-label input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .premium-toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #e2e8f0;
          transition: .3s;
          border-radius: 24px;
          border: 1px solid #cbd5e1;
        }
        .premium-toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: .3s cubic-bezier(0.4, 0.0, 0.2, 1);
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .premium-toggle-label input:checked + .premium-toggle-slider {
          background-color: #10b981;
          border-color: #10b981;
        }
        .premium-toggle-label input:checked + .premium-toggle-slider:before {
          transform: translateX(20px);
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
        }
        .status-badge.active {
          background-color: rgba(16, 185, 129, 0.1);
          color: #059669;
        }
        .status-badge.inactive {
          background-color: #e5e7eb;
          color: #6b7280;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.active {
          background-color: #10b981;
        }
        .status-dot.inactive {
          background-color: #9ca3af;
        }
      `}</style>

      <Layout>
        <Layout.Section variant="oneHalf">
          <div className="premium-card">
            <div className="premium-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="icon-circle">
                  🎁
                </div>
                <div>
                  <Text as="h2" variant="headingMd" fontWeight="bold">
                    Free Gift Offers
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Configure gifts customers can choose when conditions are met
                  </Text>
                </div>
              </div>
              <Button variant="primary" onClick={() => handleOpenModal()}>
                Add New Gift
              </Button>
            </div>

            <div className="premium-card-body" style={{ background: '#f8fafc' }}>
              {cartDrawer.freeGifts && cartDrawer.freeGifts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {cartDrawer.freeGifts.map((freeGift: any) => {
                    const { id, name, triggerType, triggerValue, customerLimit, isActive, giftProducts, targets } = freeGift;
                    return (
                      <div key={id} className={`gift-card ${isActive ? 'gift-card-active' : 'gift-card-inactive'}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <Text as="h3" variant="headingMd" fontWeight="semibold">
                                  {name}
                                </Text>
                                <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                                  <span className={`status-dot ${isActive ? 'active' : 'inactive'}`}></span>
                                  {isActive ? 'Active' : 'Disabled'}
                                </span>
                              </div>
                              <Text as="p" variant="bodySm" tone="subdued">
                                <strong>Trigger:</strong> {getTriggerTypeLabel(triggerType)}
                                {triggerType === "spend" && ` (₹${triggerValue.toString()})`}
                                {triggerType === "quantity" && ` (${triggerValue.toString()} items)`}
                                {triggerType === "products" && ` (${triggerValue.toString()} qty from ${targets?.length || 0} products)`}
                                {triggerType === "collections" && ` (${triggerValue.toString()} qty from ${targets?.length || 0} collections)`}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued" style={{ marginTop: '4px' }}>
                                <strong>Contains:</strong> {giftProducts.length} product{giftProducts.length > 1 ? 's' : ''} • Choose {customerLimit}
                              </Text>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label className="premium-toggle-label">
                              <input 
                                type="checkbox" 
                                checked={isActive} 
                                onChange={() => handleToggle(id, isActive)}
                                disabled={isSubmitting}
                              />
                              <span className="premium-toggle-slider"></span>
                            </label>
                            
                            <div style={{ display: 'flex', gap: '8px', borderLeft: '1px solid #e5e7eb', paddingLeft: '12px' }}>
                              <Button variant="secondary" onClick={() => handleOpenModal(freeGift)}>
                                Edit
                              </Button>
                              <Button variant="plain" tone="critical" onClick={() => handleDelete(id)}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  heading="No free gifts configured"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Add free gift offers to incentivize purchases and delight customers.</p>
                </EmptyState>
              )}
            </div>
          </div>
        </Layout.Section>

        {/* Preview Section */}
        <Layout.Section variant="oneHalf">
          <div className="premium-card">
            <div className="premium-card-header" style={{ padding: '16px 20px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text as="h3" variant="headingMd" fontWeight="medium">
                  Live Preview
                </Text>
                <Badge tone={previewFreeGifts.length > 0 ? 'success' : 'info'}>
                  {previewFreeGifts.length > 0 ? `${previewFreeGifts.length} offer${previewFreeGifts.length > 1 ? 's' : ''}` : 'Sample'}
                </Badge>
              </div>
            </div>
            <div className="premium-card-body" style={{ background: '#f1f5f9' }}>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}>
                <FreeGiftSelector
                  freeGifts={previewFreeGifts}
                  selectedGiftId={null}
                  onSelectGift={() => { }}
                  isPreview={true}
                />
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Text as="p" variant="bodySm" tone="subdued">
                  This preview shows how free gift offers will appear in your cart drawer.
                </Text>
              </div>
            </div>
          </div>
        </Layout.Section>
      </Layout>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingFreeGift ? "Edit Free Gift" : "Add Free Gift"}
        primaryAction={{
          content: editingFreeGift ? "Update" : "Add",
          onAction: handleSave,
          loading: isSubmitting,
          disabled: !formState.name ||
            !formState.triggerValue ||
            selectedGiftProducts.length === 0 ||
            ((formState.triggerType === "products" || formState.triggerType === "collections") && selectedTargets.length === 0),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <FormLayout>
              <TextField
                label="Gift Offer Name"
                value={formState.name}
                onChange={(value) => setFormState({ ...formState, name: value })}
                placeholder="e.g., Free Gift on ₹999+"
                autoComplete="off"
                helpText="Internal name for this free gift offer"
              />

              <Select
                label="Trigger Type"
                options={[
                  { label: "Minimum Spend", value: "spend" },
                  { label: "Minimum Quantity", value: "quantity" },
                  { label: "Specific Products", value: "products" },
                  { label: "Specific Collections", value: "collections" },
                ]}
                value={formState.triggerType}
                onChange={(value) => setFormState({ ...formState, triggerType: value, triggerValue: "" })}
              />

              {(formState.triggerType === "spend" || formState.triggerType === "quantity") && (
                <TextField
                  label={formState.triggerType === "spend" ? "Minimum Amount (₹)" : "Minimum Quantity"}
                  type="number"
                  value={formState.triggerValue}
                  onChange={(value) => setFormState({ ...formState, triggerValue: value })}
                  placeholder={formState.triggerType === "spend" ? "999" : "3"}
                  autoComplete="off"
                  helpText={formState.triggerType === "spend" ? "Cart value required to unlock gifts" : "Total items required to unlock gifts"}
                />
              )}

              {(formState.triggerType === "products" || formState.triggerType === "collections") && (
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    {formState.triggerType === "products" ? "Select Products" : "Select Collections"}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {formState.triggerType === "products"
                      ? "Choose which products must be in cart to unlock gifts"
                      : "Choose which collections must be in cart to unlock gifts"}
                  </Text>
                  {selectedTargets.length === 0 && (
                    <Banner tone="warning">
                      <p>Please select at least one {formState.triggerType === "products" ? "product" : "collection"} to continue.</p>
                    </Banner>
                  )}
                  <Button
                    onClick={() => {
                      setShowTargetModal(true);
                      setTargetTab(formState.triggerType === "products" ? "product" : "collection");
                    }}
                  >
                    {selectedTargets.length > 0
                      ? `${selectedTargets.length} selected - Change`
                      : `Select ${formState.triggerType === "products" ? "Products" : "Collections"}`}
                  </Button>
                  {selectedTargets.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedTargets.map((target, index) => (
                        <div key={index} style={{
                          padding: '8px 12px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '6px',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>{target.title || target.shopifyId}</span>
                          <button
                            onClick={() => {
                              setSelectedTargets(selectedTargets.filter((_, i) => i !== index));
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '16px',
                              color: '#6b7280'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <TextField
                    label="Required Quantity"
                    type="number"
                    value={formState.triggerValue}
                    onChange={(value) => setFormState({ ...formState, triggerValue: value })}
                    placeholder={formState.triggerType === "products" ? "2" : "3"}
                    autoComplete="off"
                    helpText={formState.triggerType === "products"
                      ? "Total quantity of selected products required in cart to unlock gifts"
                      : "Total quantity of items from selected collections required in cart to unlock gifts"}
                  />
                </BlockStack>
              )}

              <Divider />

              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingMd">
                    Gift Products (Required - Select up to 3)
                  </Text>
                  {selectedGiftProducts.length > 0 && (
                    <Badge tone="success">{`${selectedGiftProducts.length} selected`}</Badge>
                  )}
                </InlineStack>
                {selectedGiftProducts.length === 0 && (
                  <Banner tone="warning">
                    <p>Please select at least one gift product to continue.</p>
                  </Banner>
                )}
                {selectedGiftProducts.length > 1 && (
                  <Banner tone="info">
                    <p>If you configure more than one gift product, customers will be able to choose only one gift product from the selected items.</p>
                  </Banner>
                )}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px'
                }}>
                  {[0, 1, 2].map((index) => {
                    const giftProduct = selectedGiftProducts[index];
                    return (
                      <div key={index} style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: giftProduct ? '#ffffff' : '#f9fafb',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {giftProduct ? (
                          <>
                            <img
                              src={giftProduct.imageUrl || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png"}
                              alt={giftProduct.title}
                              style={{
                                width: '100px',
                                height: '100px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                marginBottom: '8px'
                              }}
                            />
                            <Text as="p" variant="bodySm" fontWeight="medium" alignment="center">
                              {giftProduct.title.length > 20
                                ? giftProduct.title.substring(0, 20) + '...'
                                : giftProduct.title}
                            </Text>
                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <Button
                                size="slim"
                                variant="secondary"
                                onClick={() => {
                                  setEditingGiftProductIndex(index);
                                  setShowGiftProductModal(true);
                                }}
                              >
                                Change product
                              </Button>
                              <Button
                                size="slim"
                                variant="plain"
                                tone="critical"
                                onClick={() => {
                                  const newGiftProducts = selectedGiftProducts.filter((_, i) => i !== index);
                                  setSelectedGiftProducts(newGiftProducts);
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{
                              width: '100px',
                              height: '100px',
                              backgroundColor: '#e5e7eb',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '8px',
                              fontSize: '32px'
                            }}>
                              🖼️
                            </div>
                            <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                              Not selected
                            </Text>
                            <div style={{ marginTop: '8px' }}>
                              <Button
                                size="slim"
                                variant="secondary"
                                onClick={() => {
                                  setEditingGiftProductIndex(index);
                                  setShowGiftProductModal(true);
                                }}
                              >
                                Select product
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </BlockStack>
            </FormLayout>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Gift Product Selection Modal */}
      <Modal
        open={showGiftProductModal}
        onClose={() => {
          setShowGiftProductModal(false);
          setEditingGiftProductIndex(null);
        }}
        title="Select Gift Product"
        primaryAction={{
          content: "Done",
          onAction: () => {
            setShowGiftProductModal(false);
            setEditingGiftProductIndex(null);
          },
        }}
        size="large"
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label=""
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search products..."
              autoComplete="off"
            />

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {getFilteredProducts().length > 0 ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {getFilteredProducts().map((product: any) => {
                    return (
                      <div
                        key={product.handle}
                        onClick={() => {
                          if (editingGiftProductIndex !== null) {
                            const newGiftProducts = [...selectedGiftProducts];
                            const productData = {
                              shopifyProductId: product.shopifyProductId,
                              shopifyVariantId: product.variants?.[0]?.id || null,
                              title: product.title,
                              price: parseFloat(product.variants?.[0]?.price || '0'),
                              compareAtPrice: null,
                              imageUrl: product.images?.[0]?.src || null,
                              handle: product.handle,
                            };

                            if (editingGiftProductIndex < newGiftProducts.length) {
                              newGiftProducts[editingGiftProductIndex] = productData;
                            } else {
                              newGiftProducts.push(productData);
                            }

                            // Limit to 3 products
                            setSelectedGiftProducts(newGiftProducts.slice(0, 3));
                            setShowGiftProductModal(false);
                            setEditingGiftProductIndex(null);
                          }
                        }}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '8px',
                          cursor: 'pointer',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.backgroundColor = '#f0f9ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }}
                      >
                        <img
                          src={product.images?.[0]?.src || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png"}
                          alt={product.title}
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            ₹{product.variants?.[0]?.price || '0.00'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                  No products found
                </div>
              )}
            </div>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Target Selection Modal (Products/Collections) */}
      <Modal
        open={showTargetModal}
        onClose={() => {
          setShowTargetModal(false);
        }}
        title={`Select ${targetTab === "product" ? "Products" : "Collections"}`}
        primaryAction={{
          content: "Done",
          onAction: () => {
            setShowTargetModal(false);
          },
        }}
        size="large"
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label=""
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${targetTab === "product" ? "products" : "collections"}...`}
              autoComplete="off"
            />

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {targetTab === "product" && getFilteredProducts().length > 0 ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {getFilteredProducts().map((product: any) => {
                    const isSelected = selectedTargets.some(t => t.shopifyId === product.shopifyProductId);

                    return (
                      <div
                        key={product.handle}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTargets(selectedTargets.filter(t => t.shopifyId !== product.shopifyProductId));
                          } else {
                            setSelectedTargets([...selectedTargets, {
                              shopifyId: product.shopifyProductId,
                              type: "product",
                              title: product.title,
                            }]);
                          }
                        }}
                        style={{
                          border: isSelected ? '2px solid #16a34a' : '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '8px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <img
                          src={product.images?.[0]?.src || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png"}
                          alt={product.title}
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            ₹{product.variants?.[0]?.price || '0.00'}
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : targetTab === "collection" && shopCollections.length > 0 ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {shopCollections
                    .filter((collection: any) =>
                      collection.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((collection: any) => {
                      const isSelected = selectedTargets.some(t => t.shopifyId === collection.shopifyCollectionId);

                      return (
                        <div
                          key={collection.handle}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTargets(selectedTargets.filter(t => t.shopifyId !== collection.shopifyCollectionId));
                            } else {
                              setSelectedTargets([...selectedTargets, {
                                shopifyId: collection.shopifyCollectionId,
                                type: "collection",
                                title: collection.title,
                              }]);
                            }
                          }}
                          style={{
                            border: isSelected ? '2px solid #16a34a' : '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '12px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '2px' }}>
                              {collection.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {collection.productsCount} products
                            </div>
                          </div>
                          {isSelected && (
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#16a34a',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: 'bold',
                            }}>
                              ✓
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                  No {targetTab === "product" ? "products" : "collections"} found
                </div>
              )}
            </div>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

