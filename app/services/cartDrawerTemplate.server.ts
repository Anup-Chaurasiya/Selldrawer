import prisma from '../db.server';

/**
 * Get template CartDrawer for a specific version
 * Returns the CartDrawer marked as template for this version
 */
export async function getTemplateForVersion(version: string) {
    const template = await prisma.cartDrawer.findFirst({
        where: {
            version,
            isTemplate: true,
        },
        include: {
            freeShippingBars: { where: { isActive: true } },
            promotionalBanners: {
                where: { isActive: true },
                include: {
                    images: { orderBy: { order: 'asc' } },
                    carouselSettings: true,
                },
            },
            productRecommendations: {
                where: { isActive: true },
                include: {
                    products: { orderBy: { position: 'asc' } },
                },
            },
            savingsDisplays: { where: { isActive: true } },
            freeShippingMessages: { where: { isActive: true } },
            cartTotals: { where: { isActive: true } },
            milestones: {
                where: { isActive: true },
                include: { targets: true },
                orderBy: { priority: 'asc' },
            },
            freeGifts: {
                where: { isActive: true },
                include: {
                    giftProducts: { orderBy: { position: 'asc' } },
                    targets: true,
                },
                orderBy: { priority: 'asc' },
            },
        },
    });

    return template;
}

/**
 * Copy template configuration to a new shop
 * Deep copies all related features and settings
 */
export async function copyTemplateToShop(shop: string, version: string) {
    // Get template
    const template = await getTemplateForVersion(version);

    if (!template) {
        console.log(`[Template] No template found for version: ${version}`);
        return null;
    }

    console.log(`[Template] Copying template for version ${version} to shop ${shop}`);

    // Create new CartDrawer with template's settings
    const newCartDrawer = await prisma.cartDrawer.create({
        data: {
            shop,
            version,
            isActive: template.isActive,
            theme: template.theme,
            primaryColor: template.primaryColor,
            freeShippingProgressBarEnabled: template.freeShippingProgressBarEnabled,
            promotionalBannerEnabled: template.promotionalBannerEnabled,
            productRecommendationsEnabled: template.productRecommendationsEnabled,
            couponCodeFieldEnabled: template.couponCodeFieldEnabled,
            savingsDisplayEnabled: template.savingsDisplayEnabled,
            freeShippingMessageEnabled: template.freeShippingMessageEnabled,
            cartTotalsEnabled: template.cartTotalsEnabled,
            milestonesEnabled: template.milestonesEnabled,
            milestonesProgressBarColor: template.milestonesProgressBarColor,
            milestonesAllUnlockedMessage: template.milestonesAllUnlockedMessage,
            freeGiftsEnabled: template.freeGiftsEnabled,
            featureOrder: template.featureOrder,
            itemOrderingEnabled: template.itemOrderingEnabled,
            isTemplate: false, // Don't mark copy as template
        },
    });

    // Copy free shipping bars
    for (const bar of template.freeShippingBars) {
        await prisma.freeShippingProgressBar.create({
            data: {
                cartDrawerId: newCartDrawer.id,
                shop,
                isActive: bar.isActive,
                priority: bar.priority,
                thresholdAmount: bar.thresholdAmount,
                currency: bar.currency,
                beforeThresholdMessage: bar.beforeThresholdMessage,
                afterThresholdMessage: bar.afterThresholdMessage,
                progressBarColor: bar.progressBarColor,
                backgroundColor: bar.backgroundColor,
                borderColor: bar.borderColor,
                showPercentage: bar.showPercentage,
                thresholdMode: bar.thresholdMode,
                thresholdCount: bar.thresholdCount,
            },
        });
    }

    // Copy promotional banners
    for (const banner of template.promotionalBanners) {
        const newBanner = await prisma.promotionalBanner.create({
            data: {
                cartDrawerId: newCartDrawer.id,
                shop,
                isActive: banner.isActive,
                priority: banner.priority,
                title: banner.title,
                imageUrls: banner.imageUrls,
                ctaText: banner.ctaText,
                ctaUrl: banner.ctaUrl,
                description: banner.description,
                startDate: banner.startDate,
                endDate: banner.endDate,
            },
        });

        // Copy banner images
        for (const image of banner.images) {
            await prisma.promotionalBannerImage.create({
                data: {
                    bannerId: newBanner.id,
                    imageUrl: image.imageUrl,
                    altText: image.altText,
                    order: image.order,
                    ctaText: image.ctaText,
                    ctaUrl: image.ctaUrl,
                    description: image.description,
                    title: image.title,
                    videoType: image.videoType,
                    videoUrl: image.videoUrl,
                },
            });
        }

        // Copy carousel settings
        if (banner.carouselSettings) {
            await prisma.promotionalBannerCarouselSettings.create({
                data: {
                    bannerId: newBanner.id,
                    autoRotate: banner.carouselSettings.autoRotate,
                    rotationSpeed: banner.carouselSettings.rotationSpeed,
                    showDots: banner.carouselSettings.showDots,
                    showArrows: banner.carouselSettings.showArrows,
                },
            });
        }
    }

    // Copy product recommendations
    for (const rec of template.productRecommendations) {
        const newRec = await prisma.productRecommendation.create({
            data: {
                cartDrawerId: newCartDrawer.id,
                shop,
                isActive: rec.isActive,
                priority: rec.priority,
                title: rec.title,
                algorithm: rec.algorithm,
            },
        });

        // Copy products
        for (const product of rec.products) {
            await prisma.productRecommendationProduct.create({
                data: {
                    recommendationId: newRec.id,
                    productId: product.productId,
                    position: product.position,
                },
            });
        }
    }

    // Copy savings displays
    for (const display of template.savingsDisplays) {
        await prisma.savingsDisplay.create({
            data: {
                cartDrawerId: newCartDrawer.id,
                shop,
                isActive: display.isActive,
                message: display.message,
                backgroundColor: display.backgroundColor,
                textColor: display.textColor,
            },
        });
    }

    // Copy free shipping messages
    for (const message of template.freeShippingMessages) {
        await prisma.freeShippingMessage.create({
            data: {
                cartDrawerId: newCartDrawer.id,
                shop,
                isActive: message.isActive,
                message: message.message,
                backgroundColor: message.backgroundColor,
                textColor: message.textColor,
            },
        });
    }

    // Copy cart totals
    for (const total of template.cartTotals) {
        await prisma.cartTotals.create({
            data: {
                cartDrawerId: newCartDrawer.id,
                shop,
                isActive: total.isActive,
                showOriginalPrice: total.showOriginalPrice,
                showItemDiscounts: total.showItemDiscounts,
                showSubtotal: total.showSubtotal,
                showTaxNotice: total.showTaxNotice,
                subtotalLabel: total.subtotalLabel,
                totalLabel: total.totalLabel,
                taxNoticeText: total.taxNoticeText,
                originalPriceLabel: total.originalPriceLabel,
                itemDiscountLabel: total.itemDiscountLabel,
                backgroundColor: total.backgroundColor,
                textColor: total.textColor,
                discountColor: total.discountColor,
            },
        });
    }

    // Copy milestones
    for (const milestone of template.milestones) {
        const newMilestone = await prisma.cartMilestone.create({
            data: {
                cartDrawerId: newCartDrawer.id,
                shop,
                isActive: milestone.isActive,
                priority: milestone.priority,
                title: milestone.title,
                description: milestone.description,
            },
        });

        // Copy milestone targets
        for (const target of milestone.targets) {
            await prisma.cartMilestoneTarget.create({
                data: {
                    milestoneId: newMilestone.id,
                    targetType: target.targetType,
                    targetValue: target.targetValue,
                    productIds: target.productIds,
                },
            });
        }
    }

    // Copy free gifts
    for (const gift of template.freeGifts) {
        const newGift = await prisma.freeGift.create({
            data: {
                cartDrawerId: newCartDrawer.id,
                shop,
                isActive: gift.isActive,
                priority: gift.priority,
                title: gift.title,
                description: gift.description,
                badgeText: gift.badgeText,
                badgeColor: gift.badgeColor,
            },
        });

        // Copy gift products
        for (const product of gift.giftProducts) {
            await prisma.freeGiftProduct.create({
                data: {
                    freeGiftId: newGift.id,
                    productId: product.productId,
                    variantId: product.variantId,
                    position: product.position,
                },
            });
        }

        // Copy gift targets
        for (const target of gift.targets) {
            await prisma.freeGiftTarget.create({
                data: {
                    freeGiftId: newGift.id,
                    targetType: target.targetType,
                    targetValue: target.targetValue,
                    productIds: target.productIds,
                    collectionsIds: target.collectionsIds,
                },
            });
        }
    }

    console.log(`[Template] Successfully copied template to shop ${shop}`);

    // Return the created CartDrawer with all relations
    return await prisma.cartDrawer.findUnique({
        where: {
            shop_version: {
                shop,
                version,
            },
        },
        include: {
            freeShippingBars: { where: { isActive: true } },
            promotionalBanners: {
                where: { isActive: true },
                include: {
                    images: { orderBy: { order: 'asc' } },
                    carouselSettings: true,
                },
            },
            productRecommendations: {
                where: { isActive: true },
                include: {
                    products: { orderBy: { position: 'asc' } },
                },
            },
            savingsDisplays: { where: { isActive: true } },
            freeShippingMessages: { where: { isActive: true } },
            cartTotals: { where: { isActive: true } },
            milestones: {
                where: { isActive: true },
                include: { targets: true },
                orderBy: { priority: 'asc' },
            },
            freeGifts: {
                where: { isActive: true },
                include: {
                    giftProducts: { orderBy: { position: 'asc' } },
                    targets: true,
                },
                orderBy: { priority: 'asc' },
            },
        },
    });
}

