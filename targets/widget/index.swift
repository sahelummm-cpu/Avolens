import WidgetKit
import SwiftUI

// Shared with the JS bridge (src/lib/widgets.ts): APP_GROUP + WIDGET_STORAGE_KEY.
private let appGroup = "group.app.avolens.mobile"
private let storageKey = "avolens.widget.snapshot.v1"

// Light-theme card palette (src/lib/theme.tsx → lightTheme).
extension Color {
  init(hex: UInt32) {
    self.init(
      .sRGB,
      red: Double((hex >> 16) & 0xff) / 255,
      green: Double((hex >> 8) & 0xff) / 255,
      blue: Double(hex & 0xff) / 255,
      opacity: 1
    )
  }
}

private let inkColor = Color(hex: 0x26331a)
private let mutedColor = Color(hex: 0x7c8a7f)
private let greenColor = Color(hex: 0x6e9e3a)
private let greenTrack = Color(hex: 0xedf1eb)
private let proteinColor = Color(hex: 0xe4586e)
private let proteinTint = Color(hex: 0xf1e6e9)
private let carbsColor = Color(hex: 0xe8a13b)
private let carbsTint = Color(hex: 0xf3ecdd)
private let flameColor = Color(hex: 0xe8862e)
private let waterColor = Color(hex: 0x4da8f0)

private func frac(_ value: Int, _ total: Int) -> Double {
  total > 0 ? min(max(Double(value) / Double(total), 0), 1) : 0
}

private func litersText(_ glasses: Int) -> String {
  String(format: "%.1f", Double(glasses) * 0.5)
}

// MARK: - Snapshot

struct AvoSnapshot: Codable {
  var kcalLeft: Int
  var kcalGoal: Int
  var protein: Int
  var proteinGoal: Int
  var carbs: Int
  var carbsGoal: Int
  var fat: Int
  var fatGoal: Int
  var streak: Int
  var glasses: Int
  var glassesGoal: Int

  static let empty = AvoSnapshot(
    kcalLeft: 0, kcalGoal: 2050,
    protein: 0, proteinGoal: 124,
    carbs: 0, carbsGoal: 180,
    fat: 0, fatGoal: 56,
    streak: 0, glasses: 0, glassesGoal: 5
  )
}

func loadSnapshot() -> AvoSnapshot {
  guard let defaults = UserDefaults(suiteName: appGroup),
        let raw = defaults.string(forKey: storageKey),
        let data = raw.data(using: .utf8),
        let decoded = try? JSONDecoder().decode(AvoSnapshot.self, from: data)
  else { return .empty }
  return decoded
}

struct AvoEntry: TimelineEntry {
  let date: Date
  let snapshot: AvoSnapshot
}

struct AvoProvider: TimelineProvider {
  func placeholder(in context: Context) -> AvoEntry {
    AvoEntry(date: Date(), snapshot: .empty)
  }
  func getSnapshot(in context: Context, completion: @escaping (AvoEntry) -> Void) {
    completion(AvoEntry(date: Date(), snapshot: loadSnapshot()))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<AvoEntry>) -> Void) {
    let entry = AvoEntry(date: Date(), snapshot: loadSnapshot())
    // Refresh roughly every 30 min; the app also nudges reloads when the log changes.
    let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

// MARK: - Shared pieces

// One ring: a full track circle plus the rounded progress arc, rotated -90°.
struct RingArc<S: ShapeStyle>: View {
  let diameter: CGFloat
  let lineWidth: CGFloat
  let track: Color
  let style: S
  let frac: Double
  var body: some View {
    ZStack {
      Circle().stroke(track, lineWidth: lineWidth)
      Circle()
        .trim(from: 0, to: CGFloat(min(max(frac, 0), 1)))
        .stroke(style, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
        .rotationEffect(.degrees(-90))
    }
    .frame(width: diameter, height: diameter)
  }
}

// The concentric calorie / protein / carbs ring from the Home dashboard card.
struct AvoRing: View {
  let s: AvoSnapshot
  let size: CGFloat
  var body: some View {
    let u = size / 116
    ZStack {
      RingArc(diameter: 116 * u, lineWidth: 11 * u, track: greenTrack, style: greenColor, frac: frac(s.kcalGoal - s.kcalLeft, s.kcalGoal))
      RingArc(diameter: 92 * u, lineWidth: 11 * u, track: proteinTint, style: proteinColor, frac: frac(s.protein, s.proteinGoal))
      RingArc(diameter: 68 * u, lineWidth: 11 * u, track: carbsTint, style: carbsColor, frac: frac(s.carbs, s.carbsGoal))
    }
    .frame(width: size, height: size)
  }
}

// A macro progress bar (label + value + fill), matching the Nibbl v2 widget.
struct MacroBar: View {
  let label: String
  let value: Int
  let frac: Double
  let color: Color
  let track: Color
  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      HStack {
        Text(label).font(.system(size: 11)).foregroundColor(mutedColor)
        Spacer()
        Text("\(value)g").font(.system(size: 11, weight: .semibold)).foregroundColor(inkColor)
      }
      GeometryReader { geo in
        ZStack(alignment: .leading) {
          Capsule().fill(track)
          Capsule().fill(color).frame(width: geo.size.width * min(max(frac, 0), 1))
        }
      }
      .frame(height: 6)
    }
  }
}

