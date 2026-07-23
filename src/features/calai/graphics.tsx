/**
 * Cal AI onboarding — the illustrative interstitial screens. These are the
 * chart / comparison / testimonial cards that sit between the questions.
 * All vector art is inline react-native-svg so it renders on web + native.
 */
import { Image, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Line } from 'react-native-svg';
import { RUNNER_BASE64 } from './animalIcons';
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
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="7" r="4" />
      <Path d="M5 21c0-3.5 3-6 7-6s7 2.5 7 6" />
      {check && <Path d="M15 11l2 2 4-4" strokeWidth={2.5} />}
    </Svg>
  );
}

export function Comparison() {
  return (
    <View style={{ backgroundColor: '#F6F5F8', borderRadius: 28, padding: 22, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 16, width: '100%', height: 230 }}>
        {/* Without AvoLens Card */}
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 22, overflow: 'hidden', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }}>
          <Text style={{ fontFamily: F.d700, fontSize: 15, color: C.ink, textAlign: 'center', marginTop: 24, lineHeight: 19 }}>
            Without{'\n'}AvoLens
          </Text>
          <View style={{ width: '100%', height: 64, backgroundColor: '#E3E3E6', borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
            <PersonIcon color="#66656E" />
          </View>
        </View>

        {/* With AvoLens Card */}
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 22, overflow: 'hidden', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
          <Text style={{ fontFamily: F.d700, fontSize: 15, color: C.ink, textAlign: 'center', marginTop: 24, lineHeight: 19 }}>
            With{'\n'}AvoLens
          </Text>
          <View style={{ width: '100%', height: 146, backgroundColor: C.ink, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            <PersonIcon check color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Subtitle checkmark */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20 }}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#93929A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <Path d="m5 12 5 5 9-11" />
        </Svg>
        <Text style={{ fontFamily: F.b600, fontSize: 13.5, color: '#8A8992' }}>Small daily actions lead to progress</Text>
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
    <View style={{ backgroundColor: C.card, borderRadius: 24, height: 320, overflow: 'hidden', justifyContent: 'flex-end', position: 'relative' }}>
      <Image
        source={{ uri: RUNNER_BASE64 }}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
      />
      <View style={{ margin: 18, backgroundColor: C.white, borderRadius: 20, padding: 18, width: 190, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 }}>
        <Text style={{ fontFamily: F.b600, fontSize: 13, color: C.sub }}>Today's Goal</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <FlameIcon />
          <Text style={{ fontFamily: F.d800, fontSize: 24, color: C.ink }}>600 Cals</Text>
        </View>
        <View style={{ height: 1, backgroundColor: C.border, marginVertical: 12 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 17l6-6 4 4 6-8" />
            </Svg>
          </View>
          <Text style={{ fontFamily: F.b600, fontSize: 13, color: C.sub }}>Running</Text>
        </View>
        <View style={{ marginTop: 8, backgroundColor: '#F4F2F8', borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' }}>
          <Text style={{ fontFamily: F.d800, fontSize: 14, color: C.ink }}>+100 cals</Text>
        </View>
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
    <View style={{ height: 290, width: '100%', position: 'relative', marginTop: 10 }}>
      {/* Yesterday Card (Top Left) */}
      <View
        style={{
          width: 175,
          backgroundColor: '#FFFFFF',
          borderRadius: 22,
          padding: 16,
          position: 'absolute',
          top: 0,
          left: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 4,
          borderWidth: 1,
          borderColor: '#F0EFEF',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8F7FA', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 99, alignSelf: 'flex-start' }}>
          <FlameIcon size={14} />
          <Text style={{ fontFamily: F.b600, fontSize: 13, color: C.ink }}>Yesterday</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 14 }}>
          <Text style={{ fontFamily: F.d800, fontSize: 32, color: C.ink, letterSpacing: -0.8 }}>2350</Text>
          <Text style={{ fontFamily: F.b600, fontSize: 14, color: '#A09FA6' }}>/2500</Text>
        </View>

        {/* Ring & Floating Tooltip */}
        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 14, height: 86, position: 'relative' }}>
          <Svg width={74} height={74} viewBox="0 0 74 74">
            <Circle cx="37" cy="37" r={30} fill="none" stroke="#EFEFEF" strokeWidth={5.5} />
            <Circle cx="37" cy="37" r={30} fill="none" stroke={C.ink} strokeWidth={5.5} strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 30 * (2350 / 2500)} ${2 * Math.PI * 30}`} transform="rotate(-90 37 37)" />
          </Svg>
          <View style={{ position: 'absolute' }}>
            <FlameIcon size={14} />
          </View>
          <View style={{ position: 'absolute', left: -14, top: 4, backgroundColor: C.ink, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 }}>
            <Text style={{ fontFamily: F.b600, fontSize: 9.5, color: '#FFFFFF' }}>Cals left</Text>
            <Text style={{ fontFamily: F.d800, fontSize: 12, color: '#FFFFFF', marginTop: 1 }}>150</Text>
          </View>
        </View>
      </View>

      {/* Today Card (Offset Bottom Right) */}
      <View
        style={{
          width: 185,
          backgroundColor: '#FFFFFF',
          borderRadius: 22,
          padding: 16,
          position: 'absolute',
          top: 60,
          right: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 6,
          borderWidth: 1,
          borderColor: '#F0EFEF',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8F7FA', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 99, alignSelf: 'flex-start' }}>
          <FlameIcon size={14} />
          <Text style={{ fontFamily: F.b600, fontSize: 13, color: C.ink }}>Today</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 14 }}>
          <Text style={{ fontFamily: F.d800, fontSize: 32, color: C.ink, letterSpacing: -0.8 }}>2350</Text>
          <Text style={{ fontFamily: F.b600, fontSize: 14, color: '#A09FA6' }}>/2500</Text>
        </View>

        {/* Rollover badge: ⏱ +150 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF3FE', borderRadius: 99, paddingVertical: 3, paddingHorizontal: 9, marginTop: 6, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 11 }}>⏱</Text>
          <Text style={{ fontFamily: F.d700, fontSize: 12, color: '#6A8BFF' }}>+150</Text>
        </View>

        {/* Ring & Floating Tooltip */}
        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 10, height: 86, position: 'relative' }}>
          <Svg width={74} height={74} viewBox="0 0 74 74">
            <Circle cx="37" cy="37" r={30} fill="none" stroke="#EFEFEF" strokeWidth={5.5} />
            <Circle cx="37" cy="37" r={30} fill="none" stroke={C.ink} strokeWidth={5.5} strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 30 * (2350 / 2500)} ${2 * Math.PI * 30}`} transform="rotate(-90 37 37)" />
          </Svg>
          <View style={{ position: 'absolute' }}>
            <FlameIcon size={14} />
          </View>
          <View style={{ position: 'absolute', left: -18, top: 8, backgroundColor: C.ink, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 }}>
            <Text style={{ fontFamily: F.b600, fontSize: 9.5, color: '#FFFFFF' }}>Cals left</Text>
            <Text style={{ fontFamily: F.d800, fontSize: 12, color: '#FFFFFF', marginTop: 1 }}>
              150 <Text style={{ color: '#8AA0FF' }}>+ 150</Text>
            </Text>
          </View>
        </View>
      </View>
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
