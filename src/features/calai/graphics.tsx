/**
 * Cal AI onboarding — the illustrative interstitial screens. These are the
 * chart / comparison / testimonial cards that sit between the questions.
 * All vector art is inline react-native-svg so it renders on web + native.
 */
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Line } from 'react-native-svg';
import { F } from '@/lib/fonts';
import { C } from './kit';

/* ---------------------------------------------- "Designed to help you…" */

export function TrendChart() {
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 22, padding: 20, paddingBottom: 14 }}>
      <Text style={{ fontFamily: F.d700, fontSize: 19, color: C.ink }}>Weight trend</Text>
      <View style={{ height: 170, marginTop: 12 }}>
        <Svg width="100%" height="100%" viewBox="0 0 300 170">
          <Defs>
            <LinearGradient id="dip" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={C.ink} stopOpacity={0.12} />
              <Stop offset="1" stopColor={C.ink} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {/* dashed guide lines */}
          <Line x1="0" y1="40" x2="300" y2="40" stroke={C.border} strokeWidth={1} strokeDasharray="3 5" />
          <Line x1="0" y1="120" x2="300" y2="120" stroke={C.border} strokeWidth={1} strokeDasharray="3 5" />
          {/* "Without a plan" — rises */}
          <Path d="M12 40 C 90 44, 150 120, 292 24" fill="none" stroke={C.danger} strokeWidth={3.5} strokeLinecap="round" />
          {/* "Cal AI" plan — dips down */}
          <Path d="M12 40 C 90 40, 150 120, 292 130" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          <Circle cx="12" cy="40" r="6" fill={C.white} stroke={C.ink} strokeWidth={3} />
          <Circle cx="292" cy="130" r="6" fill={C.white} stroke={C.ink} strokeWidth={3} />
        </Svg>
        <Text style={{ position: 'absolute', right: 6, top: 60, fontFamily: F.b600, fontSize: 12.5, color: C.sub }}>Without a plan</Text>
        <View style={{ position: 'absolute', left: 4, bottom: 30, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ backgroundColor: C.ink, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text style={{ fontFamily: F.d700, fontSize: 11, color: C.white }}>AvoLens</Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.sub }}>Month 1</Text>
        <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.sub }}>Month 6</Text>
      </View>
    </View>
  );
}

/* --------------------------------------------- "great potential to crush…" */

export function PotentialChart() {
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 22, padding: 22 }}>
      <Text style={{ fontFamily: F.d700, fontSize: 19, color: C.ink }}>Your weight transition</Text>
      <View style={{ height: 150, marginTop: 18 }}>
        <Svg width="100%" height="100%" viewBox="0 0 300 150">
          <Line x1="6" y1="120" x2="294" y2="120" stroke={C.border} strokeWidth={1.5} />
          <Line x1="120" y1="10" x2="120" y2="120" stroke={C.border} strokeWidth={1} strokeDasharray="3 5" />
          <Line x1="210" y1="10" x2="210" y2="120" stroke={C.border} strokeWidth={1} strokeDasharray="3 5" />
          <Path d="M28 96 L120 84 L172 58" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="28" cy="96" r="6" fill={C.white} stroke={C.ink} strokeWidth={3} />
          <Circle cx="120" cy="84" r="6" fill={C.white} stroke={C.ink} strokeWidth={3} />
        </Svg>
        <Text style={{ position: 'absolute', left: 8, bottom: 4, fontFamily: F.b500, fontSize: 12, color: C.sub }}>3 Days</Text>
        <Text style={{ position: 'absolute', left: 104, bottom: 4, fontFamily: F.b500, fontSize: 12, color: C.sub }}>7 Days</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------- "A simpler way to stay on track" */

function PersonIcon({ check, color }: { check?: boolean; color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
      {check && <Path d="M17 13.5 18.4 15 21 12" />}
    </Svg>
  );
}

export function Comparison() {
  return (
    <View style={{ flexDirection: 'row', gap: 14, backgroundColor: C.card, borderRadius: 24, padding: 18, alignItems: 'flex-end' }}>
      <View style={{ flex: 1, backgroundColor: '#EAEAEC', borderRadius: 20, height: 210, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 26 }}>
        <Text style={{ position: 'absolute', top: 24, fontFamily: F.d700, fontSize: 15, color: C.sub, textAlign: 'center' }}>Without{'\n'}AvoLens</Text>
        <View style={{ backgroundColor: '#DDDDE0', borderRadius: 14, width: 64, height: 46, alignItems: 'center', justifyContent: 'center' }}>
          <PersonIcon color={C.sub} />
        </View>
      </View>
      <View style={{ flex: 1, backgroundColor: C.ink, borderRadius: 20, height: 250, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 26 }}>
        <Text style={{ position: 'absolute', top: 26, fontFamily: F.d700, fontSize: 15, color: C.white, textAlign: 'center' }}>With{'\n'}AvoLens</Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, width: 64, height: 46, alignItems: 'center', justifyContent: 'center' }}>
          <PersonIcon check color={C.white} />
        </View>
      </View>
    </View>
  );
}

