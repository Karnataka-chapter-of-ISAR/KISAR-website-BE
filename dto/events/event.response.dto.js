import { calculateGst, cgstRatePercent, sgstRatePercent } from '../../utils/gst.js';

const withGst = (price) => (price == null ? null : calculateGst(price));

export function toEventResponseDto(event) {
  const obj = typeof event.toObject === 'function' ? event.toObject() : event;
  // `registeredMembers` / `capacity` are legacy fields on old documents: the
  // former holds member ids (never exposed), the latter is no longer a concept.
  const { _id, __v, registeredMembers, capacity, ...rest } = obj;
  return {
    id: _id,
    registeredCount: rest.registeredCount ?? 0,
    isHighlighted: Boolean(rest.isHighlighted),
    ...rest,
    // Single-day events (and legacy documents) report endDate = date.
    endDate: rest.endDate ?? rest.date,
    registrationLink: rest.registrationLink ?? null,
    time: rest.time ?? null,
    images: rest.images ?? [],
    accessType: rest.accessType ?? 'members_only',
    pricing: {
      isPaid: Boolean(rest.pricing?.isPaid),
      memberPrice: rest.pricing?.memberPrice ?? null,
      nonMemberPrice: rest.pricing?.nonMemberPrice ?? null,
      currency: rest.pricing?.currency ?? 'INR',
      cgstRate: cgstRatePercent(),
      sgstRate: sgstRatePercent(),
      memberCharges: rest.pricing?.isPaid ? withGst(rest.pricing.memberPrice) : null,
      nonMemberCharges: rest.pricing?.isPaid ? withGst(rest.pricing.nonMemberPrice) : null,
    },
    registrationFields: rest.registrationFields ?? [],
  };
}