// MARK: - Summary widget (ring card + lock accessories)

struct SummaryView: View {
  @Environment(\.widgetFamily) var family
  let entry: AvoEntry

  var body: some View {
    switch family {
    case .accessoryRectangular: lockRectangular
    case .accessoryCircular: lockCircular
    case .accessoryInline: Text("\(entry.snapshot.kcalLeft) kcal left")
    case .systemSmall: smallLayout.containerBackground(for: .widget) { Color(.systemBackground) }
    default: mediumLayout.containerBackground(for: .widget) { Color(.systemBackground) }
    }
  }

  // systemSmall: the ring with the kcal-left number in the middle.
  var smallLayout: some View {
    ZStack {
      AvoRing(s: entry.snapshot, size: 128)
      VStack(spacing: 0) {
        Text("\(entry.snapshot.kcalLeft)").font(.system(size: 26, weight: .heavy)).foregroundColor(.primary)
        Text("LEFT").font(.system(size: 9, weight: .semibold)).tracking(1).foregroundColor(.secondary)
      }
    }
    .padding(12)
  }

  // systemMedium: ring (kcal-left number inside) on the left, brand + Protein /
  // Carbs progress bars on the right — the Nibbl v2 Home Widget card.
  var mediumLayout: some View {
    HStack(spacing: 16) {
      ZStack {
        AvoRing(s: entry.snapshot, size: 112)
        VStack(spacing: 0) {
          Text("\(entry.snapshot.kcalLeft)").font(.system(size: 22, weight: .heavy)).foregroundColor(inkColor)
          Text("LEFT").font(.system(size: 8, weight: .semibold)).tracking(1).foregroundColor(mutedColor)
        }
      }
      VStack(alignment: .leading, spacing: 9) {
        HStack(spacing: 6) {
          Image(systemName: "leaf.fill").font(.system(size: 14)).foregroundColor(greenColor)
          Text("AvoLens").font(.system(size: 14, weight: .bold)).foregroundColor(inkColor)
        }
        MacroBar(label: "Protein", value: entry.snapshot.protein, frac: frac(entry.snapshot.protein, entry.snapshot.proteinGoal), color: proteinColor, track: proteinTint)
        MacroBar(label: "Carbs", value: entry.snapshot.carbs, frac: frac(entry.snapshot.carbs, entry.snapshot.carbsGoal), color: carbsColor, track: carbsTint)
      }
    }
    .padding()
  }

  var lockRectangular: some View {
    HStack(spacing: 8) {
      Gauge(value: frac(entry.snapshot.kcalGoal - entry.snapshot.kcalLeft, entry.snapshot.kcalGoal)) {
        Image(systemName: "leaf.fill")
      }
      .gaugeStyle(.accessoryCircularCapacity)
      VStack(alignment: .leading, spacing: 1) {
        Text("\(entry.snapshot.kcalLeft) kcal left").font(.system(size: 15, weight: .semibold))
        Text("P \(entry.snapshot.protein) · C \(entry.snapshot.carbs) · F \(entry.snapshot.fat) g")
          .font(.system(size: 12)).foregroundColor(.secondary)
      }
    }
  }