/* ---------------------------------------- "Add calories burned back…" card */

function FlameIcon({ size = 22, color = C.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2c1 3-1 5-2 6-1.5 1.5-2 3-2 4a6 6 0 0 0 12 0c0-2-1-4-2.5-5.5C14 9 13 7 12 2Z" />
    </Svg>
  );
}

export function BurnedCard() {
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 24, height: 300, overflow: 'hidden', justifyContent: 'flex-end' }}>
      <View style={{ position: 'absolute', top: 20, right: 20, alignItems: 'center', opacity: 0.18 }}>
        <Svg width={150} height={200} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="13" cy="4" r="2" />
          <Path d="M6 20l3-5 3 2 2-4 3 3M9 15l-2-4 4-2 3 3" />
        </Svg>
      </View>
      <View style={{ margin: 18, backgroundColor: C.white, borderRadius: 18, padding: 16, width: 180 }}>
        <Text style={{ fontFamily: F.b600, fontSize: 12.5, color: C.sub }}>Today's Goal</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <FlameIcon />
          <Text style={{ fontFamily: F.d800, fontSize: 24, color: C.ink }}>600 Cals</Text>
        </View>
        <View style={{ height: 1, backgroundColor: C.border, marginVertical: 12 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M13 4v6M9 8l4-4 4 4M6 20l3-6 4 2 4-6" /></Svg>
          </View>
          <Text style={{ fontFamily: F.b600, fontSize: 12.5, color: C.sub }}>Running</Text>
        </View>
        <Text style={{ fontFamily: F.d800, fontSize: 18, color: C.ink, marginTop: 8 }}>+100 cals</Text>
      </View>
    </View>
  );
}

/* ----------------------------------------- "Rollover extra calories…" cards */

function CalRing({ used, total, badge }: { used: number; total: number; badge: string }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const frac = Math.min(1, used / total);
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 18, padding: 16, flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <FlameIcon size={16} />
        <Text style={{ fontFamily: F.b600, fontSize: 13, color: C.ink }}>{badge}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10 }}>
        <Text style={{ fontFamily: F.d800, fontSize: 30, color: C.ink }}>{used}</Text>
        <Text style={{ fontFamily: F.b600, fontSize: 13, color: C.sub2 }}>/{total}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', marginTop: 6 }}>
        <Svg width={74} height={74} viewBox="0 0 74 74">
          <Circle cx="37" cy="37" r={r} fill="none" stroke={C.border} strokeWidth={6} />
          <Circle cx="37" cy="37" r={r} fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${circ * frac} ${circ}`} transform="rotate(-90 37 37)" />
        </Svg>
      </View>
    </View>
  );
}

export function RolloverCards() {
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <CalRing used={2350} total={2500} badge="Yesterday" />
      <CalRing used={2350} total={2500} badge="Today" />
    </View>
  );
}

/* ---------------------------------------------------- testimonial reviews */

function Stars() {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Svg key={i} width={16} height={16} viewBox="0 0 24 24" fill={C.accent}>
          <Path d="M12 2l3 6.5 7 .6-5.3 4.6 1.6 6.8L12 17.3 5.7 20.5l1.6-6.8L2 9.1l7-.6z" />
        </Svg>
      ))}
    </View>
  );
}

export function Review({ name, date, body }: { name: string; date: string; body: string }) {
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 18, padding: 18, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stars />
        <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.sub2 }}>{name}, {date}</Text>
      </View>
      <Text style={{ fontFamily: F.b500, fontSize: 14, lineHeight: 21, color: C.ink2, marginTop: 12 }}>{body}</Text>
    </View>
  );
}

/* --------------------------------------------------- "Thank you" hands */

export function HandsIllustration() {
  return (
    <View style={{ width: 200, height: 200, borderRadius: 999, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={96} height={96} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" />
        <Path d="M11 12V4.5a1.5 1.5 0 0 1 3 0V12" />
        <Path d="M14 12V6a1.5 1.5 0 0 1 3 0v6" />
        <Path d="M17 12v-1.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2a6 6 0 0 1-5.4-3.4L5 15c-.6-1.2 .9-2.4 1.9-1.5L8 14.5" />
      </Svg>
    </View>
  );
}