/**
 * Mark a CartDrawer as the template for its version
 * Ensures only one template exists per version
 */
export async function markAsTemplate(cartDrawerId: string) {
    const cartDrawer = await prisma.cartDrawer.findUnique({
        where: { id: cartDrawerId },
    });

    if (!cartDrawer) {
        throw new Error('CartDrawer not found');
    }

    // Unmark any existing templates for this version
    await prisma.cartDrawer.updateMany({
        where: {
            version: cartDrawer.version,
            isTemplate: true,
        },
        data: {
            isTemplate: false,
        },
    });

    // Mark this one as template
    await prisma.cartDrawer.update({
        where: { id: cartDrawerId },
        data: { isTemplate: true },
    });

    console.log(`[Template] Marked CartDrawer ${cartDrawerId} as template for version ${cartDrawer.version}`);
}

/**
 * Ensure a template exists for a version
 * If no template exists, promote first CartDrawer to template
 */
export async function ensureTemplateExists(version: string) {
    const template = await getTemplateForVersion(version);

    if (!template) {
        // Find any CartDrawer for this version
        const anyCartDrawer = await prisma.cartDrawer.findFirst({
            where: { version },
        });

        if (anyCartDrawer) {
            await markAsTemplate(anyCartDrawer.id);
            console.log(`[Template] Auto-promoted CartDrawer to template for version ${version}`);
            return anyCartDrawer;
        }
    }

    return template;
}
