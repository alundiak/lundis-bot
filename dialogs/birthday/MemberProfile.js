/**
 * Chat Member profile class.
 */
class MemberProfile {
  constructor(name, birthday) {
    this.name = name || undefined;
    this.birthday = birthday || undefined;
  }
};

exports.MemberProfile = MemberProfile;
