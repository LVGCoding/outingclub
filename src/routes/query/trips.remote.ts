import { tripLeaders, tripParticipants, trips, user } from '#lib/server/db/schema';
import { command, getRequestEvent, query } from '$app/server';
import { db } from '#lib/server/db';
import { and, eq, inArray, or } from 'drizzle-orm';
import { auth, getCurrentUser, hasPermission } from '#lib/server/auth';
import * as v from 'valibot';
import { type formElement, type formResponse } from '#lib/components/FormElement.svelte';

export const getTrips = query(async () => {
	const tripsFound = await db.query.trips.findMany({
		columns: {
			activity: true,
			description: true,
			time: true,
			title: true,
			id: true
		},
		with: {
			leaders: {
				columns: {},
				with: {
					users: true
				}
			}
		},
		where: eq(trips.status, 'pending')
	});
	return tripsFound;
});

export const createTrip = command(async () => {
	const u = await getCurrentUser();
	if (!u || !hasPermission({ trip: ['create'] }, u?.id)) {
		throw new Error('Permission Denied');
	}
	const id = crypto.randomUUID();
	const res = await db.insert(trips).values({
		activity: 'Backpacking',
		description: '',
		time: new Date(),
		title: 'Hike',
		status: 'hidden',
		id: id,
		formElements: [
			{
				id: 0.18210471522141958,
				order: 0,
				type: 'text',
				label: 'Emergency contact full name',
				required: true
			},
			{
				id: 0.7544638509275049,
				order: 1,
				type: 'text',
				label: 'Emergency contact phone number',
				required: true
			}
		]
	});
	if (res.lastInsertRowid) {
		await db.insert(tripLeaders).values({
			tripId: id,
			userId: u.id
		});
	}
	return id;
});

export const getTrip = query(v.object({ id: v.string() }), async ({ id }) => {
	const user = await getCurrentUser();
	if (!user) {
		throw new Error('User not found');
	}
	const test = await db.query.tripParticipants.findMany({});
	console.log(test);
	const tripFound = await db.query.trips.findFirst({
		where: eq(trips.id, id),
		columns: {
			activity: true,
			description: true,
			time: true,
			title: true,
			id: true,
			formElements: true
		},
		with: {
			leaders: {
				columns: {},
				with: {
					users: true
				}
			},
			tripParticipants: {
				where: eq(tripParticipants.userId, user.id)
			}
		}
	});
	return { ...tripFound, formElements: tripFound?.formElements as formElement[] | null };
});

export const signUp = command(
	v.object({ tripId: v.string(), formData: v.unknown() }),
	async ({ tripId, formData }) => {
		const trip = await db.query.trips.findFirst({
			where: eq(trips.id, tripId),
			columns: {
				status: true
			}
		});
		if (trip?.status !== 'pending') {
			return 'This trip is not open for sign-up';
		}
		const user = await getCurrentUser();
		if (!user) {
			return 'User not found';
    }
    if (!inUserPayperiod(user.paidDuesEnd)) {
			return 'Pay your dues man';
		}
		if (!hasPermission({ trip: ['signup'] }, user?.id)) {
			return 'You do not have permission to signup';
		}
		//Check if user is already signed up
		const isSignedUp = await db.query.tripParticipants.findFirst({
			where: and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, user.id))
		});
		if (isSignedUp) {
			return 'User is already signed up';
		}
		await db.insert(tripParticipants).values({ tripId, userId: user.id, formData: formData });
		return true;
	}
);

export const getTripsLeader = query(async () => {
	if (!hasPermission({ trip: ['manage'] })) {
		throw new Error('Permission Denied');
	}
	const tripsFound = await db.query.trips.findMany({
		columns: {
			activity: true,
			description: true,
			time: true,
			title: true,
			id: true,
			status: true
		},
		with: {
			leaders: {
				columns: {},
				with: {
					users: true
				}
			}
		}
	});
	return tripsFound;
});

export const getTripLeader = query(v.object({ id: v.string() }), async ({ id }) => {
	if (!hasPermission({ trip: ['manage'] })) {
		throw new Error('Permission Denied');
	}
	const tripFound = await db.query.trips.findFirst({
		where: eq(trips.id, id),
		columns: {
			activity: true,
			description: true,
			time: true,
			title: true,
			id: true,
			formElements: true,
			status: true
		},
		with: {
			leaders: {
				columns: {},
				with: {
					users: true
				}
			}
		}
	});
	return { ...tripFound, formElements: tripFound?.formElements as formElement[] | null };
});

export const updateTrip = command(
	v.object({
		id: v.string(),
		title: v.string(),
		activity: v.string(),
		description: v.string(),
		time: v.date()
	}),
	async ({ id, title, activity, description, time }) => {
		if (!hasPermission({ trip: ['update'] })) {
			throw new Error('Permission Denied');
		}
		await db
			.update(trips)
			.set({
				title,
				activity,
				description,
				time
			})
			.where(eq(trips.id, id));
		return true;
	}
);