  var lockCircular: some View {
    Gauge(value: frac(entry.snapshot.kcalGoal - entry.snapshot.kcalLeft, entry.snapshot.kcalGoal)) {
      Text("kcal")
    } currentValueLabel: {
      Text("\(entry.snapshot.kcalLeft)").font(.system(size: 13, weight: .semibold))
    }
    .gaugeStyle(.accessoryCircular)
  }
}

struct AvoLensSummaryWidget: Widget {
  let kind = "AvoLensWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: AvoProvider()) { entry in
      SummaryView(entry: entry)
    }
    .configurationDisplayName("AvoLens")
    .description("Calories left and macros at a glance.")
    .supportedFamilies([
      .systemSmall,
      .systemMedium,
      .accessoryRectangular,
      .accessoryCircular,
      .accessoryInline,
    ])
  }
}

// MARK: - Streak widget

struct StreakView: View {
  @Environment(\.widgetFamily) var family
  let entry: AvoEntry

  var body: some View {
    switch family {
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        VStack(spacing: 0) {
          Image(systemName: "flame.fill").font(.system(size: 12))
          Text("\(entry.snapshot.streak)").font(.system(size: 15, weight: .bold))
        }
      }
    case .accessoryInline:
      Label("\(entry.snapshot.streak) day streak", systemImage: "flame.fill")
    default:
      VStack(alignment: .leading) {
        Image(systemName: "flame.fill").font(.system(size: 22)).foregroundColor(flameColor)
        Spacer()
        Text("\(entry.snapshot.streak)").font(.system(size: 26, weight: .heavy)).foregroundColor(inkColor)
        Text("day streak").font(.system(size: 11)).foregroundColor(mutedColor)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
      .padding()
      .containerBackground(for: .widget) { Color(.systemBackground) }
    }
  }
}

struct AvoLensStreakWidget: Widget {
  let kind = "AvoLensStreakWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: AvoProvider()) { entry in
      StreakView(entry: entry)
    }
    .configurationDisplayName("AvoLens Streak")
    .description("Your current logging streak.")
    .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryInline])
  }
}

// MARK: - Water widget

struct WaterView: View {
  @Environment(\.widgetFamily) var family
  let entry: AvoEntry

  var body: some View {
    switch family {
    case .accessoryCircular:
      Gauge(value: frac(entry.snapshot.glasses, entry.snapshot.glassesGoal)) {
        Image(systemName: "drop.fill")
      } currentValueLabel: {
        Text(litersText(entry.snapshot.glasses)).font(.system(size: 12, weight: .semibold))
      }
      .gaugeStyle(.accessoryCircular)
    case .accessoryInline:
      Label("\(litersText(entry.snapshot.glasses)) L water", systemImage: "drop.fill")
    default:
      VStack(alignment: .leading) {
        Image(systemName: "drop.fill").font(.system(size: 22)).foregroundColor(waterColor)
        Spacer()
        HStack(alignment: .lastTextBaseline, spacing: 2) {
          Text(litersText(entry.snapshot.glasses)).font(.system(size: 26, weight: .heavy)).foregroundColor(inkColor)
          Text("L").font(.system(size: 13, weight: .semibold)).foregroundColor(mutedColor)
        }
        Text("water today").font(.system(size: 11)).foregroundColor(mutedColor)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
      .padding()
      .containerBackground(for: .widget) { Color(.systemBackground) }
    }
  }
}

struct AvoLensWaterWidget: Widget {
  let kind = "AvoLensWaterWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: AvoProvider()) { entry in
      WaterView(entry: entry)
    }
    .configurationDisplayName("AvoLens Water")
    .description("Water logged today.")
    .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryInline])
  }
}

// MARK: - Bundle

@main
struct AvoLensWidgetBundle: WidgetBundle {
  var body: some Widget {
    AvoLensSummaryWidget()
    AvoLensStreakWidget()
    AvoLensWaterWidget()
  }
}
