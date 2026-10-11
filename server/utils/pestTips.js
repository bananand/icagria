export const DISCLAIMER =
  'General guidance only. Confirm with a local agricultural extension officer.';

export const GENERIC_PREVENTIVE_TIPS = [
  'Inspect plants regularly',
  'Remove infected plant debris',
  'Use clean planting material',
  'Rotate crops',
  'Ask the local agricultural extension officer about treatment',
];

export const PEST_TIPS_MAP = {
  'sweet potato weevil': [
    'Inspect plants regularly',
    'Use clean planting material and healthy vine cuttings',
    'Hill up soil around tuber roots to prevent cracking and exposure',
    'Remove infected plant debris and crop residue promptly',
    'Rotate crops with non-host crops',
    'Ask the local agricultural extension officer about treatment',
  ],
  'cassava mealybug': [
    'Inspect plants regularly, especially leaf undersides and apical shoots',
    'Use clean planting material and certified pest-free cassava stakes',
    'Remove infected plant debris and destroy heavily infested plant parts',
    'Rotate crops and avoid continuous planting',
    'Ask the local agricultural extension officer about treatment',
  ],
  'cassava mosaic disease': [
    'Inspect plants regularly for leaf curling and mosaic mottling',
    'Use clean planting material and virus-free disease-resistant stem cuttings',
    'Remove infected plant debris and rogue infected plants immediately',
    'Rotate crops to prevent field carryover',
    'Ask the local agricultural extension officer about treatment',
  ],
  'late blight': [
    'Inspect plants regularly during cool, humid, or rainy periods',
    'Use clean planting material and certified disease-free tubers',
    'Remove infected plant debris and discard blighted foliage away from the field',
    'Rotate crops to break disease survival cycles in the soil',
    'Ask the local agricultural extension officer about treatment',
  ],
  'potato tuber moth': [
    'Inspect plants regularly and check harvested tubers for tunnel damage',
    'Use clean planting material and store seed tubers in secure, well-ventilated storage',
    'Hill up ridges deeply to cover forming tubers from egg-laying moths',
    'Remove infected plant debris after harvest',
    'Rotate crops with non-solanaceous crops',
    'Ask the local agricultural extension officer about treatment',
  ],
  'leaf spot': [
    'Inspect plants regularly for dark necrotic spots on lower leaves',
    'Use clean planting material and certified disease-free seeds',
    'Remove infected plant debris and maintain adequate plant spacing for aeration',
    'Rotate crops with non-legume crops',
    'Ask the local agricultural extension officer about treatment',
  ],
  'aphids': [
    'Inspect plants regularly, paying close attention to young shoots and leaf undersides',
    'Use clean planting material and keep borders clear of infested weeds',
    'Remove infected plant debris and wash away mild colonies with water spray',
    'Rotate crops to prevent persistent insect populations',
    'Ask the local agricultural extension officer about treatment',
  ],
  'soybean rust': [
    'Inspect plants regularly for early pustule formation on leaves',
    'Use clean planting material and early-maturing varieties where suitable',
    'Remove infected plant debris and manage field weeds',
    'Rotate crops with non-host crops',
    'Ask the local agricultural extension officer about treatment',
  ],
  'pod borer': [
    'Inspect plants regularly during flowering and pod development stages',
    'Use clean planting material and monitor flowers for larval entry holes',
    'Remove infected plant debris and hand-pick infested pods when feasible',
    'Rotate crops to disrupt pest generations',
    'Ask the local agricultural extension officer about treatment',
  ],
  'yellow mosaic virus': [
    'Inspect plants regularly for yellowing or mottled leaves',
    'Use clean planting material and virus-tolerant seed stocks',
    'Remove infected plant debris and rogue symptomatic plants early',
    'Rotate crops and control vector populations',
    'Ask the local agricultural extension officer about treatment',
  ],
  'whitefly': [
    'Inspect plants regularly on the underside of young leaves',
    'Use clean planting material and install yellow sticky traps for monitoring',
    'Remove infected plant debris and weed hosts around the perimeter',
    'Rotate crops with non-preferred hosts',
    'Ask the local agricultural extension officer about treatment',
  ],
};

export const getTipsForPest = (pestName) => {
  if (!pestName) return [...GENERIC_PREVENTIVE_TIPS];
  const key = pestName.trim().toLowerCase();
  const matched = PEST_TIPS_MAP[key];
  if (matched && matched.length > 0) {
    return matched;
  }
  return [...GENERIC_PREVENTIVE_TIPS];
};

export default {
  DISCLAIMER,
  GENERIC_PREVENTIVE_TIPS,
  PEST_TIPS_MAP,
  getTipsForPest,
};
