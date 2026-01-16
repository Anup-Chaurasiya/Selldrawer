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
  ChoiceList,
  Icon,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { MilestonesWidget } from "../components/shared/MilestonesWidget";
import { createMilestoneDiscount, updateMilestoneDiscount, deleteShopifyDiscount } from "../utils/shopify-discount.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const editingVersion = url.searchParams.get("version") || "default";

  // Get cart drawer configuration
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop_version: { shop, version: editingVersion } },
    include: {
      milestones: {
        include: {
          targets: true,
          giftProducts: {
            orderBy: { position: 'asc' },
          },
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
            giftProducts: {
              orderBy: { position: 'asc' },
            },
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
  const editingVersion = url.searchParams.get("version") || "default";

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Get or create cart drawer
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop_version: { shop, version: editingVersion } }
  });

  if (!cartDrawer) {
    cartDrawer = await prisma.cartDrawer.create({
      data: { shop }
    });
  }

  if (intent === "add-milestone") {
    try {
      // Check if maximum milestones reached
      const existingMilestones = await prisma.cartMilestone.count({
        where: { cartDrawerId: cartDrawer.id }
      });

      if (existingMilestones >= 3) {
        return json({ error: "Maximum 3 milestones allowed" }, { status: 400 });
      }

      const title = formData.get("title") as string;
      const targetAmount = parseFloat(formData.get("targetAmount") as string);
      const rewardType = formData.get("rewardType") as string;
      const rewardValue = formData.get("rewardValue") ? parseFloat(formData.get("rewardValue") as string) : null;
      const targetType = "store_wide"; // Always store_wide now
      const icon = formData.get("icon") as string;
      const unlockedMessage = formData.get("unlockedMessage") as string;
      const inProgressMessage = formData.get("inProgressMessage") as string;
      const showProgressBar = formData.get("showProgressBar") === "true";
      const iconColor = formData.get("iconColor") as string;
      const titleColor = formData.get("titleColor") as string;
      const unlockButtonColor = formData.get("unlockButtonColor") as string;

      // Parse gift products first (needed for discount creation)
      let giftProducts: any[] = [];
      if (rewardType === "gift_wrapping") {
        const giftProductsJson = formData.get("giftProducts") as string;

        if (giftProductsJson) {
          giftProducts = JSON.parse(giftProductsJson);
        }

        // Validate that at least one gift product is selected
        if (giftProducts.length === 0) {
          return json({ error: "Please select at least one gift product" }, { status: 400 });
        }
      }

      // Validate reward value for discount types
      if ((rewardType === "discount_percentage" || rewardType === "discount_fixed") && !rewardValue) {
        return json({ error: "Please enter a discount value" }, { status: 400 });
      }

      // Create Shopify discount automatically
      const discountResult = await createMilestoneDiscount(admin, {
        title,
        rewardType,
        rewardValue,
        giftProducts,
        minimumSubtotal: targetAmount, // Pass targetAmount as minimumSubtotal threshold
      });

      if (!discountResult) {
        return json({ error: "Failed to create Shopify discount. Please check your configuration and try again." }, { status: 500 });
      }

      // Get the highest priority and add 1
      const highestPriority = await prisma.cartMilestone.findFirst({
        where: { cartDrawerId: cartDrawer.id },
        orderBy: { priority: 'desc' },
        select: { priority: true }
      });

      const priority = (highestPriority?.priority || 0) + 1;

      // Parse eligibility fields
      const eligibleCollectionHandle = formData.get("eligibleCollectionHandle") as string | null;
      const eligibleTag = formData.get("eligibleTag") as string | null;
      const eligibleProductIdsJson = formData.get("eligibleProductIds") as string | null;
      let eligibleProductIds: string[] = [];
      if (eligibleProductIdsJson) {
        try {
          eligibleProductIds = JSON.parse(eligibleProductIdsJson);
        } catch (e) {
          console.error("Failed to parse eligibleProductIds:", e);
        }
      }

      const milestone = await prisma.cartMilestone.create({
        data: {
          cartDrawerId: cartDrawer.id,
          shop,
          title,
          targetAmount,
          rewardType,
          rewardValue,
          discountCode: discountResult.code,
          shopifyDiscountId: discountResult.discountId,
          targetType,
          priority,
          icon,
          unlockedMessage,
          inProgressMessage,
          showProgressBar,
          iconColor,
          titleColor,
          unlockButtonColor,
          eligibleCollectionHandle,
          eligibleTag,
          eligibleProductIds,
          eligibilitySource: formData.get("eligibilitySource") as string || 'none',
          upsellHeaderText: formData.get("upsellHeaderText") as string || "Unlock Your Reward",
          viewAllLinkText: formData.get("viewAllLinkText") as string || "View All",
          unlockButtonText: formData.get("unlockButtonText") as string || "Unlock Reward",
        } as any
      });

      // Add gift products if applicable
      if (rewardType === "gift_wrapping" && giftProducts.length > 0) {
        for (let i = 0; i < giftProducts.length; i++) {
          const product = giftProducts[i];
          await prisma.cartMilestoneGiftProduct.create({
            data: {
              milestoneId: milestone.id,
              shopifyProductId: product.shopifyProductId,
              shopifyVariantId: product.shopifyVariantId || null,
              title: product.title,
              price: product.price,
              compareAtPrice: product.compareAtPrice || null,
              imageUrl: product.imageUrl || null,
              handle: product.handle,
              position: i,
            }
          });
        }
      }

      return json({ success: true });
    } catch (error) {
      console.error("Error in add-milestone:", error);
      return json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 });
    }
  }

  if (intent === "update-milestone") {
    const milestoneId = formData.get("milestoneId") as string;
    const title = formData.get("title") as string;
    const targetAmount = parseFloat(formData.get("targetAmount") as string);
    const rewardType = formData.get("rewardType") as string;
    const rewardValue = formData.get("rewardValue") ? parseFloat(formData.get("rewardValue") as string) : null;
    const targetType = "store_wide"; // Always store_wide now
    const icon = formData.get("icon") as string;
    const unlockedMessage = formData.get("unlockedMessage") as string;
    const inProgressMessage = formData.get("inProgressMessage") as string;
    const showProgressBar = formData.get("showProgressBar") === "true";
    const iconColor = formData.get("iconColor") as string;
    const titleColor = formData.get("titleColor") as string;
    const unlockButtonColor = formData.get("unlockButtonColor") as string;

    // Get existing milestone to retrieve old discount ID
    const existingMilestone = await prisma.cartMilestone.findUnique({
      where: { id: milestoneId },
      select: { shopifyDiscountId: true } as any
    }) as { shopifyDiscountId: string | null } | null;

    // Parse gift products first (needed for discount creation)
    let giftProducts: any[] = [];
    if (rewardType === "gift_wrapping") {
      const giftProductsJson = formData.get("giftProducts") as string;

      if (giftProductsJson) {
        giftProducts = JSON.parse(giftProductsJson);
      }

      // Validate that at least one gift product is selected
      if (giftProducts.length === 0) {
        return json({ error: "Please select at least one gift product" }, { status: 400 });
      }
    }

    // Validate reward value for discount types
    if ((rewardType === "discount_percentage" || rewardType === "discount_fixed") && !rewardValue) {
      return json({ error: "Please enter a discount value" }, { status: 400 });
    }

    // Update Shopify discount (delete old, create new)
    const discountResult = await updateMilestoneDiscount(
      admin,
      existingMilestone?.shopifyDiscountId || null,
      {
        title,
        rewardType,
        rewardValue,
        giftProducts,
        minimumSubtotal: targetAmount, // Pass targetAmount as minimumSubtotal threshold
      }
    );

    if (!discountResult) {
      return json({ error: "Failed to update Shopify discount. Please check your configuration and try again." }, { status: 500 });
    }

    // Parse eligibility fields
    const eligibleCollectionHandle = formData.get("eligibleCollectionHandle") as string | null;
    const eligibleTag = formData.get("eligibleTag") as string | null;
    const eligibleProductIdsJson = formData.get("eligibleProductIds") as string | null;
    let eligibleProductIds: string[] = [];
    if (eligibleProductIdsJson) {
      try {
        eligibleProductIds = JSON.parse(eligibleProductIdsJson);
      } catch (e) {
        console.error("Failed to parse eligibleProductIds:", e);
      }
    }

    await prisma.cartMilestone.update({
      where: { id: milestoneId },
      data: {
        title,
        targetAmount,
        rewardType,
        rewardValue,
        discountCode: discountResult.code,
        shopifyDiscountId: discountResult.discountId,
        targetType,
        icon,
        unlockedMessage,
        inProgressMessage,
        showProgressBar,
        iconColor,
        titleColor,
        unlockButtonColor,
        eligibleCollectionHandle,
        eligibleTag,
        eligibleProductIds,
        eligibilitySource: formData.get("eligibilitySource") as string || 'none',
        upsellHeaderText: formData.get("upsellHeaderText") as string || "Unlock Your Reward",
        viewAllLinkText: formData.get("viewAllLinkText") as string || "View All",
        unlockButtonText: formData.get("unlockButtonText") as string || "Unlock Reward",
      } as any
    });

    // Update gift products
    await prisma.cartMilestoneGiftProduct.deleteMany({
      where: { milestoneId }
    });

    if (rewardType === "gift_wrapping" && giftProducts.length > 0) {
      for (let i = 0; i < giftProducts.length; i++) {
        const product = giftProducts[i];
        await prisma.cartMilestoneGiftProduct.create({
          data: {
            milestoneId,
            shopifyProductId: product.shopifyProductId,
            shopifyVariantId: product.shopifyVariantId || null,
            title: product.title,
            price: product.price,
            compareAtPrice: product.compareAtPrice || null,
            imageUrl: product.imageUrl || null,
            handle: product.handle,
            position: i,
          }
        });
      }
    }

    return json({ success: true });
  }

  if (intent === "delete-milestone") {
    const milestoneId = formData.get("milestoneId") as string;

    // Get milestone to retrieve discount ID
    const milestone = await prisma.cartMilestone.findUnique({
      where: { id: milestoneId },
      select: { shopifyDiscountId: true } as any
    }) as { shopifyDiscountId: string | null } | null;

    // Delete from Shopify if discount exists
    if (milestone?.shopifyDiscountId) {
      await deleteShopifyDiscount(admin, milestone.shopifyDiscountId);
    }

    // Delete from database
    await prisma.cartMilestone.delete({
      where: { id: milestoneId }
    });

    return json({ success: true });
  }

  if (intent === "toggle-milestone") {
    const milestoneId = formData.get("milestoneId") as string;
    const isActive = formData.get("isActive") === "true";

    // Get full milestone data including gift products
    const milestone = await prisma.cartMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        giftProducts: {
          orderBy: { position: 'asc' },
        },
      }
    });

    if (!milestone) {
      return json({ error: "Milestone not found" }, { status: 404 });
    }

    // If disabling milestone, delete the Shopify automatic discount
    if (!isActive && milestone.shopifyDiscountId) {
      await deleteShopifyDiscount(admin, milestone.shopifyDiscountId);
    }

    // If enabling milestone, create a new Shopify automatic discount
    if (isActive) {
      // Delete old discount if it exists (cleanup)
      if (milestone.shopifyDiscountId) {
        await deleteShopifyDiscount(admin, milestone.shopifyDiscountId);
      }

      // Create new discount with milestone configuration
      const discountResult = await createMilestoneDiscount(admin, {
        title: milestone.title,
        rewardType: milestone.rewardType,
        rewardValue: milestone.rewardValue ? parseFloat(milestone.rewardValue.toString()) : null,
        giftProducts: milestone.giftProducts.map((gp: any) => ({
          shopifyVariantId: gp.shopifyVariantId
        })),
        minimumSubtotal: parseFloat(milestone.targetAmount.toString()),
      });

      if (!discountResult) {
        return json({ error: "Failed to create Shopify discount when enabling milestone" }, { status: 500 });
      }

      // Update milestone with new discount ID and active status
      await prisma.cartMilestone.update({
        where: { id: milestoneId },
        data: {
          isActive: true,
          shopifyDiscountId: discountResult.discountId,
          discountCode: discountResult.code,
        }
      });
    } else {
      // Just update isActive to false
      await prisma.cartMilestone.update({
        where: { id: milestoneId },
        data: { isActive: false }
      });
    }

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

  if (intent === "update-progress-bar-color") {
    const progressBarColor = formData.get("progressBarColor") as string;
    await prisma.cartDrawer.update({
      where: { id: cartDrawer.id },
      data: { milestonesProgressBarColor: progressBarColor } as any
    });
    return json({ success: true });
  }

  if (intent === "update-all-unlocked-message") {
    const allUnlockedMessage = formData.get("allUnlockedMessage") as string;
    await prisma.cartDrawer.update({
      where: { id: cartDrawer.id },
      data: { milestonesAllUnlockedMessage: allUnlockedMessage } as any
    });
    return json({ success: true });
  }

  if (intent === "save-global-settings") {
    const progressBarColor = formData.get("progressBarColor") as string;
    const allUnlockedMessage = formData.get("allUnlockedMessage") as string;

    await prisma.cartDrawer.update({
      where: { id: cartDrawer.id },
      data: {
        milestonesProgressBarColor: progressBarColor,
        milestonesAllUnlockedMessage: allUnlockedMessage,
        milestonesEnabled: true, // Auto-enable when saving
      } as any
    });

    return redirect("/app/cart-drawer");
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
  const hasReachedMaxMilestones = cartDrawer?.milestones && cartDrawer.milestones.length >= 3;

  const [formState, setFormState] = useState({
    title: "",
    targetAmount: "",
    rewardType: "free_shipping",
    rewardValue: "",
    icon: "🎁",
    unlockedMessage: "🎉 You've unlocked {reward}!",
    inProgressMessage: "Only {remaining} away from {reward}!",
    showProgressBar: true,
    iconColor: "#3b82f6",
    titleColor: "#1e40af",
    unlockButtonColor: "#3b82f6",
    upsellHeaderText: "Unlock Your Reward",
    viewAllLinkText: "View All",
    unlockButtonText: "Unlock Reward",
  });

  const [selectedTargets, setSelectedTargets] = useState<any[]>([]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetTab, setTargetTab] = useState<"product" | "collection">("product");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGiftProducts, setSelectedGiftProducts] = useState<any[]>([]);
  const [showGiftProductModal, setShowGiftProductModal] = useState(false);
  const [editingGiftProductIndex, setEditingGiftProductIndex] = useState<number | null>(null);

  // Product eligibility state for upsell
  const [eligibilitySource, setEligibilitySource] = useState<'none' | 'collection' | 'products' | 'all_products'>('none');
  const [eligibleCollectionHandle, setEligibleCollectionHandle] = useState<string>('');
  const [eligibleProductIds, setEligibleProductIds] = useState<string[]>([]);
  const [eligibleTag, setEligibleTag] = useState<string>('');
  const [showEligibilityProductModal, setShowEligibilityProductModal] = useState(false);

  // Global settings state
  const [globalSettings, setGlobalSettings] = useState(() => ({
    progressBarColor: (cartDrawer as any)?.milestonesProgressBarColor || "#3b82f6",
    allUnlockedMessage: (cartDrawer as any)?.milestonesAllUnlockedMessage || "🎉 Congratulations! All rewards unlocked!",
  }));

  const handleOpenModal = useCallback((milestone?: any) => {
    if (milestone) {
      setEditingMilestone(milestone);
      const initialState = {
        title: milestone.title,
        targetAmount: milestone.targetAmount.toString(),
        rewardType: milestone.rewardType,
        rewardValue: milestone.rewardValue?.toString() || "",
        icon: milestone.icon || "🎁",
        unlockedMessage: milestone.unlockedMessage || "🎉 You've unlocked {reward}!",
        inProgressMessage: milestone.inProgressMessage || "Only {remaining} away from {reward}!",
        showProgressBar: milestone.showProgressBar,
        iconColor: milestone.iconColor || "#3b82f6",
        titleColor: milestone.titleColor || "#1e40af",
        unlockButtonColor: milestone.unlockButtonColor || "#3b82f6",
        upsellHeaderText: (milestone as any).upsellHeaderText || "Unlock Your Reward",
        viewAllLinkText: (milestone as any).viewAllLinkText || "View All",
        unlockButtonText: (milestone as any).unlockButtonText || "Unlock Reward",
      };
      setFormState(initialState);
      setSelectedTargets(milestone.targets || []);
      setSelectedGiftProducts(milestone.giftProducts || []);
      setLivePreviewMilestone(initialState);

      // Set eligibility fields
      // First, try to use the explicit eligibilitySource field if it exists
      const milestoneEligibilitySource = (milestone as any).eligibilitySource;

      if (milestoneEligibilitySource) {
        // Use the stored eligibilitySource value
        setEligibilitySource(milestoneEligibilitySource);

        // Set the corresponding fields based on the source
        if (milestoneEligibilitySource === 'collection') {
          setEligibleCollectionHandle((milestone as any).eligibleCollectionHandle || '');
        } else if (milestoneEligibilitySource === 'products') {
          setEligibleProductIds((milestone as any).eligibleProductIds || []);
        } else if (milestoneEligibilitySource === 'all_products') {
          setEligibleTag((milestone as any).eligibleTag || '');
        }
      } else {
        // Fallback: infer from fields for old milestones without eligibilitySource
        const hasCollection = Boolean((milestone as any).eligibleCollectionHandle);
        const hasProducts = Boolean((milestone as any).eligibleProductIds?.length > 0);
        const hasTag = Boolean((milestone as any).eligibleTag);

        if (hasCollection) {
          setEligibilitySource('collection');
          setEligibleCollectionHandle((milestone as any).eligibleCollectionHandle);
        } else if (hasProducts) {
          setEligibilitySource('products');
          setEligibleProductIds((milestone as any).eligibleProductIds);
        } else if (hasTag) {
          // Legacy support for tag - treat as all_products
          setEligibilitySource('all_products');
          setEligibleTag((milestone as any).eligibleTag);
        } else {
          setEligibilitySource('none');
        }
      }
    } else {
      setEditingMilestone(null);
      const initialState = {
        title: "",
        targetAmount: "",
        rewardType: "free_shipping",
        rewardValue: "",
        icon: "🎁",
        unlockedMessage: "🎉 You've unlocked {reward}!",
        inProgressMessage: "Only {remaining} away from {reward}!",
        showProgressBar: true,
        iconColor: "#3b82f6",
        titleColor: "#1e40af",
        unlockButtonColor: "#3b82f6",
        upsellHeaderText: "Unlock Your Reward",
        viewAllLinkText: "View All",
        unlockButtonText: "Unlock Reward",
      };
      setFormState(initialState);
      setSelectedTargets([]);
      setSelectedGiftProducts([]);
      setLivePreviewMilestone(initialState);

      // Reset eligibility fields
      setEligibilitySource('none');
      setEligibleCollectionHandle('');
      setEligibleProductIds([]);
      setEligibleTag('');
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

    if (formState.rewardType === "gift_wrapping") {
      formData.append("giftProducts", JSON.stringify(selectedGiftProducts));
    }

    // Add product eligibility fields based on selected source
    formData.append("eligibilitySource", eligibilitySource);
    if (eligibilitySource === 'collection' && eligibleCollectionHandle) {
      formData.append("eligibleCollectionHandle", eligibleCollectionHandle);
    } else if (eligibilitySource === 'products' && eligibleProductIds.length > 0) {
      formData.append("eligibleProductIds", JSON.stringify(eligibleProductIds));
    }
    // For 'all_products' and 'none', no specific eligibility data needed

    submit(formData, { method: "post" });
    setShowMilestoneModal(false);
  }, [formState, selectedTargets, selectedGiftProducts, editingMilestone, eligibilitySource, eligibleCollectionHandle, eligibleProductIds, eligibleTag, submit]);

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
      gift_wrapping: "Gift",
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
        const status: 'unlocked' | 'in_progress' | 'locked' = sampleCartTotal >= targetAmount ? 'unlocked' : sampleCartTotal > 0 ? 'in_progress' : 'locked';

        const rewardText = livePreviewMilestone.title;
        const remainingFormatted = `₹${remaining.toFixed(2)}`;

        const message =
          status === 'unlocked'
            ? livePreviewMilestone.unlockedMessage?.replace('{reward}', rewardText) || `🎉 You've unlocked ${rewardText}!`
            : status === 'in_progress'
              ? livePreviewMilestone.inProgressMessage?.replace('{remaining}', remainingFormatted).replace('{reward}', rewardText) || `Only ${remainingFormatted} away from ${rewardText}!`
              : `Add ${remainingFormatted} to unlock ${rewardText}`;

        return [{
          id: 'live-preview',
          title: livePreviewMilestone.title,
          targetAmount,
          rewardType: livePreviewMilestone.rewardType,
          rewardValue: livePreviewMilestone.rewardValue ? parseFloat(livePreviewMilestone.rewardValue) : null,
          icon: livePreviewMilestone.icon,
          status,
          progress,
          remaining,
          message,
          showProgressBar: livePreviewMilestone.showProgressBar,
          iconColor: livePreviewMilestone.iconColor || "#3b82f6",
          titleColor: livePreviewMilestone.titleColor || "#1e40af",
          unlockButtonColor: livePreviewMilestone.unlockButtonColor || "#3b82f6",
        }];
      }
    }

    if (cartDrawer.milestones && cartDrawer.milestones.length > 0) {
      // Use actual milestones for preview - only show active ones
      const sampleCartTotal = 6000; // Sample cart value for preview
      const activeMilestones = cartDrawer.milestones.filter((m: any) => m.isActive);

      return activeMilestones.map((m: any) => {
        const targetAmount = parseFloat(m.targetAmount.toString());
        const progress = Math.min((sampleCartTotal / targetAmount) * 100, 100);
        const remaining = Math.max(targetAmount - sampleCartTotal, 0);
        const status: 'unlocked' | 'in_progress' | 'locked' = sampleCartTotal >= targetAmount ? 'unlocked' : sampleCartTotal > 0 ? 'in_progress' : 'locked';

        const rewardText = m.title;
        const remainingFormatted = `₹${remaining.toFixed(2)}`;

        const message =
          status === 'unlocked'
            ? m.unlockedMessage?.replace('{reward}', rewardText) || `🎉 You've unlocked ${rewardText}!`
            : status === 'in_progress'
              ? m.inProgressMessage?.replace('{remaining}', remainingFormatted).replace('{reward}', rewardText) || `Only ${remainingFormatted} away from ${rewardText}!`
              : `Add ${remainingFormatted} to unlock ${rewardText}`;

        return {
          id: m.id,
          title: m.title,
          targetAmount,
          rewardType: m.rewardType,
          rewardValue: m.rewardValue ? parseFloat(m.rewardValue.toString()) : null,
          icon: m.icon,
          status,
          progress,
          remaining,
          message,
          showProgressBar: m.showProgressBar,
          iconColor: m.iconColor,
          titleColor: m.titleColor,
          unlockButtonColor: m.unlockButtonColor,
        };
      });
    }

    // Default sample milestones (when no milestones configured)
    return [
      {
        id: 'sample-1',
        title: 'FREE Shipping',
        targetAmount: 5000,
        rewardType: 'free_shipping',
        rewardValue: null,
        icon: '🚚',
        status: 'unlocked' as const,
        progress: 100,
        remaining: 0,
        message: '🎉 You\'ve unlocked FREE Shipping!',
        showProgressBar: true,
        iconColor: '#3b82f6',
        titleColor: '#1e40af',
        unlockButtonColor: '#3b82f6',
      },
      {
        id: 'sample-2',
        title: 'Extra 5% Discount',
        targetAmount: 8000,
        rewardType: 'discount_percentage',
        rewardValue: 5,
        icon: '💰',
        status: 'in_progress' as const,
        progress: 75,
        remaining: 2000,
        message: 'Only ₹2,000.00 away from Extra 5% Discount!',
        showProgressBar: true,
        iconColor: '#3b82f6',
        titleColor: '#1e40af',
        unlockButtonColor: '#3b82f6',
      },
      {
        id: 'sample-3',
        title: 'Premium Gift',
        targetAmount: 12000,
        rewardType: 'premium_gift',
        rewardValue: null,
        icon: '🎁',
        status: 'locked' as const,
        progress: 50,
        remaining: 6000,
        message: 'Add ₹6,000.00 to unlock Premium Gift',
        showProgressBar: true,
        iconColor: '#3b82f6',
        titleColor: '#1e40af',
        unlockButtonColor: '#3b82f6',
      },
    ];
  };

  const previewMilestones = getPreviewMilestones();

  const handleSaveGlobalSettings = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save-global-settings");
    formData.append("progressBarColor", globalSettings.progressBarColor);
    formData.append("allUnlockedMessage", globalSettings.allUnlockedMessage);
    submit(formData, { method: "post" });
  }, [globalSettings, submit]);

  return (
    <Page
      backAction={{ url: "/app/cart-drawer" }}
      title="Cart Milestones"
      primaryAction={{
        content: "Save",
        onAction: handleSaveGlobalSettings,
        loading: isSubmitting,
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

            {/* Global Milestones Configuration */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Global Milestones Settings
                </Text>
                <FormLayout>
                  <TextField
                    label="Progress Bar Color"
                    value={globalSettings.progressBarColor}
                    onChange={(value) => setGlobalSettings({ ...globalSettings, progressBarColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                    helpText="This color will be used for the progress bar across all milestones"
                  />
                  <TextField
                    label="All Unlocked Message"
                    value={globalSettings.allUnlockedMessage}
                    onChange={(value) => setGlobalSettings({ ...globalSettings, allUnlockedMessage: value })}
                    autoComplete="off"
                    helpText="Message shown when all milestones are unlocked"
                    placeholder="🎉 Congratulations! All rewards unlocked!"
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            {/* Milestones List */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Configured Milestones
                  </Text>
                  <Button
                    variant="primary"
                    onClick={() => handleOpenModal()}
                    disabled={hasReachedMaxMilestones}
                  >
                    Add Milestone
                  </Button>
                </InlineStack>

                {cartDrawer.milestones && cartDrawer.milestones.length > 0 ? (
                  <ResourceList
                    resourceName={{ singular: 'milestone', plural: 'milestones' }}
                    items={cartDrawer.milestones}
                    renderItem={(milestone) => {
                      const { id, title, targetAmount, rewardType, rewardValue, isActive, icon } = milestone;

                      return (
                        <ResourceItem
                          id={id}
                          accessibilityLabel={`View details for ${title}`}
                          onClick={() => { }}
                        >
                          <BlockStack gap="300">
                            <BlockStack gap="200">
                              <InlineStack gap="300" blockAlign="center">
                                <div style={{
                                  fontSize: '32px',
                                  lineHeight: '1'
                                }}>
                                  {icon || '🎁'}
                                </div>
                                <BlockStack gap="100">
                                  <InlineStack gap="150" blockAlign="center">
                                    <Text as="h3" variant="headingMd">
                                      {title}
                                    </Text>
                                    <Badge tone={isActive ? "success" : undefined}>
                                      {isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </InlineStack>
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    Target: ₹{targetAmount.toString()} | Reward: {getRewardTypeLabel(rewardType)}
                                    {rewardValue && ` (${rewardValue}${rewardType.includes('percentage') ? '%' : ''})`}
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                              <InlineStack gap="200" blockAlign="center">
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
                            </BlockStack>
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
                <Badge tone={(() => {
                  const activeMilestones = cartDrawer.milestones?.filter((m: any) => m.isActive) || [];
                  return activeMilestones.length > 0 ? 'success' : 'info';
                })()}>
                  {(() => {
                    const activeMilestones = cartDrawer.milestones?.filter((m: any) => m.isActive) || [];
                    return activeMilestones.length > 0
                      ? `${activeMilestones.length} milestone${activeMilestones.length > 1 ? 's' : ''}`
                      : 'Sample';
                  })()}
                </Badge>
              </div>

              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                minHeight: '200px',
              }}>
                <MilestonesWidget
                  milestones={previewMilestones}
                  cartTotal={6000}
                  isPreview={true}
                  layout="vertical"
                  progressBarColor={globalSettings.progressBarColor}
                  allUnlockedMessage={globalSettings.allUnlockedMessage}
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
          disabled: !formState.title || !formState.targetAmount ||
            (formState.rewardType === "gift_wrapping" && selectedGiftProducts.length === 0) ||
            ((formState.rewardType === "discount_percentage" || formState.rewardType === "discount_fixed") && !formState.rewardValue),
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
                  { label: "Gift", value: "gift_wrapping" },
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

              <Banner tone="info">
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    <strong>Auto-Generated Discount Code</strong>
                  </Text>
                  <Text as="p" variant="bodySm">
                    A unique discount code will be automatically created in your Shopify admin when you save this milestone.
                    The code format will be based on the reward type:
                  </Text>
                  <div style={{ paddingLeft: '16px' }}>
                    <Text as="p" variant="bodySm">• Free Shipping: <strong>FREESHIP...</strong></Text>
                    <Text as="p" variant="bodySm">• Percentage Discount: <strong>SAVE...</strong></Text>
                    <Text as="p" variant="bodySm">• Fixed Discount: <strong>OFF...</strong></Text>
                    <Text as="p" variant="bodySm">• Gift: <strong>GIFT...</strong></Text>
                  </div>
                  <Text as="p" variant="bodySm" tone="subdued">
                    The discount will be applied automatically at checkout when customers reach this milestone.
                  </Text>
                </BlockStack>
              </Banner>

              {formState.rewardType === "gift_wrapping" && (
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
                                  Change product
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
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

              <Divider />

              <Text as="h3" variant="headingMd">
                Milestone Colors
              </Text>

              <InlineStack gap="400">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Icon Circle Color"
                    value={formState.iconColor}
                    onChange={(value) => updateFormState({ iconColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                    helpText="Color of the milestone icon circle"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Title Color"
                    value={formState.titleColor}
                    onChange={(value) => updateFormState({ titleColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                    helpText="Color of the milestone title text"
                  />
                </div>
              </InlineStack>

              <TextField
                label="Unlock Button Color"
                value={formState.unlockButtonColor}
                onChange={(value) => updateFormState({ unlockButtonColor: value })}
                autoComplete="off"
                {...({ type: "color" } as any)}
                helpText="Color of the unlock button"
              />

              <Divider />

              <Text as="h3" variant="headingMd">
                Product Recommendations (Upsell)
              </Text>

              <Banner tone="info">
                <p>Configure which products customers can view to help them reach this milestone. When customers click the locked milestone badge, they'll see a carousel of recommended products.</p>
              </Banner>

              <ChoiceList
                title="Eligibility Source"
                choices={[
                  { label: 'Collection', value: 'collection' },
                  { label: 'Specific Products', value: 'products' },
                  { label: 'All Products', value: 'all_products' },
                  { label: 'None (No product recommendations)', value: 'none' },
                ]}
                selected={[eligibilitySource]}
                onChange={(selected: string[]) => {
                  setEligibilitySource(selected[0] as any);
                  // Reset other fields when changing source
                  if (selected[0] !== 'collection') setEligibleCollectionHandle('');
                  if (selected[0] !== 'products') setEligibleProductIds([]);
                  setEligibleTag(''); // Always reset tag as it's no longer used
                }}
              />

              {eligibilitySource === 'collection' && (
                <Select
                  label="Select Collection"
                  options={[
                    { label: 'Select a collection...', value: '' },
                    ...shopCollections.map((col: any) => ({
                      label: col.title,
                      value: col.handle,
                    })),
                  ]}
                  value={eligibleCollectionHandle}
                  onChange={setEligibleCollectionHandle}
                  helpText="Products from this collection will be recommended"
                />
              )}

              {eligibilitySource === 'products' && (
                <BlockStack gap="200">
                  <Button
                    onClick={() => setShowEligibilityProductModal(true)}
                    variant="secondary"
                  >
                    {eligibleProductIds.length > 0
                      ? `${eligibleProductIds.length} product(s) selected`
                      : 'Select products'}
                  </Button>
                  {eligibleProductIds.length > 0 && (
                    <Text as="p" variant="bodySm" tone="subdued">
                      {eligibleProductIds.length} product(s) will be recommended
                    </Text>
                  )}
                </BlockStack>
              )}


              {eligibilitySource !== 'none' && eligibilitySource !== 'all_products' && (
                <Banner tone="warning">
                  <p><strong>Priority:</strong> If multiple sources are configured, only the highest priority will be used: Collection → Specific Products</p>
                </Banner>
              )}

              <Divider />

              <Text as="h3" variant="headingMd">
                Upsell Text Customization
              </Text>

              <TextField
                label="Upsell Header Text"
                value={formState.upsellHeaderText}
                onChange={(value) => updateFormState({ upsellHeaderText: value })}
                placeholder="Unlock Your Reward"
                autoComplete="off"
                helpText="Header text shown in the product recommendations carousel"
              />

              <TextField
                label="View All Link Text"
                value={formState.viewAllLinkText}
                onChange={(value) => updateFormState({ viewAllLinkText: value })}
                placeholder="View All"
                autoComplete="off"
                helpText="Text for the 'View All' link in the recommendations carousel"
              />

              <TextField
                label="Unlock Button Text"
                value={formState.unlockButtonText}
                onChange={(value) => updateFormState({ unlockButtonText: value })}
                placeholder="Unlock Reward"
                autoComplete="off"
                helpText="Text displayed on the button below the milestone price"
              />
            </FormLayout>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Eligibility Product Selection Modal */}
      <Modal
        open={showEligibilityProductModal}
        onClose={() => setShowEligibilityProductModal(false)}
        title="Select Eligible Products"
        primaryAction={{
          content: "Done",
          onAction: () => setShowEligibilityProductModal(false),
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label="Search products"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by product name..."
              autoComplete="off"
              clearButton
              onClearButtonClick={() => setSearchQuery('')}
            />

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <BlockStack gap="200">
                {shopProducts
                  .filter((product: any) =>
                    product.title.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((product: any) => {
                    const productId = product.id.replace('gid://shopify/Product/', '');
                    const isSelected = eligibleProductIds.includes(productId);

                    return (
                      <div
                        key={product.id}
                        style={{
                          padding: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        }}
                        onClick={() => {
                          if (isSelected) {
                            setEligibleProductIds(eligibleProductIds.filter(id => id !== productId));
                          } else {
                            setEligibleProductIds([...eligibleProductIds, productId]);
                          }
                        }}
                      >
                        <InlineStack gap="300" align="start">
                          <Checkbox
                            label=""
                            checked={isSelected}
                            onChange={() => { }}
                          />
                          {product.featuredImage && (
                            <img
                              src={product.featuredImage.url}
                              alt={product.title}
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                              }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <Text as="p" variant="bodyMd" fontWeight="medium">
                              {product.title}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              ₹{product.variants?.[0]?.price || '0'}
                            </Text>
                          </div>
                        </InlineStack>
                      </div>
                    );
                  })}
              </BlockStack>
            </div>
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
    </Page>
  );
}

