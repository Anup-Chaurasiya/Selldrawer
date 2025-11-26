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
  Checkbox,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { MilestonesWidget } from "../components/shared/MilestonesWidget";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Get cart drawer configuration
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      milestones: {
        include: {
          targets: true,
        },
        orderBy: { priority: 'asc' },
      },
    },
  });

  if (!cartDrawer) {
    cartDrawer = await prisma.cartDrawer.create({
      data: { shop },
      include: {
        milestones: {
          include: {
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
              productsCount
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
          productsCount: collection.productsCount || 0
        };
      });
    }
  } catch (error) {
    console.error('Error fetching collections:', error);
  }

  return json({ cartDrawer, shopProducts, shopCollections });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Get or create cart drawer
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop }
  });

  if (!cartDrawer) {
    cartDrawer = await prisma.cartDrawer.create({
      data: { shop }
    });
  }

  if (intent === "add-milestone") {
    // Check if maximum milestones reached
    const existingMilestones = await prisma.cartMilestone.count({
      where: { cartDrawerId: cartDrawer.id }
    });

    if (existingMilestones >= 3) {
      return json({ error: "Maximum 3 milestones allowed" }, { status: 400 });
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const targetAmount = parseFloat(formData.get("targetAmount") as string);
    const rewardType = formData.get("rewardType") as string;
    const rewardValue = formData.get("rewardValue") ? parseFloat(formData.get("rewardValue") as string) : null;
    const targetType = formData.get("targetType") as string;
    const icon = formData.get("icon") as string;
    const unlockedMessage = formData.get("unlockedMessage") as string;
    const inProgressMessage = formData.get("inProgressMessage") as string;
    const lockedMessage = formData.get("lockedMessage") as string;
    const showProgressBar = formData.get("showProgressBar") === "true";
    const backgroundColor = formData.get("backgroundColor") as string;
    const textColor = formData.get("textColor") as string;
    const progressBarColor = formData.get("progressBarColor") as string;
    const unlockedColor = formData.get("unlockedColor") as string;
    const lockedColor = formData.get("lockedColor") as string;

    // Get the highest priority and add 1
    const highestPriority = await prisma.cartMilestone.findFirst({
      where: { cartDrawerId: cartDrawer.id },
      orderBy: { priority: 'desc' },
      select: { priority: true }
    });

    const priority = (highestPriority?.priority || 0) + 1;

    const milestone = await prisma.cartMilestone.create({
      data: {
        cartDrawerId: cartDrawer.id,
        shop,
        title,
        description,
        targetAmount,
        rewardType,
        rewardValue,
        targetType,
        priority,
        icon,
        unlockedMessage,
        inProgressMessage,
        lockedMessage,
        showProgressBar,
        backgroundColor,
        textColor,
        progressBarColor,
        unlockedColor,
        lockedColor,
      }
    });

    // Add targets if applicable
    if (targetType !== "store_wide") {
      const targetsJson = formData.get("targets") as string;
      if (targetsJson) {
        const targets = JSON.parse(targetsJson);
        for (const target of targets) {
          await prisma.cartMilestoneTarget.create({
            data: {
              milestoneId: milestone.id,
              targetType: target.type,
              shopifyId: target.shopifyId,
              title: target.title,
            }
          });
        }
      }
    }

    return json({ success: true });
  }

  if (intent === "update-milestone") {
    const milestoneId = formData.get("milestoneId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const targetAmount = parseFloat(formData.get("targetAmount") as string);
    const rewardType = formData.get("rewardType") as string;
    const rewardValue = formData.get("rewardValue") ? parseFloat(formData.get("rewardValue") as string) : null;
    const targetType = formData.get("targetType") as string;
    const icon = formData.get("icon") as string;
    const unlockedMessage = formData.get("unlockedMessage") as string;
    const inProgressMessage = formData.get("inProgressMessage") as string;
    const lockedMessage = formData.get("lockedMessage") as string;
    const showProgressBar = formData.get("showProgressBar") === "true";
    const backgroundColor = formData.get("backgroundColor") as string;
    const textColor = formData.get("textColor") as string;
    const progressBarColor = formData.get("progressBarColor") as string;
    const unlockedColor = formData.get("unlockedColor") as string;
    const lockedColor = formData.get("lockedColor") as string;

    await prisma.cartMilestone.update({
      where: { id: milestoneId },
      data: {
        title,
        description,
        targetAmount,
        rewardType,
        rewardValue,
        targetType,
        icon,
        unlockedMessage,
        inProgressMessage,
        lockedMessage,
        showProgressBar,
        backgroundColor,
        textColor,
        progressBarColor,
        unlockedColor,
        lockedColor,
      }
    });

    // Update targets
    await prisma.cartMilestoneTarget.deleteMany({
      where: { milestoneId }
    });

    if (targetType !== "store_wide") {
      const targetsJson = formData.get("targets") as string;
      if (targetsJson) {
        const targets = JSON.parse(targetsJson);
        for (const target of targets) {
          await prisma.cartMilestoneTarget.create({
            data: {
              milestoneId,
              targetType: target.type,
              shopifyId: target.shopifyId,
              title: target.title,
            }
          });
        }
      }
    }

    return json({ success: true });
  }

  if (intent === "delete-milestone") {
    const milestoneId = formData.get("milestoneId") as string;
    await prisma.cartMilestone.delete({
      where: { id: milestoneId }
    });
    return json({ success: true });
  }

  if (intent === "toggle-milestone") {
    const milestoneId = formData.get("milestoneId") as string;
    const isActive = formData.get("isActive") === "true";
    await prisma.cartMilestone.update({
      where: { id: milestoneId },
      data: { isActive }
    });
    return json({ success: true });
  }

  if (intent === "reorder-milestones") {
    const orderJson = formData.get("order") as string;
    const order = JSON.parse(orderJson);
    
    for (let i = 0; i < order.length; i++) {
      await prisma.cartMilestone.update({
        where: { id: order[i] },
        data: { priority: i }
      });
    }
    
    return json({ success: true });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function CartMilestones() {
  const { cartDrawer, shopProducts, shopCollections } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any>(null);
  const [livePreviewMilestone, setLivePreviewMilestone] = useState<any>(null);

  // Check if we've reached the maximum of 3 milestones
  const hasReachedMaxMilestones = cartDrawer.milestones && cartDrawer.milestones.length >= 3;

  const [formState, setFormState] = useState({
    title: "",
    description: "",
    targetAmount: "",
    rewardType: "free_shipping",
    rewardValue: "",
    targetType: "store_wide",
    icon: "🎁",
    unlockedMessage: "🎉 You've unlocked {reward}!",
    inProgressMessage: "Only {remaining} away from {reward}!",
    lockedMessage: "Add {remaining} to unlock {reward}",
    showProgressBar: true,
    backgroundColor: "#f0f9ff",
    textColor: "#1e40af",
    progressBarColor: "#3b82f6",
    unlockedColor: "#10b981",
    lockedColor: "#9ca3af",
  });

  const [selectedTargets, setSelectedTargets] = useState<any[]>([]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetTab, setTargetTab] = useState<"product" | "collection">("product");
  const [searchQuery, setSearchQuery] = useState("");

  const handleOpenModal = useCallback((milestone?: any) => {
    if (milestone) {
      setEditingMilestone(milestone);
      const initialState = {
        title: milestone.title,
        description: milestone.description || "",
        targetAmount: milestone.targetAmount.toString(),
        rewardType: milestone.rewardType,
        rewardValue: milestone.rewardValue?.toString() || "",
        targetType: milestone.targetType,
        icon: milestone.icon || "🎁",
        unlockedMessage: milestone.unlockedMessage || "🎉 You've unlocked {reward}!",
        inProgressMessage: milestone.inProgressMessage || "Only {remaining} away from {reward}!",
        lockedMessage: milestone.lockedMessage || "Add {remaining} to unlock {reward}",
        showProgressBar: milestone.showProgressBar,
        backgroundColor: milestone.backgroundColor,
        textColor: milestone.textColor,
        progressBarColor: milestone.progressBarColor,
        unlockedColor: milestone.unlockedColor,
        lockedColor: milestone.lockedColor,
      };
      setFormState(initialState);
      setSelectedTargets(milestone.targets || []);
      setLivePreviewMilestone(initialState);
    } else {
      setEditingMilestone(null);
      const initialState = {
        title: "",
        description: "",
        targetAmount: "",
        rewardType: "free_shipping",
        rewardValue: "",
        targetType: "store_wide",
        icon: "🎁",
        unlockedMessage: "🎉 You've unlocked {reward}!",
        inProgressMessage: "Only {remaining} away from {reward}!",
        lockedMessage: "Add {remaining} to unlock {reward}",
        showProgressBar: true,
        backgroundColor: "#f0f9ff",
        textColor: "#1e40af",
        progressBarColor: "#3b82f6",
        unlockedColor: "#10b981",
        lockedColor: "#9ca3af",
      };
      setFormState(initialState);
      setSelectedTargets([]);
      setLivePreviewMilestone(initialState);
    }
    setShowMilestoneModal(true);
  }, []);

  // Helper to update form state and live preview together
  const updateFormState = useCallback((updates: Partial<typeof formState>) => {
    setFormState(prev => {
      const newState = { ...prev, ...updates };
      setLivePreviewMilestone(newState);
      return newState;
    });
  }, []);

  const handleSaveMilestone = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", editingMilestone ? "update-milestone" : "add-milestone");
    
    if (editingMilestone) {
      formData.append("milestoneId", editingMilestone.id);
    }

    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    if (formState.targetType !== "store_wide") {
      formData.append("targets", JSON.stringify(selectedTargets));
    }

    submit(formData, { method: "post" });
    setShowMilestoneModal(false);
  }, [formState, selectedTargets, editingMilestone, submit]);

  const handleDeleteMilestone = useCallback((milestoneId: string) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      const formData = new FormData();
      formData.append("intent", "delete-milestone");
      formData.append("milestoneId", milestoneId);
      submit(formData, { method: "post" });
    }
  }, [submit]);

  const handleToggleMilestone = useCallback((milestoneId: string, isActive: boolean) => {
    const formData = new FormData();
    formData.append("intent", "toggle-milestone");
    formData.append("milestoneId", milestoneId);
    formData.append("isActive", (!isActive).toString());
    submit(formData, { method: "post" });
  }, [submit]);

  const getRewardTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      free_shipping: "Free Shipping",
      discount_percentage: "Percentage Discount",
      discount_fixed: "Fixed Discount",
      gift_wrapping: "Gift Wrapping",
      premium_gift: "Premium Gift",
      custom: "Custom Reward",
    };
    return labels[type] || type;
  };

  const getFilteredProducts = () => {
    return shopProducts.filter((product: any) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredCollections = () => {
    return shopCollections.filter((collection: any) =>
      collection.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Generate preview milestones
  const getPreviewMilestones = () => {
    // If modal is open and we have live preview data, show it
    if (showMilestoneModal && livePreviewMilestone && livePreviewMilestone.title && livePreviewMilestone.targetAmount) {
      const sampleCartTotal = 6000;
      const targetAmount = parseFloat(livePreviewMilestone.targetAmount) || 0;
      
      if (targetAmount > 0) {
        const progress = Math.min((sampleCartTotal / targetAmount) * 100, 100);
        const remaining = Math.max(targetAmount - sampleCartTotal, 0);
        const status = sampleCartTotal >= targetAmount ? 'unlocked' : sampleCartTotal > 0 ? 'in_progress' : 'locked';
        
        const rewardText = livePreviewMilestone.title;
        const remainingFormatted = `₹${remaining.toFixed(2)}`;
        
        const message =
          status === 'unlocked'
            ? livePreviewMilestone.unlockedMessage?.replace('{reward}', rewardText) || `🎉 You've unlocked ${rewardText}!`
            : status === 'in_progress'
            ? livePreviewMilestone.inProgressMessage?.replace('{remaining}', remainingFormatted).replace('{reward}', rewardText) || `Only ${remainingFormatted} away from ${rewardText}!`
            : livePreviewMilestone.lockedMessage?.replace('{remaining}', remainingFormatted).replace('{reward}', rewardText) || `Add ${remainingFormatted} to unlock ${rewardText}`;

        return [{
          id: 'live-preview',
          title: livePreviewMilestone.title,
          description: livePreviewMilestone.description,
          targetAmount,
          rewardType: livePreviewMilestone.rewardType,
          rewardValue: livePreviewMilestone.rewardValue ? parseFloat(livePreviewMilestone.rewardValue) : null,
          icon: livePreviewMilestone.icon,
          status,
          progress,
          remaining,
          message,
          showProgressBar: livePreviewMilestone.showProgressBar,
          backgroundColor: livePreviewMilestone.backgroundColor,
          textColor: livePreviewMilestone.textColor,
          progressBarColor: livePreviewMilestone.progressBarColor,
          unlockedColor: livePreviewMilestone.unlockedColor,
          lockedColor: livePreviewMilestone.lockedColor,
        }];
      }
    }
    
    if (cartDrawer.milestones && cartDrawer.milestones.length > 0) {
      // Use actual milestones for preview
      const sampleCartTotal = 6000; // Sample cart value for preview
      
      return cartDrawer.milestones.map((m: any) => {
        const targetAmount = parseFloat(m.targetAmount.toString());
        const progress = Math.min((sampleCartTotal / targetAmount) * 100, 100);
        const remaining = Math.max(targetAmount - sampleCartTotal, 0);
        const status = sampleCartTotal >= targetAmount ? 'unlocked' : sampleCartTotal > 0 ? 'in_progress' : 'locked';
        
        const rewardText = m.title;
        const remainingFormatted = `₹${remaining.toFixed(2)}`;
        
        const message =
          status === 'unlocked'
            ? m.unlockedMessage?.replace('{reward}', rewardText) || `🎉 You've unlocked ${rewardText}!`
            : status === 'in_progress'
            ? m.inProgressMessage?.replace('{remaining}', remainingFormatted).replace('{reward}', rewardText) || `Only ${remainingFormatted} away from ${rewardText}!`
            : m.lockedMessage?.replace('{remaining}', remainingFormatted).replace('{reward}', rewardText) || `Add ${remainingFormatted} to unlock ${rewardText}`;

        return {
          id: m.id,
          title: m.title,
          description: m.description,
          targetAmount,
          rewardType: m.rewardType,
          rewardValue: m.rewardValue ? parseFloat(m.rewardValue.toString()) : null,
          icon: m.icon,
          status,
          progress,
          remaining,
          message,
          showProgressBar: m.showProgressBar,
          backgroundColor: m.backgroundColor,
          textColor: m.textColor,
          progressBarColor: m.progressBarColor,
          unlockedColor: m.unlockedColor,
          lockedColor: m.lockedColor,
        };
      });
    }
    
    // Default sample milestones
    return [
      {
        id: 'sample-1',
        title: 'FREE Shipping',
        description: 'Get free shipping on your order',
        targetAmount: 5000,
        rewardType: 'free_shipping',
        rewardValue: null,
        icon: '🚚',
        status: 'unlocked' as const,
        progress: 100,
        remaining: 0,
        message: '🎉 You\'ve unlocked FREE Shipping!',
        showProgressBar: true,
        backgroundColor: '#f0f9ff',
        textColor: '#1e40af',
        progressBarColor: '#3b82f6',
        unlockedColor: '#10b981',
        lockedColor: '#9ca3af',
      },
      {
        id: 'sample-2',
        title: 'Extra 5% Discount',
        description: 'Save an additional 5% on your order',
        targetAmount: 8000,
        rewardType: 'discount_percentage',
        rewardValue: 5,
        icon: '💰',
        status: 'in_progress' as const,
        progress: 75,
        remaining: 2000,
        message: 'Only ₹2,000.00 away from Extra 5% Discount!',
        showProgressBar: true,
        backgroundColor: '#f0f9ff',
        textColor: '#1e40af',
        progressBarColor: '#3b82f6',
        unlockedColor: '#10b981',
        lockedColor: '#9ca3af',
      },
      {
        id: 'sample-3',
        title: 'Premium Gift',
        description: 'Receive a premium gift with your order',
        targetAmount: 12000,
        rewardType: 'premium_gift',
        rewardValue: null,
        icon: '🎁',
        status: 'locked' as const,
        progress: 50,
        remaining: 6000,
        message: 'Add ₹6,000.00 to unlock Premium Gift',
        showProgressBar: true,
        backgroundColor: '#f0f9ff',
        textColor: '#1e40af',
        progressBarColor: '#3b82f6',
        unlockedColor: '#10b981',
        lockedColor: '#9ca3af',
      },
    ];
  };

  const previewMilestones = getPreviewMilestones();

  return (
    <Page
      backAction={{ url: "/app/cart-drawer" }}
      title="Cart Milestones"
      primaryAction={{
        content: "Add Milestone",
        onAction: () => handleOpenModal(),
        disabled: hasReachedMaxMilestones,
      }}
    >
      <TitleBar title="Cart Milestones" />

      <Layout>
        <Layout.Section variant="oneHalf">
          <BlockStack gap="400">
            {/* Info Banner */}
            <Banner tone={hasReachedMaxMilestones ? "warning" : "info"}>
              <p>
                {hasReachedMaxMilestones ? (
                  <>
                    <strong>Maximum milestones reached!</strong> You can configure up to 3 milestones. 
                    Delete an existing milestone to add a new one.
                  </>
                ) : (
                  <>
                    Cart Milestones show customers rewards they can unlock by reaching specific cart values.
                    Create up to 3 milestones like "Free Shipping at ₹5,000" or "Extra 5% Discount at ₹8,000" to encourage higher cart values.
                    {cartDrawer.milestones && cartDrawer.milestones.length > 0 && (
                      <> ({3 - cartDrawer.milestones.length} remaining)</>
                    )}
                  </>
                )}
              </p>
            </Banner>

            {/* Milestones List */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Configured Milestones
                </Text>

                {cartDrawer.milestones && cartDrawer.milestones.length > 0 ? (
                  <ResourceList
                    resourceName={{ singular: 'milestone', plural: 'milestones' }}
                    items={cartDrawer.milestones}
                    renderItem={(milestone) => {
                      const { id, title, targetAmount, rewardType, rewardValue, isActive, icon, targetType, targets } = milestone;

                      return (
                        <ResourceItem
                          id={id}
                          accessibilityLabel={`View details for ${title}`}
                          onClick={() => {}}
                        >
                          <BlockStack gap="300">
                            <InlineStack align="space-between" blockAlign="center">
                              <InlineStack gap="300" blockAlign="center">
                                <div style={{
                                  fontSize: '32px',
                                  lineHeight: '1'
                                }}>
                                  {icon || '🎁'}
                                </div>
                                <BlockStack gap="100">
                                  <InlineStack gap="200" blockAlign="center">
                                    <Text as="h3" variant="headingMd">
                                      {title}
                                    </Text>
                                    <Badge tone={isActive ? "success" : "default"}>
                                      {isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </InlineStack>
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    Target: ₹{targetAmount.toString()} | Reward: {getRewardTypeLabel(rewardType)}
                                    {rewardValue && ` (${rewardValue}${rewardType.includes('percentage') ? '%' : ''})`}
                                  </Text>
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    Targeting: {targetType === 'store_wide' ? 'Store-wide' : 
                                              targetType === 'products' ? `${targets?.length || 0} products` :
                                              `${targets?.length || 0} collections`}
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                              <InlineStack gap="200">
                                <Button
                                  onClick={() => handleToggleMilestone(id, isActive)}
                                  variant="secondary"
                                >
                                  {isActive ? "Disable" : "Enable"}
                                </Button>
                                <Button
                                  onClick={() => handleOpenModal(milestone)}
                                  variant="primary"
                                >
                                  Edit
                                </Button>
                                <Button
                                  icon={DeleteIcon}
                                  variant="plain"
                                  tone="critical"
                                  onClick={() => handleDeleteMilestone(id)}
                                />
                              </InlineStack>
                            </InlineStack>
                          </BlockStack>
                        </ResourceItem>
                      );
                    }}
                  />
                ) : (
                  <EmptyState
                    heading="No milestones configured"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Add milestones to encourage customers to reach specific cart values for rewards.</p>
                  </EmptyState>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        {/* Preview Section */}
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text as="h3" variant="headingMd">
                  Preview
                </Text>
                <Badge tone={cartDrawer.milestones && cartDrawer.milestones.length > 0 ? 'success' : 'info'}>
                  {cartDrawer.milestones && cartDrawer.milestones.length > 0 
                    ? `${cartDrawer.milestones.length} milestone${cartDrawer.milestones.length > 1 ? 's' : ''}`
                    : 'Sample'}
                </Badge>
              </div>

              <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: '#fafbfc',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                minHeight: '400px',
              }}>
                <MilestonesWidget
                  milestones={previewMilestones}
                  cartTotal={6000}
                  isPreview={true}
                  layout="vertical"
                />
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}>
                <Text as="p" variant="bodySm">
                  <strong>💡 Preview Tip:</strong> {cartDrawer.milestones && cartDrawer.milestones.length > 0 
                    ? 'Showing your configured milestones with a sample cart value of ₹6,000. Add or edit milestones to see changes.'
                    : 'Configure milestones to see how they will appear in your cart drawer.'}
                </Text>
              </div>

              <Text as="p" variant="bodyMd" tone="subdued">
                This preview shows how milestones will appear in your cart drawer. The sample cart value is ₹6,000 for demonstration.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Add/Edit Milestone Modal */}
      <Modal
        open={showMilestoneModal}
        onClose={() => setShowMilestoneModal(false)}
        title={editingMilestone ? "Edit Milestone" : "Add Milestone"}
        primaryAction={{
          content: editingMilestone ? "Update" : "Add",
          onAction: handleSaveMilestone,
          loading: isSubmitting,
          disabled: !formState.title || !formState.targetAmount,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowMilestoneModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <FormLayout>
              <TextField
                label="Milestone Title"
                value={formState.title}
                onChange={(value) => updateFormState({ title: value })}
                placeholder="e.g., FREE Shipping"
                autoComplete="off"
                helpText="Short, catchy title for the milestone"
              />

              <TextField
                label="Description (Optional)"
                value={formState.description}
                onChange={(value) => updateFormState({ description: value })}
                placeholder="e.g., Get free shipping on your order"
                autoComplete="off"
                multiline={2}
              />

              <TextField
                label="Icon/Emoji"
                value={formState.icon}
                onChange={(value) => updateFormState({ icon: value })}
                placeholder="🎁"
                autoComplete="off"
                helpText="Emoji or icon to display with the milestone"
              />

              <TextField
                label="Target Amount (₹)"
                type="number"
                value={formState.targetAmount}
                onChange={(value) => updateFormState({ targetAmount: value })}
                placeholder="5000"
                autoComplete="off"
                helpText="Cart value required to unlock this milestone"
              />

              <Select
                label="Reward Type"
                options={[
                  { label: "Free Shipping", value: "free_shipping" },
                  { label: "Percentage Discount", value: "discount_percentage" },
                  { label: "Fixed Discount", value: "discount_fixed" },
                  { label: "Gift Wrapping", value: "gift_wrapping" },
                  { label: "Premium Gift", value: "premium_gift" },
                  { label: "Custom Reward", value: "custom" },
                ]}
                value={formState.rewardType}
                onChange={(value) => updateFormState({ rewardType: value })}
              />

              {(formState.rewardType === "discount_percentage" || formState.rewardType === "discount_fixed") && (
                <TextField
                  label={formState.rewardType === "discount_percentage" ? "Discount Percentage" : "Discount Amount (₹)"}
                  type="number"
                  value={formState.rewardValue}
                  onChange={(value) => updateFormState({ rewardValue: value })}
                  placeholder={formState.rewardType === "discount_percentage" ? "5" : "500"}
                  autoComplete="off"
                  suffix={formState.rewardType === "discount_percentage" ? "%" : "₹"}
                />
              )}

              <Divider />

              <Select
                label="Target Type"
                options={[
                  { label: "Store-wide (All Products)", value: "store_wide" },
                  { label: "Specific Products", value: "products" },
                  { label: "Specific Collections", value: "collections" },
                ]}
                value={formState.targetType}
                onChange={(value) => updateFormState({ targetType: value })}
                helpText="Choose which products this milestone applies to"
              />

              {formState.targetType !== "store_wide" && (
                <BlockStack gap="300">
                  <Button onClick={() => setShowTargetModal(true)} size="medium">
                    {selectedTargets.length > 0 ? 'Change Selection' : (formState.targetType === "products" ? "Select Products" : "Select Collections")}
                  </Button>
                  
                  {selectedTargets.length > 0 && (
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: '#f9fafb', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <Text as="p" variant="bodyMd" fontWeight="semibold" tone="subdued">
                        Selected {formState.targetType === "products" ? "Products" : "Collections"} ({selectedTargets.length})
                      </Text>
                      <div style={{ 
                        marginTop: '8px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '6px' 
                      }}>
                        {selectedTargets.map((target: any) => (
                          <div key={target.shopifyId} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            backgroundColor: '#ffffff',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb'
                          }}>
                            <Text as="span" variant="bodySm">
                              {target.title}
                            </Text>
                            <button
                              onClick={() => {
                                setSelectedTargets(selectedTargets.filter((t: any) => t.shopifyId !== target.shopifyId));
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '0 4px',
                                lineHeight: '1'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </BlockStack>
              )}

              <Divider />

              <TextField
                label="Unlocked Message"
                value={formState.unlockedMessage}
                onChange={(value) => updateFormState({ unlockedMessage: value })}
                placeholder="🎉 You've unlocked {reward}!"
                autoComplete="off"
                helpText="Message shown when milestone is reached. Use {reward} as placeholder."
              />

              <TextField
                label="In Progress Message"
                value={formState.inProgressMessage}
                onChange={(value) => updateFormState({ inProgressMessage: value })}
                placeholder="Only {remaining} away from {reward}!"
                autoComplete="off"
                helpText="Message shown when milestone is in progress. Use {remaining} and {reward} as placeholders."
              />

              <TextField
                label="Locked Message"
                value={formState.lockedMessage}
                onChange={(value) => updateFormState({ lockedMessage: value })}
                placeholder="Add {remaining} to unlock {reward}"
                autoComplete="off"
                helpText="Message shown when milestone is locked. Use {remaining} and {reward} as placeholders."
              />

              <Divider />

              <Text as="h3" variant="headingMd">
                Styling
              </Text>

              <Checkbox
                label="Show Progress Bar"
                checked={formState.showProgressBar}
                onChange={(value) => updateFormState({ showProgressBar: value })}
              />

              <InlineStack gap="400">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Background Color"
                    value={formState.backgroundColor}
                    onChange={(value) => updateFormState({ backgroundColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Text Color"
                    value={formState.textColor}
                    onChange={(value) => updateFormState({ textColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                  />
                </div>
              </InlineStack>

              <InlineStack gap="400">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Progress Bar Color"
                    value={formState.progressBarColor}
                    onChange={(value) => updateFormState({ progressBarColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Unlocked Color"
                    value={formState.unlockedColor}
                    onChange={(value) => updateFormState({ unlockedColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                  />
                </div>
              </InlineStack>

              <TextField
                label="Locked Color"
                value={formState.lockedColor}
                onChange={(value) => updateFormState({ lockedColor: value })}
                autoComplete="off"
                {...({ type: "color" } as any)}
              />
            </FormLayout>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Target Selection Modal */}
      <Modal
        open={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        title={`Select ${formState.targetType === "products" ? "Products" : "Collections"}`}
        primaryAction={{
          content: "Done",
          onAction: () => setShowTargetModal(false),
        }}
        size="large"
      >
        <Modal.Section>
          <BlockStack gap="400">
            {formState.targetType === "products" && (
              <>
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
                        const isSelected = selectedTargets.some(t => t.shopifyId === product.shopifyProductId);
                        return (
                          <div
                            key={product.handle}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTargets(selectedTargets.filter(t => t.shopifyId !== product.shopifyProductId));
                              } else {
                                setSelectedTargets([...selectedTargets, {
                                  type: 'product',
                                  shopifyId: product.shopifyProductId,
                                  title: product.title
                                }]);
                              }
                            }}
                            style={{
                              border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '8px',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center'
                            }}
                          >
                            <img
                              src={product.images?.[0]?.src || "https://via.placeholder.com/40x40"}
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
                            <Checkbox
                              label=""
                              checked={isSelected}
                              onChange={() => {}}
                            />
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
              </>
            )}

            {formState.targetType === "collections" && (
              <>
                <TextField
                  label=""
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search collections..."
                  autoComplete="off"
                />

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {getFilteredCollections().length > 0 ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {getFilteredCollections().map((collection: any) => {
                        const isSelected = selectedTargets.some(t => t.shopifyId === collection.shopifyCollectionId);
                        return (
                          <div
                            key={collection.handle}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTargets(selectedTargets.filter(t => t.shopifyId !== collection.shopifyCollectionId));
                              } else {
                                setSelectedTargets([...selectedTargets, {
                                  type: 'collection',
                                  shopifyId: collection.shopifyCollectionId,
                                  title: collection.title
                                }]);
                              }
                            }}
                            style={{
                              border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '8px',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#e5e7eb',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px'
                            }}>
                              📁
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {collection.title}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {collection.productsCount} products
                              </div>
                            </div>
                            <Checkbox
                              label=""
                              checked={isSelected}
                              onChange={() => {}}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                      No collections found
                    </div>
                  )}
                </div>
              </>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

