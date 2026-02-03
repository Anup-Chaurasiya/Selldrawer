import { useState, useEffect } from 'react';
import {
    Modal,
    BlockStack,
    InlineStack,
    Text,
    Button,
    Banner,
    Badge,
    ChoiceList,
    Card,
    RangeSlider,
    Select,
} from '@shopify/polaris';
import { useFetcher } from '@remix-run/react';

interface Version {
    id: string;
    key: string;
    name: string;
    description?: string;
    isActive: boolean;
    isDefault: boolean;
    targetingMode: string;
    rolloutPercentage: number;
    segmentIds: string[];
    estimatedShops: number;
    manualAssignments: number;
}

interface CustomerSegment {
    id: string;
    name: string;
    query: string;
}

interface VersionManagementModalProps {
    open: boolean;
    onClose: () => void;
    currentVersion?: string;
    onVersionSwitch?: (versionKey: string) => void;
}

interface VersionsResponse {
    versions: Version[];
    stats: any;
    customerSegments: CustomerSegment[];
}

export function VersionManagementModal({
    open,
    onClose,
    currentVersion = 'default',
    onVersionSwitch,
}: VersionManagementModalProps) {
    const fetcher = useFetcher();
    const [versions, setVersions] = useState<Version[]>([]);
    const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
    const [versionToDelete, setVersionToDelete] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Track targeting mode and segment selection per version
    const [versionTargetingModes, setVersionTargetingModes] = useState<Record<string, string>>({});
    const [versionSegments, setVersionSegments] = useState<Record<string, string[]>>({});
    const [versionPercentages, setVersionPercentages] = useState<Record<string, number>>({});

    // Load versions when modal opens
    useEffect(() => {
        if (open) {
            fetcher.load('/api/cart-drawer-versions');
        }
    }, [open]);

    // Update versions from fetcher data
    useEffect(() => {
        const data = fetcher.data as VersionsResponse | undefined;
        if (data && data.versions) {
            setVersions(data.versions);

            // Initialize targeting modes and segments
            const modes: Record<string, string> = {};
            const segments: Record<string, string[]> = {};
            const percentages: Record<string, number> = {};
            data.versions.forEach((v) => {
                modes[v.key] = v.targetingMode || 'percentage';
                segments[v.key] = v.segmentIds || [];
                percentages[v.key] = v.rolloutPercentage;
            });
            setVersionTargetingModes(modes);
            setVersionSegments(segments);
            setVersionPercentages(percentages);
            setHasChanges(false);
        }
        if (data && data.customerSegments) {
            setCustomerSegments(data.customerSegments);
        }
    }, [fetcher.data]);

    const handleTargetingModeChange = (versionKey: string, mode: string) => {
        setVersionTargetingModes(prev => ({ ...prev, [versionKey]: mode }));
        setHasChanges(true);
    };

    const handleSegmentChange = (versionKey: string, segmentId: string) => {
        // For dropdown, we only support single selection
        setVersionSegments(prev => ({ ...prev, [versionKey]: segmentId ? [segmentId] : [] }));
        setHasChanges(true);
    };

    const handleRolloutChange = (versionKey: string, percentage: number) => {
        setVersionPercentages(prev => ({ ...prev, [versionKey]: percentage }));
        setHasChanges(true);
    };

    const handleSaveChanges = () => {
        // Batch all changes into a single request
        const updates = versions.map((version) => ({
            versionKey: version.key,
            targetingMode: versionTargetingModes[version.key],
            percentage: versionPercentages[version.key],
            segmentIds: versionSegments[version.key],
        }));

        const formData = new FormData();
        formData.append('intent', 'batch-update-rollout');
        formData.append('updates', JSON.stringify(updates));

        fetcher.submit(formData, { method: 'post', action: '/api/cart-drawer-versions' });
        setHasChanges(false);
    };

    // Close modal and show success message when save completes
    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data && !hasChanges && open) {
            const data = fetcher.data as any;
            if (data.success) {
                onClose();
                // You can add shopify.toast here if you have access to it
            }
        }
    }, [fetcher.state, fetcher.data, hasChanges, open]);

    const handleDeleteVersion = (versionKey: string) => {
        const formData = new FormData();
        formData.append('intent', 'delete-version');
        formData.append('versionKey', versionKey);
        fetcher.submit(formData, { method: 'post', action: '/api/cart-drawer-versions' });
        setVersionToDelete(null);
    };

    const getTargetingModeForVersion = (versionKey: string) => {
        return versionTargetingModes[versionKey] || 'percentage';
    };

    const getSegmentsForVersion = (versionKey: string) => {
        return versionSegments[versionKey] || [];
    };

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                title="Configure Rollout"
                primaryAction={{
                    content: 'Save Changes',
                    onAction: handleSaveChanges,
                    disabled: !hasChanges,
                    loading: fetcher.state !== 'idle',
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: onClose,
                    },
                ]}
            >
                <Modal.Section>
                    <BlockStack gap="500">
                        {/* Rollout Controls */}
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h3">
                                Rollout Settings
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="span">
                                Control how customers see each version using percentage-based rollout (by Customer ID) or customer segment targeting.
                            </Text>

                            {versions.map((version) => (
                                <Card key={version.key}>
                                    <BlockStack gap="300">
                                        <InlineStack align="space-between" blockAlign="center">
                                            <InlineStack gap="200" blockAlign="center">
                                                <Text fontWeight="semibold" as="span">{version.name}</Text>
                                                <Badge tone={version.isActive ? 'success' : undefined}>
                                                    {version.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </InlineStack>
                                            {!version.isDefault && (
                                                <Button
                                                    onClick={() => setVersionToDelete(version.key)}
                                                    tone="critical"
                                                    size="slim"
                                                >
                                                    Delete Version
                                                </Button>
                                            )}
                                        </InlineStack>

                                        {/* Targeting Mode Selection */}
                                        <ChoiceList
                                            title="Targeting Mode"
                                            choices={[
                                                {
                                                    label: 'Percentage-based rollout',
                                                    value: 'percentage',
                                                    helpText: 'Deterministic rollout based on customer ID (MD5 hash)',
                                                },
                                                {
                                                    label: 'Customer segment targeting',
                                                    value: 'segment',
                                                    helpText: 'Target specific Shopify customer segments',
                                                },
                                            ]}
                                            selected={[getTargetingModeForVersion(version.key)]}
                                            onChange={(selected) => handleTargetingModeChange(version.key, selected[0])}
                                        />

                                        {/* Percentage-based Controls */}
                                        {getTargetingModeForVersion(version.key) === 'percentage' && (
                                            <BlockStack gap="200">
                                                <RangeSlider
                                                    label="Rollout Percentage"
                                                    value={versionPercentages[version.key] ?? version.rolloutPercentage}
                                                    onChange={(value) => {
                                                        // RangeSlider returns a number when not using dual values
                                                        const percentageValue = typeof value === 'number' ? value : value[0];
                                                        handleRolloutChange(version.key, percentageValue);
                                                    }}
                                                    output
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    suffix={
                                                        <Text variant="bodyMd" as="span">
                                                            {versionPercentages[version.key] ?? version.rolloutPercentage}%
                                                        </Text>
                                                    }
                                                />

                                                <Text variant="bodySm" as="span">
                                                    💡 Same customer always gets the same version (deterministic hash)
                                                </Text>
                                            </BlockStack>
                                        )}

                                        {/* Segment-based Controls */}
                                        {getTargetingModeForVersion(version.key) === 'segment' && (
                                            <BlockStack gap="200">
                                                {customerSegments.length > 0 ? (
                                                    <>
                                                        <Select
                                                            label="Target Customer Segment"
                                                            options={[
                                                                { label: 'Select a segment...', value: '' },
                                                                ...customerSegments.map(segment => ({
                                                                    label: segment.name,
                                                                    value: segment.id,
                                                                }))
                                                            ]}
                                                            value={getSegmentsForVersion(version.key)[0] || ''}
                                                            onChange={(value) => handleSegmentChange(version.key, value)}
                                                        />
                                                        {getSegmentsForVersion(version.key).length > 0 && (
                                                            <Text variant="bodySm" tone="success" as="span">
                                                                ✓ Targeting: {customerSegments.find(s => s.id === getSegmentsForVersion(version.key)[0])?.name}
                                                            </Text>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Banner tone="warning">
                                                        <p>No customer segments found in your Shopify store. Create customer segments in Shopify Admin to use segment-based targeting.</p>
                                                    </Banner>
                                                )}
                                            </BlockStack>
                                        )}
                                    </BlockStack>
                                </Card>
                            ))}
                        </BlockStack>
                    </BlockStack>
                </Modal.Section>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                open={versionToDelete !== null}
                onClose={() => setVersionToDelete(null)}
                title="Delete Version"
                primaryAction={{
                    content: 'Delete',
                    onAction: () => versionToDelete && handleDeleteVersion(versionToDelete),
                    destructive: true,
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => setVersionToDelete(null),
                    },
                ]}
            >
                <Modal.Section>
                    <BlockStack gap="300">
                        <Text as="p" variant="bodyMd">
                            Are you sure you want to delete <strong>{versions.find(v => v.key === versionToDelete)?.name}</strong>?
                        </Text>
                        <Banner tone="warning">
                            <p>This action cannot be undone. All configuration for this version will be permanently deleted.</p>
                        </Banner>
                    </BlockStack>
                </Modal.Section>
            </Modal>
        </>
    );
}
