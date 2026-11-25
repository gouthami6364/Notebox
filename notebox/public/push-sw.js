self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let data;
    try {
      data = event.data ? event.data.json() : {};
    } catch {
      data = {
        title: "New Notebox upload",
        body: "A new document was added.",
      };
    }

    return self.registration.showNotification(
      data.title || "New Notebox upload",
      {
        body: data.body || "A new document was added to your class notes.",
        icon: "/icon-192.png",
        badge: "/favicon-64.png",
        tag: data.tag || `notebox-${Date.now()}`,
        data: { url: data.url || "/#/" },
      },
    );
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = new URL(
    event.notification.data?.url || "/#/",
    self.location.origin,
  ).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && "navigate" in client) {
        await client.navigate(target);
        return client.focus();
      }
    }

    return self.clients.openWindow(target);
  })());
});