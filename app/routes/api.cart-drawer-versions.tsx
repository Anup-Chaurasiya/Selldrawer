import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import {
    getAllVersions,
    setVersionRollout,
    createVersion,
    deleteVersion,
    initializeDefaultVersion,
    getVersionStats,
} from '../services/cartDrawerVersions.server';
import { getCustomerSegments } from '../services/shopifySegments.server';

export async function loader({ request }: LoaderFunctionArgs) {
    await authenticate.admin(request);

    // Initialize default version if not exists
    await initializeDefaultVersion();

    const versions = await getAllVersions();
    const stats = await getVersionStats();
    const customerSegments = await getCustomerSegments(request);

    return json({ versions, stats, customerSegments });
}

export async function action({ request }: ActionFunctionArgs) {
    await authenticate.admin(request);

    const formData = await request.formData();
    const intent = formData.get('intent');

    try {
        if (intent === 'set-rollout') {
            const versionKey = formData.get('versionKey') as string;
            const percentageStr = formData.get('percentage') as string;
            const targetingMode = formData.get('targetingMode') as string | undefined;
            const segmentIdsStr = formData.get('segmentIds') as string | undefined;

            if (!versionKey) {
                return json({ error: 'Version key is required' }, { status: 400 });
            }

            const percentage = percentageStr ? parseInt(percentageStr) : undefined;
            const segmentIds = segmentIdsStr ? JSON.parse(segmentIdsStr) : undefined;

            await setVersionRollout(versionKey, percentage, targetingMode, segmentIds);

            const versions = await getAllVersions();
            return json({ success: true, versions });
        }

        if (intent === 'create-version') {
            const key = formData.get('key') as string;
            const name = formData.get('name') as string;
            const description = formData.get('description') as string | undefined;

            if (!key || !name) {
                return json({ error: 'Key and name are required' }, { status: 400 });
            }

            await createVersion({ key, name, description });

            const versions = await getAllVersions();
            return json({ success: true, versions });
        }

        if (intent === 'delete-version') {
            const versionKey = formData.get('versionKey') as string;

            if (!versionKey) {
                return json({ error: 'Version key is required' }, { status: 400 });
            }

            await deleteVersion(versionKey);

            const versions = await getAllVersions();
            return json({ success: true, versions });
        }

        if (intent === 'batch-update-rollout') {
            const updatesStr = formData.get('updates') as string;

            if (!updatesStr) {
                return json({ error: 'Updates are required' }, { status: 400 });
            }

            const updates = JSON.parse(updatesStr);

            // Process all updates sequentially
            for (const update of updates) {
                const { versionKey, targetingMode, percentage, segmentIds } = update;

                await setVersionRollout(
                    versionKey,
                    percentage,
                    targetingMode,
                    segmentIds
                );
            }

            const versions = await getAllVersions();
            return json({ success: true, versions });
        }

        return json({ error: 'Invalid intent' }, { status: 400 });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
