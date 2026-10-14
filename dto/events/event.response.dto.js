import { calculateGst, cgstRatePercent, sgstRatePercent } from '../../utils/gst.js';

const withGst = (price) => (price == null ? null : calculateGst(price));

const toPricingDto = (pricing) => ({
  isPaid: Boolean(pricing?.isPaid),
  memberPrice: pricing?.memberPrice ?? null,
  nonMemberPrice: pricing?.nonMemberPrice ?? null,
  currency: pricing?.currency ?? 'INR',
  cgstRate: cgstRatePercent(),
  sgstRate: sgstRatePercent(),
  memberCharges: pricing?.isPaid ? withGst(pricing.memberPrice) : null,
  nonMemberCharges: pricing?.isPaid ? withGst(pricing.nonMemberPrice) : null,
});

export function toEventResponseDto(event) {
  const obj = typeof event.toObject === 'function' ? event.toObject() : event;
  // `registeredMembers` / `capacity` are legacy fields on old documents: the
  // former holds member ids (never exposed), the latter is no longer a concept.
  const { _id, __v, registeredMembers, capacity, pricing, ...rest } = obj;

  // Events registered through an external link never use our pricing, so none is sent.
  const pricingDto = rest.registrationLink ? {} : { pricing: toPricingDto(pricing) };

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
    ...pricingDto,
    registrationFields: rest.registrationFields ?? [],
  };
}
