export function toAdminMemberResponseDto(member) {
  return {
    id:                 member._id,
    membershipNo:       member.membershipNo,
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
    createdAt:          member.createdAt,
    updatedAt:          member.updatedAt,
  };
}

// Public directory view for member-facing listing: no contact info, address, or membership number.
export function toPublicMemberResponseDto(member) {
  return {
    id:                 member._id,
    name:               member.name,
    title:              member.title,
    membershipCategory: member.membershipCategory,
    designation:        member.designation,
    specialization:     member.specialization,
    institution:        member.institution,
    city:               member.city,
    state:              member.state,
    country:            member.country,
  };
}
