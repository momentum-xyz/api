export class ProfileDto {
  name?: string;
  profile: Profile;
}

export class Profile {
  bio?: string;
  location?: string;
  avatarHash?: string;
  profileLink?: string;
  onBoarded?: boolean;

}

