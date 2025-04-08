// full payment info to show when reading a single request info
export function paymentPlanType(paymentPlanTag: string) {
  const paymentPlans = {
    daily: 'Daily deliveries and payments',
    weekly: 'Weekly deliveries and payments',
    monthly: 'Monthly deliveries and payments',
    yearly: 'Yearly deliveries and payments',
    'full-at-start': 'All at once, right at the start',
    'full-at-end': 'All at once, when project ends',
  };

  return paymentPlans[paymentPlanTag as keyof typeof paymentPlans] ?? '(Not Provided)';
}

// compact info to show on the pills in browse requests
export function paymentPlanBrowseTag(paymentPlanTag: string) {
  const paymentPlans = {
    daily: 'Daily Payments',
    weekly: 'Weekly Payments',
    monthly: 'Monthly Payments',
    yearly: 'Yearly Payments',
    'full-at-start': 'Payment in Full',
    'full-at-end': 'Payment in Full',
  };

  return paymentPlans[paymentPlanTag as keyof typeof paymentPlans] ?? '(Not Provided)';
}

export function databaseConfigType(databaseTag: string) {
  const databaseOptions = {
    yes: 'Creator has the required data or database and we can use it.',
    'no-will-create-myself': 'None yet, creator will create on and then provide it.',
    'no-but-find-on-web': 'None yet, but we can find the data or database on the web.',
    'no-devs-create-from-scratch': 'None yet, need developers to create one from scratch.',
    'not-needed': 'Not needed for this project.',
  };

  return databaseOptions[databaseTag as keyof typeof databaseOptions] ?? '(Not Provided)';
}

export function needsAppConfig(needsAppTag: string) {
  const needsAppOptions = {
    yes: 'Creator already has an app/website to integrate with this request.',
    'no-need-create-e2e': 'None yet, we need to create a new E2E solution.',
    'no-but-find-on-web': 'None yet, but we can find one on the web.',
    'not-needed': 'Not needed for this project.',
  };

  return needsAppOptions[needsAppTag as keyof typeof needsAppOptions] ?? '(Not Provided)';
}