export const updateFormElements = command(
	v.object({
		id: v.string(),
		formElements: v.unknown()
	}),
	async ({ id, formElements }) => {
		if (!hasPermission({ trip: ['update'] })) {
			throw new Error('Permission Denied');
		}
		await db
			.update(trips)
			.set({
				formElements
			})
			.where(eq(trips.id, id));
		return true;
	}
);

export const deleteTrip = command(
	v.object({
		id: v.string()
	}),
	async ({ id }) => {
		if (!hasPermission({ trip: ['delete'] })) {
			throw new Error('Permission Denied');
		}
		await db.delete(tripLeaders).where(eq(tripLeaders.tripId, id));
		await db.delete(tripParticipants).where(eq(tripParticipants.tripId, id));
		await db.delete(trips).where(eq(trips.id, id));
		return true;
	}
);

export const getLeaders = query(async () => {
	if (!hasPermission({ trip: ['manage'] })) {
		throw new Error('Permission Denied');
	}
	const leaders = await db.query.user.findMany({
		columns: { id: true, name: true, email: true, phoneNumber: true },
		where: or(eq(user.role, 'leader'), eq(user.role, 'admin'))
	});
	return leaders;
});

export const addLeader = command(
	v.object({ tripId: v.string(), userId: v.string() }),
	async ({ tripId, userId }) => {
		if (!hasPermission({ trip: ['create'] })) {
			throw new Error('Permission Denied');
		}
		const leader = await db.query.user.findFirst({
			where: and(eq(user.id, userId), eq(user.role, 'leader'))
		});
		if (!leader) {
			return 'Could not find leader';
		}
		await db.insert(tripLeaders).values({ tripId, userId });
		return true;
	}
);

export const removeLeader = command(
	v.object({ tripId: v.string(), userId: v.string() }),
	async ({ tripId, userId }) => {
		const u = await getCurrentUser();
		if (!hasPermission({ trip: ['create'] }, u?.id)) {
			throw new Error('Permission Denied');
		}
		await db
			.delete(tripLeaders)
			.where(and(eq(tripLeaders.tripId, tripId), eq(tripLeaders.userId, userId)));
		return true;
	}
);

export const getTripParticipants = query(v.object({ id: v.string() }), async ({ id }) => {
	if (!hasPermission({ trip: ['manage'] })) {
		throw new Error('Permission Denied');
	}
	const trip = await db.query.trips.findFirst({
		where: eq(trips.id, id),
		columns: { id: true, title: true, activity: true, time: true }
	});
	if (!trip) {
		throw new Error('Trip not found');
	}
	const participants = await db.query.tripParticipants.findMany({
		where: eq(tripParticipants.tripId, id),
		columns: { id: true, userId: true, status: true, formData: true },
		with: {
			users: {
				columns: {
					id: true,
					name: true,
					email: true,
					phoneNumber: true,
					image: true,
					yearJoined: true,
					notes: true
				}
			}
		}
	});
	const userIds = participants.map((p) => p.userId);
	if (userIds.length === 0) {
		return { trip, participants: [] };
	}
	// Get all participation history for these users.
	const history = await db.query.tripParticipants.findMany({
		where: inArray(tripParticipants.userId, userIds),
		columns: { userId: true, status: true },
		with: {
			trips: { columns: { id: true, title: true, activity: true, time: true, status: true } }
		}
	});
	const result = participants.map((participant) => {
		const userHistory = history.filter((h) => h.userId === participant.userId); // Trips the user actually attended.
		const attendedTrips = userHistory.filter((h) => h.status === 'attended'); // Trips the user cancelled.
		const cancelledTrips = userHistory.filter((h) => h.status === 'cancelled'); // Trips the user signed up for but did not attend.
		const noShowTrips = userHistory.filter((h) => h.status === 'no_show'); // Count attended trips by activity.
		const activityCounts = Object.entries(
			Object.groupBy(attendedTrips, (h) => h.trips.activity)
		).map(([activity, trips]) => ({ activity, count: trips?.length ?? 0 })); // Trips they've actually taken in the current // trip's activity.
		const currentActivityTrips = attendedTrips.filter((h) => h.trips.activity === trip.activity); // Most recent attended trip.
		const sortedTrips = [...attendedTrips].sort(
			(a, b) => b.trips.time.getTime() - a.trips.time.getTime()
		);
		return {
			id: participant.id,
			user: participant.users,
			signup: { status: participant.status, formData: participant.formData as formResponse[] },
			history: {
				totalTrips: attendedTrips.length,
				activityCounts,
				currentActivityTrips: currentActivityTrips.length,
				cancelledTrips: cancelledTrips.length,
				noShowTrips: noShowTrips.length,
				firstTrip: sortedTrips.at(-1)?.trips.time ?? null,
				lastTrip: sortedTrips.at(0)?.trips.time ?? null
			},
			isNewToActivity: currentActivityTrips.length === 0
		};
	});
	return { trip, participants: result };
});

