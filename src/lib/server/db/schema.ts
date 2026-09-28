import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';
import { relations } from 'drizzle-orm';

export const trips = sqliteTable('trips', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	activity: text('activity').notNull(),
	description: text('description').notNull(),
	time: integer('time', { mode: 'timestamp_ms' }).notNull(),
	status: text('status', { enum: ['hidden', 'pending', 'completed', 'cancelled'] })
		.notNull()
		.default('hidden'),
	formElements: text('form_elements', { mode: 'json' })
});

export const tripLeaders = sqliteTable('trip_leaders', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	tripId: text('trip_id')
		.notNull()
		.references(() => trips.id),
	userId: text('user_id')
		.notNull()
		.references(() => user.id)
});

export const tripParticipants = sqliteTable('trip_participants', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	tripId: text('trip_id')
		.notNull()
		.references(() => trips.id),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	status: text('status', {
		enum: ['pending', 'accepted', 'declined', 'cancelled', 'attended', 'no_show']
	})
		.notNull()
		.default('pending'),
	formData: text('form_data', { mode: 'json' })
});

export const pages = sqliteTable('pages', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	content: text('content', { mode: 'json' }).notNull(),
	link: integer('link', { mode: 'boolean' }).default(false),
	pageCategory: text('page_category', { enum: ['activity', 'club', 'main', 'social'] }).notNull(),
	path: text('path').notNull()
});

export const tripRelations = relations(trips, ({ many }) => ({
	leaders: many(tripLeaders),
	tripParticipants: many(tripParticipants)
}));

export const tripParticipantsRelations = relations(tripParticipants, ({ one }) => ({
	trips: one(trips, { fields: [tripParticipants.tripId], references: [trips.id] }),
	users: one(user, { fields: [tripParticipants.userId], references: [user.id] })
}));

export const tripLeadersRelations = relations(tripLeaders, ({ one }) => ({
	trips: one(trips, { fields: [tripLeaders.tripId], references: [trips.id] }),
	users: one(user, { fields: [tripLeaders.userId], references: [user.id] })
}));

export const userRelations = relations(user, ({ many }) => ({
	leaders: many(tripLeaders),
	tripParticipants: many(tripParticipants)
}));

export * from './auth.schema';
