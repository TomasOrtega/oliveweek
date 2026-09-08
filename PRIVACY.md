# Privacy

OliveWeek has no application backend, account system, analytics script, advertising script, third-party recipe API or runtime API key.

Plans, pantry quantities, favorites, saved plans and user-created ingredients/recipes are stored in the browser's local storage under `oliveweek.v2`. They are not uploaded by the application. The optional calorie calculator does not save the body measurements entered into it.

Exported backups are ordinary JSON files that may contain personal dietary preferences. They are not encrypted. Keep them private and do not commit them to a public repository. Importing a backup replaces local state only after validation and confirmation. There is no cloud synchronization.

The browser requests the static app, recipe catalogue and locally hosted photographs from the site's host. GitHub Pages may keep normal access logs, including network metadata, under GitHub's own privacy terms. "No app backend" does not mean the hosting provider sees no requests.

Opening an external source or GitHub link visits that provider. External links use a no-referrer policy and are not fetched automatically by the app. The app's content security policy limits script, style and network requests to the same origin.

A service worker caches the static app and viewed photos. It does not contain private plans or personal data. Delete both site storage and service-worker caches through your browser's site-data controls to remove local app data completely. Clearing data is destructive, so export a backup first.

A private browser window may discard all saved information when it closes. Browsers may also evict local data. Export backups regularly. A browser or operating-system account shared with others is not a private vault, and local storage is not encrypted.
