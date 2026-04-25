export const ACTIVITY_TYPES = [
  'Trading',
  'Financial Services',
  'Real Estate',
  'Construction',
  'Technology',
  'Consultancy',
  'Healthcare',
  'Retail',
  'Logistics',
  'Manufacturing',
  'Media',
  'Education',
  'Other',
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];
