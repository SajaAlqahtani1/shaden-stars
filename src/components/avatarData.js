import rabbitSrc from "../assets/avatars/rabbit.svg";
import catSrc from "../assets/avatars/cat.svg";
import bearSrc from "../assets/avatars/bear.svg";
import lionSrc from "../assets/avatars/lion.svg";
import foxSrc from "../assets/avatars/fox.svg";
import tigerSrc from "../assets/avatars/tiger.svg";
import unicornSrc from "../assets/avatars/unicorn.svg";

export const AVATARS = {
  rabbit: { src: rabbitSrc, label: "أرنب" },
  cat: { src: catSrc, label: "قطة" },
  bear: { src: bearSrc, label: "دب" },
  lion: { src: lionSrc, label: "أسد" },
  fox: { src: foxSrc, label: "ثعلب" },
  tiger: { src: tigerSrc, label: "نمر" },
  unicorn: { src: unicornSrc, label: "يونيكورن" },
};

export const AVATAR_KEYS = Object.keys(AVATARS);

export function getDefaultAvatarKey(gender) {
  return gender === "boy" ? "lion" : "rabbit";
}
