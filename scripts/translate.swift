// Offline batch translator for the docs build.
//
// macOS 26 ships Apple's on-device Translation framework with the language
// packs already installed. This CLI reads a JSON job file and writes a JSON
// result file, keeping the Markdown transport and token protection in the
// Node/Python helpers where it is easier to reason about.
//
//   swiftc -O -parse-as-library -framework Translation scripts/translate.swift -o /tmp/disband-translate
//   /tmp/disband-translate /tmp/jobs.json /tmp/results.json

import Foundation
import Translation

struct Job: Codable {
  let id: String
  let target: String
  let text: String
}

struct Input: Codable {
  let jobs: [Job]
}

struct Result: Codable {
  let id: String
  let text: String
}

struct Output: Codable {
  let results: [Result]
  let errors: [String]
}

func appleLanguage(_ identifier: String) -> String {
  if identifier == "zh-CN" || identifier == "zh-Hans" { return "zh-Hans" }
  return identifier
}

@main
struct Main {
  static func main() async {
    let args = CommandLine.arguments
    guard args.count == 3 else {
      FileHandle.standardError.write(Data("usage: disband-translate <jobs.json> <results.json>\n".utf8))
      exit(2)
    }

    do {
      let inputData = try Data(contentsOf: URL(fileURLWithPath: args[1]))
      let input = try JSONDecoder().decode(Input.self, from: inputData)

      var results: [Result] = []
      var errors: [String] = []
      let grouped = Dictionary(grouping: input.jobs, by: { $0.target })

      for target in grouped.keys.sorted() {
        let jobs = grouped[target] ?? []
        do {
          let session = TranslationSession(
            installedSource: Locale.Language(identifier: "en"),
            target: Locale.Language(identifier: appleLanguage(target))
          )
          try await session.prepareTranslation()

          // Apple's framework accepts a batch but can get unhappy with very
          // large requests; keep batches modest so one bad segment cannot
          // discard an entire page.
          var index = 0
          while index < jobs.count {
            let end = min(index + 40, jobs.count)
            let slice = Array(jobs[index..<end])
            let requests = slice.map {
              TranslationSession.Request(sourceText: $0.text, clientIdentifier: $0.id)
            }
            do {
              let responses = try await session.translations(from: requests)
              var byID: [String: String] = [:]
              for response in responses {
                if let id = response.clientIdentifier {
                  byID[id] = response.targetText
                }
              }
              for job in slice {
                results.append(Result(id: job.id, text: byID[job.id] ?? job.text))
                if byID[job.id] == nil {
                  errors.append("missing response for \(job.id)")
                }
              }
            } catch {
              // Fall back to one-at-a-time so a single problematic segment is
              // isolated rather than failing the rest of the page.
              for job in slice {
                do {
                  let response = try await session.translate(job.text)
                  results.append(Result(id: job.id, text: response.targetText))
                } catch {
                  errors.append("\(job.id): \(error)")
                  results.append(Result(id: job.id, text: job.text))
                }
              }
            }
            index = end
          }
        } catch {
          errors.append("target \(target): \(error)")
          for job in jobs {
            results.append(Result(id: job.id, text: job.text))
          }
        }
      }

      let output = Output(results: results, errors: errors)
      let encoder = JSONEncoder()
      encoder.outputFormatting = [.sortedKeys]
      let outputData = try encoder.encode(output)
      try outputData.write(to: URL(fileURLWithPath: args[2]), options: .atomic)
    } catch {
      FileHandle.standardError.write(Data("translation failed: \(error)\n".utf8))
      exit(1)
    }
  }
}
