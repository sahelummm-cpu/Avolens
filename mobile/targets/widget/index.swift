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
private let greenGrad = LinearGradient(
  colors: [Color(hex: 0xa9c24a), Color(hex: 0x5a8a2e)],
  startPoint: .topLeading, endPoint: .bottomTrailing
)
private let greenTrack = Color(hex: 0xedf1eb)
private let proteinColor = Color(hex: 0xe4586e)
private let proteinTint = Color(hex: 0xfbeaed)
private let carbsColor = Color(hex: 0xe8a13b)
private let carbsTint = Color(hex: 0xfbf1e0)
private let fatColor = Color(hex: 0x4da8f0)
private let fatTint = Color(hex: 0xe9f3fc)

private func frac(_ value: Int, _ total: Int) -> Double {
  total > 0 ? min(max(Double(value) / Double(total), 0), 1) : 0
}

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

// The four concentric calorie/macro rings from the Home dashboard card.
struct AvoRing: View {
  let s: AvoSnapshot
  let size: CGFloat
  var body: some View {
    let u = size / 116
    ZStack {
      RingArc(diameter: 116 * u, lineWidth: 11 * u, track: greenTrack, style: greenGrad, frac: frac(s.kcalGoal - s.kcalLeft, s.kcalGoal))
      RingArc(diameter: 90 * u, lineWidth: 9 * u, track: proteinTint, style: proteinColor, frac: frac(s.protein, s.proteinGoal))
      RingArc(diameter: 66 * u, lineWidth: 9 * u, track: carbsTint, style: carbsColor, frac: frac(s.carbs, s.carbsGoal))
      RingArc(diameter: 44 * u, lineWidth: 9 * u, track: fatTint, style: fatColor, frac: frac(s.fat, s.fatGoal))
    }
    .frame(width: size, height: size)
  }
}

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

  static let empty = AvoSnapshot(
    kcalLeft: 0, kcalGoal: 2050,
    protein: 0, proteinGoal: 124,
    carbs: 0, carbsGoal: 180,
    fat: 0, fatGoal: 56,
    streak: 0
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

// MARK: - Home Screen (systemSmall / systemMedium)

struct HomeWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: AvoEntry

  var body: some View {
    Group {
      if family == .systemSmall {
        smallLayout
      } else {
        mediumLayout
      }
    }
    .containerBackground(for: .widget) { Color(.systemBackground) }
  }

  // systemSmall: the ring with the kcal-left number in the middle.
  var smallLayout: some View {
    ZStack {
      AvoRing(s: entry.snapshot, size: 128)
      VStack(spacing: 0) {
        Text("\(entry.snapshot.kcalLeft)").font(.system(size: 26, weight: .heavy)).foregroundColor(.primary)
        Text("kcal left").font(.system(size: 10)).foregroundColor(.secondary)
      }
    }
    .padding(12)
  }

  // systemMedium: ring on the left, number + macro rows on the right (Home card).
  var mediumLayout: some View {
    HStack(spacing: 16) {
      AvoRing(s: entry.snapshot, size: 112)
      VStack(alignment: .leading, spacing: 2) {
        Text("\(entry.snapshot.kcalLeft)").font(.system(size: 30, weight: .heavy)).foregroundColor(.primary)
        Text("kcal left").font(.system(size: 12)).foregroundColor(.secondary)
        Spacer().frame(height: 6)
        macroRow("Protein", entry.snapshot.protein, entry.snapshot.proteinGoal, proteinColor)
        macroRow("Carbs", entry.snapshot.carbs, entry.snapshot.carbsGoal, carbsColor)
        macroRow("Fat", entry.snapshot.fat, entry.snapshot.fatGoal, fatColor)
      }
    }
    .padding()
  }

  func macroRow(_ label: String, _ value: Int, _ goal: Int, _ color: Color) -> some View {
    HStack(spacing: 7) {
      Circle().fill(color).frame(width: 8, height: 8)
      Text(label).font(.system(size: 12)).foregroundColor(.secondary)
      Spacer()
      Text("\(value)/\(goal)g").font(.system(size: 12, weight: .semibold)).foregroundColor(.primary)
    }
  }
}

// MARK: - Lock Screen accessories

struct LockRectangularView: View {
  let entry: AvoEntry
  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text("\(entry.snapshot.kcalLeft) kcal left").font(.system(size: 15, weight: .semibold))
      Text("P\(entry.snapshot.protein) · C\(entry.snapshot.carbs) · F\(entry.snapshot.fat)")
        .font(.system(size: 12)).foregroundColor(.secondary)
    }
  }
}

struct LockCircularView: View {
  let entry: AvoEntry
  var body: some View {
    let goal = entry.snapshot.kcalGoal
    let eaten = goal - entry.snapshot.kcalLeft
    let frac = goal > 0 ? min(max(Double(eaten) / Double(goal), 0), 1) : 0
    Gauge(value: frac) {
      Text("kcal")
    } currentValueLabel: {
      Text("\(entry.snapshot.kcalLeft)").font(.system(size: 13, weight: .semibold))
    }
    .gaugeStyle(.accessoryCircular)
  }
}

struct AvoLensWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  let entry: AvoEntry

  var body: some View {
    switch family {
    case .accessoryRectangular:
      LockRectangularView(entry: entry)
    case .accessoryCircular:
      LockCircularView(entry: entry)
    case .accessoryInline:
      Text("\(entry.snapshot.kcalLeft) kcal left")
    default:
      HomeWidgetView(entry: entry)
    }
  }
}

@main
struct AvoLensWidget: Widget {
  let kind = "AvoLensWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: AvoProvider()) { entry in
      AvoLensWidgetEntryView(entry: entry)
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
