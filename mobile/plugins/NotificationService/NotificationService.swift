import UserNotifications

/// Downloads the image referenced by a push payload and attaches it so iOS shows it in the banner.
class NotificationService: UNNotificationServiceExtension {
  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var bestAttemptContent: UNMutableNotificationContent?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    let content = request.content.mutableCopy() as? UNMutableNotificationContent
    bestAttemptContent = content

    guard let content = content, let imageURL = Self.imageURL(from: request.content.userInfo) else {
      deliver(request.content)
      return
    }

    URLSession.shared.downloadTask(with: imageURL) { [weak self] location, response, _ in
      if let location = location,
         let attachment = Self.makeAttachment(from: location, response: response, sourceURL: imageURL) {
        content.attachments = [attachment]
      }
      self?.deliver(content)
    }.resume()
  }

  override func serviceExtensionTimeWillExpire() {
    if let content = bestAttemptContent {
      deliver(content)
    }
  }

  private func deliver(_ content: UNNotificationContent) {
    guard let handler = contentHandler else { return }
    contentHandler = nil
    handler(content)
  }

  /// Expo puts custom `data` under `body`; `richContent.image` is Expo's own image field.
  private static func imageURL(from userInfo: [AnyHashable: Any]) -> URL? {
    var candidates: [Any?] = []
    if let body = userInfo["body"] as? [String: Any] {
      candidates.append(body["imageUrl"])
    }
    if let richContent = userInfo["richContent"] as? [String: Any] {
      candidates.append(richContent["image"])
    }
    candidates.append(userInfo["imageUrl"])

    for candidate in candidates {
      if let value = candidate as? String,
         let url = URL(string: value),
         url.scheme?.lowercased() == "https" || url.scheme?.lowercased() == "http" {
        return url
      }
    }
    return nil
  }

  private static func makeAttachment(
    from location: URL,
    response: URLResponse?,
    sourceURL: URL
  ) -> UNNotificationAttachment? {
    let fileExtension = Self.fileExtension(mimeType: response?.mimeType, sourceURL: sourceURL)
    let destination = URL(fileURLWithPath: NSTemporaryDirectory())
      .appendingPathComponent(UUID().uuidString)
      .appendingPathExtension(fileExtension)

    do {
      try FileManager.default.moveItem(at: location, to: destination)
      return try UNNotificationAttachment(identifier: "image", url: destination, options: nil)
    } catch {
      return nil
    }
  }

  private static func fileExtension(mimeType: String?, sourceURL: URL) -> String {
    switch mimeType?.lowercased() {
    case "image/jpeg", "image/jpg": return "jpg"
    case "image/png": return "png"
    case "image/gif": return "gif"
    default:
      let ext = sourceURL.pathExtension.lowercased()
      return ["jpg", "jpeg", "png", "gif"].contains(ext) ? ext : "jpg"
    }
  }
}