export const updateTripStatus = command(
	v.object({
		id: v.string(),
		status: v.union([
			v.literal('hidden'),
			v.literal('pending'),
			v.literal('completed'),
			v.literal('cancelled')
		])
	}),
	async ({ id, status }) => {
		if (!hasPermission({ trip: ['update'] })) {
			throw new Error('Permission Denied');
		}
		const trip = await db.query.trips.findFirst({ where: eq(trips.id, id) });
		if (!trip) return;
		if (status === 'completed') {
			await db
				.update(tripParticipants)
				.set({ status: 'attended' })
				.where(and(eq(tripParticipants.tripId, id), eq(tripParticipants.status, 'accepted')));
		}
		await db.update(trips).set({ status }).where(eq(trips.id, id));
		return { success: true };
	}
);

export const updateParticipantStatus = command(
	v.object({
		participantId: v.string(),
		status: v.picklist(['pending', 'accepted', 'declined', 'cancelled', 'attended', 'no_show'])
	}),
	async ({ participantId, status }) => {
		if (!hasPermission({ trip: ['manage'] })) {
			throw new Error('Permission Denied');
		}
		const participant = await db.query.tripParticipants.findFirst({
			where: eq(tripParticipants.id, participantId),
			columns: { id: true }
		});
		if (!participant) {
			throw new Error('Participant not found');
		}
		await db.update(tripParticipants).set({ status }).where(eq(tripParticipants.id, participantId));
		return true;
	}
);

export const updateUserPassword = command(
	v.object({ userId: v.string(), password: v.string() }),
	async ({ userId, password }) => {
		const event = getRequestEvent();
		await auth.api.setUserPassword({
			body: {
				userId: userId,
				newPassword: password
			},
			headers: event.request.headers
		});
	}
);

export const getUsers = query(async () => {
	if (!hasPermission({ user: ['view'] })) throw new Error('Permission Denied');
	return (await db.query.user.findMany({
			columns: {
				createdAt: true,
				email: true,
				id: true,
				name: true,
				notes: true,
				phoneNumber: true,
				role: true,
      yearJoined: true,
				paidDuesEnd:true,
			}
		})).map((el) => ({...el, paidDues: inUserPayperiod(el.paidDuesEnd)}));
});

export const updateUser = command(
	v.object({
		id: v.string(),
		name: v.string(),
		email: v.string(),
		phoneNumber: v.string(),
		notes: v.string(),
		role: v.picklist(['member', 'admin', 'leader', 'viewer']),
		yearJoined: v.number()
	}),
	async ({ id, name, email, phoneNumber, notes, role, yearJoined }) => {
		if (!hasPermission({ user: ['update'] }))
			throw new Error('You dont have permission to do that');
		const existingUser = await db.query.user.findFirst({
			where: eq(user.id, id),
			columns: { id: true }
		});
		if (!existingUser) {
			throw new Error('User not found');
		}
		await db
			.update(user)
			.set({ name, email, phoneNumber, notes, role, yearJoined })
			.where(eq(user.id, id));
	}
);

export const updateUserNotes = command(
	v.object({
		id: v.string(),
		notes: v.string()
	}),
	async ({ id, notes }) => {
		if (!hasPermission({ user: ['updateNotes'] }))
			throw new Error('You dont have permission to do that');
		const existingUser = await db.query.user.findFirst({
			where: eq(user.id, id),
			columns: { id: true }
		});
		if (!existingUser) {
			throw new Error('User not found');
		}
		await db.update(user).set({ notes }).where(eq(user.id, id));
	}
);

export const updateUserPaid = command(
	v.object({
		id: v.string(),
    paid: v.boolean(),
		semesters: v.union([v.literal(1), v.literal(2)])
	}),
	async ({ id, paid,semesters }) => {
		if (!hasPermission({ user: ['update'] }))
			throw new Error('You dont have permission to do that');
		const existingUser = await db.query.user.findFirst({
			where: eq(user.id, id),
			columns: { id: true }
		});
		if (!existingUser) {
			throw new Error('User not found');
    }
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    let ending = "";
    if (!paid) {
      ending = "1999/10"
    }
    else if (month >= 7 && month <= 11) {
      if (semesters === 2) {
        ending = year + 1 + "/" + 4;
      } else {
        ending = year + "/" + 11;
      }
    } else if (semesters === 2) {
      ending = "";
    } else if (month >=0  && month < 4) {
      ending = year + "/" + 4;
    } else if (month >=0  && month < 7) {
      ending = year + "/" + 7;
    }

    if (ending === "") {
      throw new Error("Invaild pay period")
    }
		await db.update(user).set({ paidDuesEnd:ending }).where(eq(user.id, id));
	}
);

export const deleteUser = command(v.object({ userId: v.string() }), async ({ userId }) => {
	if (!hasPermission({ user: ['delete'] })) throw new Error("I can't let you do that dave");
	const event = getRequestEvent();
	await auth.api.removeUser({
		body: {
			userId
		},
		headers: event.request.headers
	});
});

function inUserPayperiod(paidEnd: string): boolean {
  const split = paidEnd.split("/");
  const date = new Date();
  if (split.length !== 2) return false
  if (Number(split[0]) < date.getFullYear()) return false;
  if (Number(split[0]) === date.getFullYear() && Number(split[1]) < date.getMonth()) return false;

  return true;
}
