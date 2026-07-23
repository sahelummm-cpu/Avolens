/**
 * AvoLens design tokens — Cal AI palette with macro nutrition tokens.
 */

export interface Theme {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  border2: string;
  ink: string;
  muted: string;
  muted2: string;
  faint: string;

  green: string;
  greenGrad1: string;
  greenGrad2: string;
  greenTint: string;
  greenTrack: string;
  chartTrack: string;

  protein: string;
  proteinTint: string;
  carbs: string;
  carbsTint: string;
  fat: string;
  fatTint: string;
  fatTint2: string;
  fatTint3: string;

  water: string;
  waterTint: string;
  waterTint2: string;
  waterTint3: string;

  fiber: string;
  fiberTint: string;
  sodium: string;
  sodiumTint: string;
  sugar: string;
  sugarTint: string;

  purple: string;
  purpleTint: string;
  purpleTint2: string;
  purpleBorder: string;

  amberGrad1: string;
  amberGrad2: string;

  navBg: string;
  navIcon: string;

  scrim: string;
}

export const lightTheme: Theme = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surface2: '#F5F5F6',
  surface3: '#EDEDEF',
  border: '#ECECEE',
  border2: '#F5F5F6',
  ink: '#0E0E12',
  muted: '#8A8A8F',
  muted2: '#A9A9AE',
  faint: '#C7C7CC',

  // General UI primary token (Cal AI jet-black)
  green: '#111116',
  greenGrad1: '#26262C',
  greenGrad2: '#111116',
  greenTint: '#F5F5F6',
  greenTrack: '#E9E9EB',
  chartTrack: '#E9E9EB',

  // Nutrition & Macro Colors (Fat: Olive Green)
  protein: '#E4586E',
  proteinTint: '#FBEAED',
  carbs: '#E8A13B',
  carbsTint: '#FBF1E0',
  fat: '#8EA604',
  fatTint: '#F1F8E9',
  fatTint2: '#F4FCE8',
  fatTint3: '#E8F5E9',

  // Water Tracker (Dedicated Light Blue)
  water: '#4DA8F0',
  waterTint: '#E9F3FC',
  waterTint2: '#EDF6FC',
  waterTint3: '#D7EAF8',

  // Micronutrient Colors
  fiber: '#10B981',
  fiberTint: '#ECFDF5',
  sodium: '#06B6D4',
  sodiumTint: '#ECFEFF',
  sugar: '#EC4899',
  sugarTint: '#FDF2F8',

  purple: '#7C6BE6',
  purpleTint: '#F5F3FC',
  purpleTint2: '#EEEBFB',
  purpleBorder: '#E5E0F5',

  amberGrad1: '#FFB340',
  amberGrad2: '#FF6B00',

  navBg: '#111116',
  navIcon: '#8A8A8F',

  scrim: 'rgba(0, 0, 0, 0.4)',
};

export const darkTheme: Theme = {
  bg: '#0E0E12',
  surface: '#18181F',
  surface2: '#202028',
  surface3: '#282832',
  border: '#2C2C36',
  border2: '#22222B',
  ink: '#FFFFFF',
  muted: '#8A8A8F',
  muted2: '#A9A9AE',
  faint: '#5C5C66',

  // General UI primary token in dark mode
  green: '#FFFFFF',
  greenGrad1: '#ECECEE',
  greenGrad2: '#FFFFFF',
  greenTint: '#202028',
  greenTrack: '#282832',
  chartTrack: '#282832',

  // Nutrition & Macro Colors (Fat: Olive Green)
  protein: '#EC7284',
  proteinTint: '#2E1E21',
  carbs: '#F0B458',
  carbsTint: '#2F2618',
  fat: '#A2C40A',
  fatTint: '#212B14',
  fatTint2: '#1C2610',
  fatTint3: '#283618',

  // Water Tracker (Dedicated Light Blue)
  water: '#6BB8F4',
  waterTint: '#1B2733',
  waterTint2: '#1C2833',
  waterTint3: '#223244',

  // Micronutrient Colors
  fiber: '#34D399',
  fiberTint: '#132A22',
  sodium: '#22D3EE',
  sodiumTint: '#15323B',
  sugar: '#F472B6',
  sugarTint: '#351C2A',

  purple: '#9A8CF0',
  purpleTint: '#221F33',
  purpleTint2: '#292440',
  purpleBorder: '#3A3459',

  amberGrad1: '#FFB340',
  amberGrad2: '#FF6B00',

  navBg: '#0A0A0E',
  navIcon: '#8A8A8F',

  scrim: 'rgba(0, 0, 0, 0.6)',
};
