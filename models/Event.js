import mongoose from 'mongoose';
import {
  EVENT_TYPES,
  TIME_FORMAT_REGEX,
  EVENT_ACCESS_TYPES,
  EVENT_CURRENCY,
  REGISTRATION_FIELD_TYPES,
} from '../constants/events.js';

const registrationFieldSchema = new mongoose.Schema(
  {
    key:         { type: String, required: true, trim: true },
    label:       { type: String, required: true, trim: true },
    type:        { type: String, required: true, enum: REGISTRATION_FIELD_TYPES },
    required:    { type: Boolean, default: false },
    placeholder: { type: String, trim: true, default: null },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    type:        { type: String, required: true, enum: EVENT_TYPES },
    // `date` is the first day; `endDate` the last (same as `date` for single-day events).
    date:        { type: Date, required: true },
    endDate:     { type: Date, default: null },
    time:        { type: String, default: null, match: TIME_FORMAT_REGEX },
    location:    { type: String, required: true, trim: true },
    link:        { type: String, trim: true, default: null },
    linkLabel:   { type: String, trim: true, default: 'Meeting Link' },
    // When set, registration happens off-site: "Register" redirects here instead of using our flow.
    registrationLink: { type: String, trim: true, default: null },
    bannerImage: { type: String, trim: true, default: null },
    images:      { type: [String], default: [] },
    isHighlighted: { type: Boolean, default: false },
    // Set when an admin starts refunding an event's registrations: no new registrations or payments.
    registrationsClosed: { type: Boolean, default: false },
    createdBy:   { type: String, trim: true, default: null },

    // accessType, pricing and registrationFields are fixed at creation — the
    // update validator rejects any attempt to change them.
    accessType:  { type: String, enum: EVENT_ACCESS_TYPES, default: 'members_only' },
    pricing: {
      isPaid:         { type: Boolean, default: false },
      memberPrice:    { type: Number, min: 1, default: null },
      nonMemberPrice: { type: Number, min: 1, default: null },
      currency:       { type: String, default: EVENT_CURRENCY },
    },
    registrationFields: { type: [registrationFieldSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model('Event', eventSchema);
