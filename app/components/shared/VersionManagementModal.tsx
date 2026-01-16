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
} from '@shopify/polaris';
import { useFetcher } from '@remix-run/react';

interface Version {
    id: string;
    key: string;
    name: string;
    description?: string;
    isActive: boolean;
    isDefault: boolean;
    rolloutPercentage: number;
    estimatedShops: number;
    manualAssignments: number;
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
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newVersionKey, setNewVersionKey] = useState('');
    const [newVersionName, setNewVersionName] = useState('');
    const [newVersionDescription, setNewVersionDescription] = useState('');

    // Load versions when modal opens
    useEffect(() => {
        if (open) {
            fetcher.load('/api/cart-drawer-versions');
        }
    }, [open]);

    interface VersionsResponse {
        versions: Version[];
        stats: any;
    }

    // Update versions from fetcher data
    useEffect(() => {
        const data = fetcher.data as VersionsResponse | undefined;
        if (data && data.versions) {
            setVersions(data.versions);
        }
    }, [fetcher.data]);

    const handleRolloutChange = (versionKey: string, percentage: number) => {
        const formData = new FormData();
        formData.append('intent', 'set-rollout');
        formData.append('versionKey', versionKey);
        formData.append('percentage', percentage.toString());
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

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Cart Drawer Versions & Rollout"
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
                                                    </InlineStack>
                                                    {version.description && (
                                                        <Text variant="bodySm" tone="subdued" as="span">
                                                            {version.description}
                                                        </Text>
                                                    )}
                                                    <Text variant="bodySm" tone="subdued" as="span">
                                                        ~{version.estimatedShops} merchants
                                                        {version.manualAssignments > 0 &&
                                                            ` (${version.manualAssignments} manual)`}
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
                            Control what percentage of merchants see each version. Uses deterministic assignment
                            (same merchant always gets same version).
                        </Text>

                        {versions.map((version) => (
                            <BlockStack gap="200" key={version.key}>
                                <InlineStack align="space-between" blockAlign="center">
                                    <Text fontWeight="semibold" as="span">{version.name}</Text>
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

                                <Text variant="bodySm" tone="subdued" as="span">
                                    Estimated merchants: ~{Math.floor((version.rolloutPercentage / 100) * (versions[0]?.estimatedShops || 0))}
                                </Text>
                            </BlockStack>
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
