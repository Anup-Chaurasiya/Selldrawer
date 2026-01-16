import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import {
    getAllVersions,
    setVersionRollout,
    createVersion,
    initializeDefaultVersion,
    getVersionStats,
} from '../services/cartDrawerVersions.server';

export async function loader({ request }: LoaderFunctionArgs) {
    await authenticate.admin(request);

    // Initialize default version if not exists
    await initializeDefaultVersion();

    const versions = await getAllVersions();
    const stats = await getVersionStats();

    return json({ versions, stats });
}

export async function action({ request }: ActionFunctionArgs) {
    await authenticate.admin(request);

    const formData = await request.formData();
    const intent = formData.get('intent');

    try {
        if (intent === 'set-rollout') {
            const versionKey = formData.get('versionKey') as string;
            const percentage = parseInt(formData.get('percentage') as string);

            if (!versionKey || isNaN(percentage)) {
                return json({ error: 'Invalid parameters' }, { status: 400 });
            }

            await setVersionRollout(versionKey, percentage);

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

        return json({ error: 'Invalid intent' }, { status: 400 });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
