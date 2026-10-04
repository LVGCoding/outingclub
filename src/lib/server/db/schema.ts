import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';
import { relations } from 'drizzle-orm';
import * as v from 'valibot';

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
export type TripStatus = (typeof trips.status.enumValues)[number];
export const tripStatusValid = v.picklist(trips.status.enumValues);

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
export type ParticipantStatus = (typeof tripParticipants.status.enumValues)[number];
export const participantStatusValid = v.picklist(tripParticipants.status.enumValues);

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
export type PageCategory = (typeof pages.pageCategory.enumValues)[number];
export const pageCategoryValid = v.picklist(pages.pageCategory.enumValues);

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

export const files = sqliteTable('files', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	url: text('url').notNull(),
	type: text('type', { enum: ['images', 'backgrounds', 'pdfs', 'goofyImages'] }).notNull()
});
export type FileType = (typeof files.type.enumValues)[number];

export const fileTypeValid = v.picklist(files.type.enumValues);

export * from './auth.schema';
