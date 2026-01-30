import { useState, useEffect } from 'react';
import {
    Modal,
    BlockStack,
    InlineStack,
    Text,
    Button,
    RadioButton,
    Divider,
    TextField,
    Banner,
    ProgressBar,
    Badge,
    ChoiceList,
    Card,
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
    const [selectedVersion, setSelectedVersion] = useState(currentVersion);
    const [versions, setVersions] = useState<Version[]>([]);
    const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newVersionKey, setNewVersionKey] = useState('');
    const [newVersionName, setNewVersionName] = useState('');
    const [newVersionDescription, setNewVersionDescription] = useState('');

    // Track targeting mode and segment selection per version
    const [versionTargetingModes, setVersionTargetingModes] = useState<Record<string, string>>({});
    const [versionSegments, setVersionSegments] = useState<Record<string, string[]>>({});

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
            data.versions.forEach((v) => {
                modes[v.key] = v.targetingMode || 'percentage';
                segments[v.key] = v.segmentIds || [];
            });
            setVersionTargetingModes(modes);
            setVersionSegments(segments);
        }
        if (data && data.customerSegments) {
            setCustomerSegments(data.customerSegments);
        }
    }, [fetcher.data]);

    const handleTargetingModeChange = (versionKey: string, mode: string) => {
        setVersionTargetingModes(prev => ({ ...prev, [versionKey]: mode }));
    };

    const handleSegmentChange = (versionKey: string, selectedSegmentIds: string[]) => {
        setVersionSegments(prev => ({ ...prev, [versionKey]: selectedSegmentIds }));
    };

    const handleRolloutChange = (versionKey: string, percentage: number) => {
        const formData = new FormData();
        formData.append('intent', 'set-rollout');
        formData.append('versionKey', versionKey);
        formData.append('targetingMode', 'percentage');
        formData.append('percentage', percentage.toString());
        fetcher.submit(formData, { method: 'post', action: '/api/cart-drawer-versions' });

        // Update local state
        handleTargetingModeChange(versionKey, 'percentage');
    };

    const handleSegmentTargetingApply = (versionKey: string) => {
        const selectedSegments = versionSegments[versionKey] || [];

        const formData = new FormData();
        formData.append('intent', 'set-rollout');
        formData.append('versionKey', versionKey);
        formData.append('targetingMode', 'segment');
        formData.append('segmentIds', JSON.stringify(selectedSegments));
        fetcher.submit(formData, { method: 'post', action: '/api/cart-drawer-versions' });
    };

    const handleCreateVersion = () => {
        if (!newVersionKey || !newVersionName) {
            return;
        }

        const formData = new FormData();
        formData.append('intent', 'create-version');
        formData.append('key', newVersionKey);
        formData.append('name', newVersionName);
        if (newVersionDescription) {
            formData.append('description', newVersionDescription);
        }

        fetcher.submit(formData, { method: 'post', action: '/api/cart-drawer-versions' });

        // Reset form
        setNewVersionKey('');
        setNewVersionName('');
        setNewVersionDescription('');
        setShowCreateForm(false);
    };

    const handleSaveAndSwitch = () => {
        if (selectedVersion !== currentVersion && onVersionSwitch) {
            onVersionSwitch(selectedVersion);
        }
        onClose();
    };

    const getTargetingModeForVersion = (versionKey: string) => {
        return versionTargetingModes[versionKey] || 'percentage';
    };

    const getSegmentsForVersion = (versionKey: string) => {
        return versionSegments[versionKey] || [];
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Customer A/B Testing & Rollout"
            primaryAction={{
                content: 'Close',
                onAction: handleSaveAndSwitch,
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
                    <Banner>
                        <p><strong>Customer-Based Targeting:</strong> Versions are assigned to individual customers using their Customer ID. This enables true user-level A/B testing and segment targeting.</p>
                    </Banner>

                    {/* Version Selection */}
                    <BlockStack gap="300">
                        <Text variant="headingMd" as="h3">
                            Select Version to Edit
                        </Text>

                        {versions.length > 0 ? (
                            <BlockStack gap="200">
                                {versions.map((version) => (
                                    <div
                                        key={version.key}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: selectedVersion === version.key ? '2px solid #4F46E5' : '1px solid #e5e7eb',
                                            backgroundColor: selectedVersion === version.key ? '#f5f3ff' : '#ffffff',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => setSelectedVersion(version.key)}
                                    >
                                        <InlineStack align="space-between" blockAlign="center">
                                            <InlineStack gap="300" blockAlign="center">
                                                <RadioButton
                                                    label={''}
                                                    checked={selectedVersion === version.key}
                                                    id={`version-${version.key}`}
                                                    name="version"
                                                    onChange={() => setSelectedVersion(version.key)}
                                                />
                                                <BlockStack gap="100">
                                                    <InlineStack gap="200" blockAlign="center">
                                                        <Text variant="bodyMd" fontWeight="semibold" as="span">
                                                            {version.name}
                                                        </Text>
                                                        {version.isDefault && <Badge tone="info">Default</Badge>}
                                                        {version.isActive && <Badge tone="success">Active</Badge>}
                                                        {version.targetingMode === 'segment' && (
                                                            <Badge>Segment Targeting</Badge>
                                                        )}
                                                    </InlineStack>
                                                    {version.description && (
                                                        <Text variant="bodySm" tone="subdued" as="span">
                                                            {version.description}
                                                        </Text>
                                                    )}
                                                    <Text variant="bodySm" tone="subdued" as="span">
                                                        ~{version.estimatedShops} customers
                                                    </Text>
                                                </BlockStack>
                                            </InlineStack>
                                        </InlineStack>
                                    </div>
                                ))}
                            </BlockStack>
                        ) : (
                            <Text tone="subdued" as="span">Loading versions...</Text>
                        )}

                        {selectedVersion !== currentVersion && (
                            <Banner tone="warning">
                                <p>
                                    You are about to switch to <strong>{versions.find(v => v.key === selectedVersion)?.name}</strong>.
                                    This will change which configuration you're editing.
                                </p>
                            </Banner>
                        )}
                    </BlockStack>

                    <Divider />

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
                                        <Text fontWeight="semibold" as="span">{version.name}</Text>
                                        <Badge tone={version.isActive ? 'success' : 'subdued'}>
                                            {version.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
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
                                            <InlineStack align="space-between" blockAlign="center">
                                                <Text variant="bodyMd" as="span">Rollout Percentage</Text>
                                                <Text variant="bodyMd" tone={version.isActive ? 'success' : 'subdued'} as="span">
                                                    {version.rolloutPercentage}%
                                                </Text>
                                            </InlineStack>

                                            <ProgressBar
                                                progress={version.rolloutPercentage}
                                                size="small"
                                            />

                                            <InlineStack gap="200">
                                                <Button
                                                    size="slim"
                                                    onClick={() => handleRolloutChange(version.key, 0)}
                                                    pressed={version.rolloutPercentage === 0}
                                                >
                                                    0%
                                                </Button>
                                                <Button
                                                    size="slim"
                                                    onClick={() => handleRolloutChange(version.key, 25)}
                                                    pressed={version.rolloutPercentage === 25}
                                                >
                                                    25%
                                                </Button>
                                                <Button
                                                    size="slim"
                                                    onClick={() => handleRolloutChange(version.key, 50)}
                                                    pressed={version.rolloutPercentage === 50}
                                                >
                                                    50%
                                                </Button>
                                                <Button
                                                    size="slim"
                                                    variant={version.rolloutPercentage === 100 ? 'primary' : undefined}
                                                    onClick={() => handleRolloutChange(version.key, 100)}
                                                    pressed={version.rolloutPercentage === 100}
                                                >
                                                    100%
                                                </Button>
                                            </InlineStack>

                                            <Text variant="bodySm" tone="info" as="span">
                                                💡 Same customer always gets the same version (deterministic hash)
                                            </Text>
                                        </BlockStack>
                                    )}

                                    {/* Segment-based Controls */}
                                    {getTargetingModeForVersion(version.key) === 'segment' && (
                                        <BlockStack gap="200">
                                            {customerSegments.length > 0 ? (
                                                <>
                                                    <ChoiceList
                                                        title="Select Customer Segments"
                                                        allowMultiple
                                                        choices={customerSegments.map(segment => ({
                                                            label: segment.name,
                                                            value: segment.id,
                                                            helpText: segment.query ? `Query: ${segment.query}` : undefined,
                                                        }))}
                                                        selected={getSegmentsForVersion(version.key)}
                                                        onChange={(selected) => handleSegmentChange(version.key, selected)}
                                                    />
                                                    <Button
                                                        onClick={() => handleSegmentTargetingApply(version.key)}
                                                        variant="primary"
                                                        size="slim"
                                                    >
                                                        Apply Segment Targeting
                                                    </Button>
                                                    {version.segmentIds && version.segmentIds.length > 0 && (
                                                        <Text variant="bodySm" tone="success" as="span">
                                                            ✓ Currently targeting {version.segmentIds.length} segment(s)
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

                    <Divider />

                    {/* Create New Version */}
                    {!showCreateForm ? (
                        <Button onClick={() => setShowCreateForm(true)} fullWidth>
                            + Create New Version
                        </Button>
                    ) : (
                        <BlockStack gap="300">
                            <Text variant="headingMd" as="h3">
                                Create New Version
                            </Text>

                            <TextField
                                label="Version Key"
                                value={newVersionKey}
                                onChange={setNewVersionKey}
                                placeholder="e.g., v2, v3, experimental"
                                helpText="Unique identifier for this version (lowercase, no spaces)"
                                autoComplete="off"
                            />

                            <TextField
                                label="Version Name"
                                value={newVersionName}
                                onChange={setNewVersionName}
                                placeholder="e.g., Version 2 - Carousel Milestones"
                                autoComplete="off"
                            />

                            <TextField
                                label="Description (optional)"
                                value={newVersionDescription}
                                onChange={setNewVersionDescription}
                                placeholder="What's different in this version?"
                                multiline={2}
                                autoComplete="off"
                            />

                            <InlineStack gap="200">
                                <Button onClick={handleCreateVersion} variant="primary">
                                    Create Version
                                </Button>
                                <Button onClick={() => setShowCreateForm(false)}>
                                    Cancel
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    )}
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
}
