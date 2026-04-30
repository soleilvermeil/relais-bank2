const accountNameKeyById: Record<string, string> = {
  checking: "accountNames.checking",
  savings: "accountNames.savings",
  "retirement-3a": "accountNames.retirement3a",
};

type Translate = (key: string) => string;

export function getLocalizedAccountNameById(
  accountId: string,
  t: Translate,
  fallback: string,
) {
  const key = accountNameKeyById[accountId];
  return key ? t(key) : fallback;
}
