/**
 * AvoLens design tokens — a 1:1 port of the CSS variables in the web app's
 * `src/app/globals.css`, exposed through a React context instead of CSS vars.
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
  bg: '#f5f7f3',
  surface: '#ffffff',
  surface2: '#f7f9f5',
  surface3: '#f0f3ef',
  border: '#e5ebe2',
  border2: '#f0f3ef',
  ink: '#26331a',
  muted: '#7c8a7f',
  muted2: '#a9b4ab',
  faint: '#c0cac1',

  green: '#6e9e3a',
  greenGrad1: '#a9c24a',
  greenGrad2: '#5a8a2e',
  greenTint: '#f2f2e2',
  greenTrack: '#edf1eb',
  chartTrack: '#dcefc5',

  protein: '#e4586e',
  proteinTint: '#fbeaed',
  carbs: '#e8a13b',
  carbsTint: '#fbf1e0',
  fat: '#4da8f0',
  fatTint: '#e9f3fc',
  fatTint2: '#edf6fc',
  fatTint3: '#d7eaf8',

  purple: '#7c6be6',
  purpleTint: '#f5f3fc',
  purpleTint2: '#eeebfb',
  purpleBorder: '#e5e0f5',

  amberGrad1: '#f2b84b',
  amberGrad2: '#e8862e',

  navBg: '#26331a',
  navIcon: '#8fa096',

  scrim: 'rgba(0, 0, 0, 0.4)',
};

export const darkTheme: Theme = {
  bg: '#12160f',
  surface: '#1b2117',
  surface2: '#20261b',
  surface3: '#262d20',
  border: '#313b2a',
  border2: '#2a3324',
  ink: '#eef2ea',
  muted: '#9fae96',
  muted2: '#7c8a74',
  faint: '#5c6854',

  green: '#83ba49',
  greenGrad1: '#b7d15f',
  greenGrad2: '#6e9e3a',
  greenTint: '#26311d',
  greenTrack: '#262d20',
  chartTrack: '#33421f',

  protein: '#ec7284',
  proteinTint: '#2e1e21',
  carbs: '#f0b458',
  carbsTint: '#2f2618',
  fat: '#6bb8f4',
  fatTint: '#1b2733',
  fatTint2: '#1c2833',
  fatTint3: '#223244',

  purple: '#9a8cf0',
  purpleTint: '#221f33',
  purpleTint2: '#292440',
  purpleBorder: '#3a3459',

  amberGrad1: '#f2b84b',
  amberGrad2: '#e8862e',

  navBg: '#0c0f0a',
  navIcon: '#6c7a63',

  scrim: 'rgba(0, 0, 0, 0.6)',
};
