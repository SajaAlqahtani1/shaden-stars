const arabicPluralRules = new Intl.PluralRules("ar");

// 0, 1 and 2 are handled directly because some browsers (Safari on iPad)
// do not return the "zero" category for 0.
function getPluralCategory(count) {
  if (count === 0) {
    return "zero";
  }
  if (count === 1) {
    return "one";
  }
  if (count === 2) {
    return "two";
  }
  return arabicPluralRules.select(count);
}

export function formatStarsCount(count) {
  const category = getPluralCategory(count);
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
