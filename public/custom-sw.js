/* global self */

self.addEventListener("push", function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "TrainIQ";
    const options = {
      body: data.body || "",
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: data.url || "/dashboard",
      actions: data.actions || [],
      tag: data.tag || "trainiq-notification",
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("TrainIQ", {
        body: text,
        icon: "/icon.svg",
      })
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
