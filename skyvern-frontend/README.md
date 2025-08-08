<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Skyvern Frontend](#skyvern-frontend)
  - [Quickstart](#quickstart)
    - [Populate env file](#populate-env-file)
  - [Development](#development)
  - [Build for production](#build-for-production)
  - [Preview the production build locally](#preview-the-production-build-locally)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Skyvern Frontend

## Quickstart

### Populate env file

Copy example env file:

```sh
cp .env.example .env
```

Populate `VITE_SKYVERN_API_KEY` with your API key.

Then run:

```sh
npm install
```

```sh
npm start
```

This will build the app and serve from port 8080.
After launching, visit `http://localhost:8080` and click **Login** on the
landing page. Supply a valid product license key, which is verified
against the licensing server. On first use, the backend provisions an
organization for the email tied to the key. All workflows, tasks,
credentials and artifacts are scoped to the returned `organizationID`.
The dashboard exposes a logout control in the top bar to clear the
session when finished.

## Development

```sh
npm run dev
```

This will start the development server with hot module replacement.

## Build for production

```sh
npm run build
```

This will make a production build in the `dist` directory, ready to be served.

## Preview the production build locally

```sh
npm run preview
```

or alternatively, use the `serve` package:

```sh
npx serve@latest dist
```
