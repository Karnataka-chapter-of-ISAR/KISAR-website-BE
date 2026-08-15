export function toAdminMemberResponseDto(member) {
  return {
    id:                 member._id,
    memberId:           member.memberId,
    ISARMemberID:       member.ISARMemberID,
    name:               member.name,
    title:              member.title,
    membershipCategory: member.membershipCategory,
    email:              member.email,
    alternateEmail:     member.alternateEmail,
    phone:              member.phone,
    alternatePhone:     member.alternatePhone,
    designation:        member.designation,
    specialization:     member.specialization,
    institution:        member.institution,
    address:            member.address,
    city:               member.city,
    district:           member.district,
    state:              member.state,
    pincode:            member.pincode,
    country:            member.country,
    zone:               member.zone,
    chapter:            member.chapter,
    linkedin:           member.linkedin,
    joined:             member.joined,
    privacy:            member.privacy,
    lat:                member.lat,
    lng:                member.lng,
    colorIndex:         member.colorIndex,
    experience:         member.experience ?? [],
    lockedFields:       member.lockedFields ?? [],
    pendingChanges:     member.pendingChanges ?? {},
    createdAt:          member.createdAt,
    updatedAt:          member.updatedAt,
  };
}

// Self view only needs "here's the value you submitted", not the full audit
// detail admins get — flatten { field: { proposedValue, ... } } to { field: proposedValue }.
function toSimplePendingChanges(pendingChanges = {}) {
  return Object.fromEntries(
    Object.entries(pendingChanges).map(([field, detail]) => [field, detail.proposedValue]),
  );
}

// Self profile view: a member fetching their own record, so all fields are safe to expose.
export function toSelfMemberResponseDto(member) {
  return {
    id:                 member._id,
    memberId:           member.memberId,
    ISARMemberID:       member.ISARMemberID,
    name:               member.name,
    title:              member.title,
    membershipCategory: member.membershipCategory,
    email:              member.email,
    alternateEmail:     member.alternateEmail,
    phone:              member.phone,
    alternatePhone:     member.alternatePhone,
    designation:        member.designation,
    specialization:     member.specialization,
    institution:        member.institution,
    address:            member.address,
    city:               member.city,
    district:           member.district,
    state:              member.state,
    pincode:            member.pincode,
    country:            member.country,
    zone:               member.zone,
    chapter:            member.chapter,
    linkedin:           member.linkedin,
    joined:             member.joined,
    privacy:            member.privacy,
    lat:                member.lat,
    lng:                member.lng,
    colorIndex:         member.colorIndex,
    experience:         member.experience ?? [],
    lockedFields:       member.lockedFields ?? [],
    pendingChanges:     toSimplePendingChanges(member.pendingChanges),
    rejectedChanges:    member.rejectedChanges ?? {},
  };
}

// Public directory view for member-facing listing: no contact info or membership number.
export function toPublicMemberResponseDto(member) {
  return {
    id:                 member._id,
    name:               member.name,
    title:              member.title,
    membershipCategory: member.membershipCategory,
    designation:        member.designation,
    specialization:     member.specialization,
    institution:        member.institution,
    address:            member.address,
    city:               member.city,
    district:           member.district,
    state:              member.state,
    pincode:            member.pincode,
    country:            member.country,
  };
}
