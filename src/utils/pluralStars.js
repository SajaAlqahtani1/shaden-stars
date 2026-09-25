const arabicPluralRules = new Intl.PluralRules("ar");

const starWordByCategory = {
  zero: "نجمة",
  one: "نجمة واحدة",
  two: "نجمتان",
  few: "نجوم",
  many: "نجمة",
  other: "نجمة",
};

export function formatStarsCount(count) {
  const category = arabicPluralRules.select(count);
  const number = count.toLocaleString("ar-EG");
  return `${number} ${starWordByCategory[category]}`;
}
