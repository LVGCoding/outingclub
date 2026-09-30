import { ORIGIN, BETTER_AUTH_SECRET } from '$app/env/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '#lib/server/db';
import { admin as adminPlugin, createAccessControl } from 'better-auth/plugins';
import { createAuthMiddleware } from 'better-auth/api';
import { user as userDb } from '#lib/server/db/schema';

export const statement = {
	trip: ['create', 'signup', 'update', 'delete', 'manage'],
	user: ['set-password', 'update', 'delete', 'view', 'updateNotes'],
	page: ['create', 'update', 'delete']
} as const;

export const ac = createAccessControl(statement);

export const member = ac.newRole({
	trip: ['signup']
});

export const admin = ac.newRole({
	trip: ['create', 'update', 'signup', 'delete', 'manage'],
	user: ['view', 'set-password', 'update', 'delete'],
	page: ['create', 'update', 'delete']
});

export const leader = ac.newRole({
	trip: ['create', 'update', 'signup', 'delete', 'manage'],
	user: ['view', 'updateNotes']
});

export const viewer = ac.newRole({
	trip: []
});

export const auth = betterAuth({
	baseURL: ORIGIN,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true },
	plugins: [
		adminPlugin({
			ac,
			adminRoles: ['admin'],
			defaultRole: 'member',
			roles: {
				admin,
				leader,
				member,
				viewer
			}
		}),
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array,
	],
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			const user = ctx.context.newSession?.user;
			if (user) {
				await db.update(userDb).set({ lastLogin: new Date() });
			}
		})
	},
	user: {
		additionalFields: {
			phoneNumber: { type: 'string', optional: false },
			yearJoined: { type: 'number', optional: false, defaultValue: 2000 },
			notes: { type: 'string', optional: true, defaultValue: '' },
			paidDuesEnd: { type: 'string', defaultValue: '2010/12' },
			lastLogin: { type: 'date', defaultValue: 'CURRENT_TIMESTAMP()' }
		}
	}
});

export async function getCurrentSession() {
	const event = getRequestEvent();

	return auth.api.getSession({
		headers: event.request.headers
	});
}

export async function getCurrentUser() {
	const session = await getCurrentSession();

	return session?.user ?? null;
}

type permissions = {
	[K in keyof typeof statement]?: (typeof statement)[K][number][];
};

export async function hasPermission(perms: permissions, userId?: string) {
	if (!userId) {
		const session = await getCurrentSession();
		userId = session?.user.id;
	}
	if (!userId) return false;
	const data = await auth.api.userHasPermission({
		body: {
			userId: userId,
			permissions: perms
		}
	});
	return data.success;
}
