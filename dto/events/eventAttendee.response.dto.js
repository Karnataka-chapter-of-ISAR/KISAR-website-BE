export function toEventAttendeeResponseDto(member) {
  return {
    id:          member._id,
    name:        member.name,
    email:       member.email,
    phone:       member.phone,
    designation: member.designation,
  };
}
