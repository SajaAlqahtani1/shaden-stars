import { AVATARS, getDefaultAvatarKey } from "./avatarData.js";

export function Avatar({ avatar, gender, className, ...props }) {
  const key = AVATARS[avatar] ? avatar : getDefaultAvatarKey(gender);
  const { src, label } = AVATARS[key];
  const wrapClassName = className ? `avatar-circle ${className}` : "avatar-circle";

  return (
    <span className={wrapClassName} {...props}>
      <img src={src} alt={label} />
    </span>
  );
}
