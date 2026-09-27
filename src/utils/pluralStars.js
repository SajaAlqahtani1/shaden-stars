const arabicPluralRules = new Intl.PluralRules("ar");

export function formatStarsCount(count) {
  const category = arabicPluralRules.select(count);
  const number = count.toLocaleString("ar-EG");

  switch (category) {
    case "zero":
      return "لا نجوم بعد";
    case "one":
      return "نجمة واحدة";
    case "two":
      return "نجمتان";
    case "few":
      return `${number} نجوم`;
    default:
      return `${number} نجمة`;
  }
}
