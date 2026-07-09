import WidgetKit
import SwiftUI

// Shared with the JS bridge (src/lib/widgets.ts): APP_GROUP + WIDGET_STORAGE_KEY.
private let appGroup = "group.app.avolens.mobile"
private let storageKey = "avolens.widget.snapshot.v1"

private let avoGreen = Color(red: 0.51, green: 0.73, blue: 0.29)

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
  let entry: AvoEntry
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text("AvoLens").font(.system(size: 12, weight: .semibold)).foregroundColor(.secondary)
        Spacer()
        Text("🔥 \(entry.snapshot.streak)").font(.system(size: 12, weight: .semibold)).foregroundColor(avoGreen)
      }
      Spacer()
      Text("\(entry.snapshot.kcalLeft)").font(.system(size: 34, weight: .heavy))
      Text("kcal left").font(.system(size: 12)).foregroundColor(.secondary)
      Spacer()
      HStack(spacing: 14) {
        macro("P", entry.snapshot.protein, entry.snapshot.proteinGoal)
        macro("C", entry.snapshot.carbs, entry.snapshot.carbsGoal)
        macro("F", entry.snapshot.fat, entry.snapshot.fatGoal)
      }
    }
    .padding()
    .containerBackground(for: .widget) { Color(.systemBackground) }
  }

  func macro(_ label: String, _ value: Int, _ goal: Int) -> some View {
    VStack(alignment: .leading, spacing: 1) {
      Text(label).font(.system(size: 10)).foregroundColor(.secondary)
      Text("\(value)/\(goal)").font(.system(size: 12, weight: .medium))
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
