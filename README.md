# Turborepo Template Upgrade <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 40px"/>

[![test](https://github.com/react18-tools/turborepo-template-upgrade/actions/workflows/test.yml/badge.svg)](https://github.com/react18-tools/turborepo-template-upgrade/actions/workflows/test.yml) [![Maintainability](https://api.codeclimate.com/v1/badges/aa896ec14c570f3bb274/maintainability)](https://codeclimate.com/github/react18-tools/turborepo-template-upgrade/maintainability) [![codecov](https://codecov.io/gh/react18-tools/turborepo-template-upgrade/graph/badge.svg)](https://codecov.io/gh/react18-tools/turborepo-template-upgrade) [![Version](https://img.shields.io/npm/v/turborepo-template-upgrade-upgrade.svg?colorB=green)](https://www.npmjs.com/package/turborepo-template-upgrade-upgrade) [![Downloads](https://img.jsdelivr.com/img.shields.io/npm/d18m/turborepo-template-upgrade-upgrade.svg)](https://www.npmjs.com/package/turborepo-template-upgrade-upgrade) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/turborepo-template-upgrade-upgrade) [![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/from-referrer/)

Turborepo Template Upgrade is a comprehensive library designed to unlock the full potential of React 18 server components. It provides customizable loading animation components and a fullscreen loader container, seamlessly integrating with React and Next.js.

✅ Fully Treeshakable (import from `turborepo-template-upgrade-upgrade/client/loader-container`)

✅ Fully TypeScript Supported

✅ Leverages the power of React 18 Server components

✅ Compatible with all React 18 build systems/tools/frameworks

✅ Documented with [Typedoc](https://react18-tools.github.io/turborepo-template-upgrade) ([Docs](https://react18-tools.github.io/turborepo-template-upgrade))

✅ Examples for Next.js, and Vite

> <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 20px"/> Star [this repository](https://github.com/react18-tools/turborepo-template-upgrade) and share it with your friends.

## Getting Started

### Installation

```bash
pnpm add turborepo-template-upgrade-upgrade
```

**_or_**

```bash
npm install turborepo-template-upgrade-upgrade
```

**_or_**

```bash
yarn add turborepo-template-upgrade-upgrade
```

## Want Lite Version? [![npm bundle size](https://img.shields.io/bundlephobia/minzip/turborepo-template-upgrade-upgrade-lite)](https://www.npmjs.com/package/turborepo-template-upgrade-upgrade-lite) [![Version](https://img.shields.io/npm/v/turborepo-template-upgrade-upgrade-lite.svg?colorB=green)](https://www.npmjs.com/package/turborepo-template-upgrade-upgrade-lite) [![Downloads](https://img.jsdelivr.com/img.shields.io/npm/d18m/turborepo-template-upgrade-upgrade-lite.svg)](https://www.npmjs.com/package/turborepo-template-upgrade-upgrade-lite)

```bash
pnpm add turborepo-template-upgrade-upgrade-lite
```

**or**

```bash
npm install turborepo-template-upgrade-upgrade-lite
```

**or**

```bash
yarn add turborepo-template-upgrade-upgrade-lite
```

> You need `r18gs` as a peer-dependency

### Import Styles

You can import styles globally or within specific components.

```css
/* globals.css */
@import "turborepo-template-upgrade-upgrade/dist";
```

```tsx
// layout.tsx
import "turborepo-template-upgrade-upgrade/dist/index.css";
```

For selective imports:

```css
/* globals.css */
@import "turborepo-template-upgrade-upgrade/dist/client"; /** required if you are using LoaderContainer */
@import "turborepo-template-upgrade-upgrade/dist/server/bars/bars1";
```

### Usage

Using loaders is straightforward.

```tsx
import { Bars1 } from "turborepo-template-upgrade-upgrade/dist/server/bars/bars1";

export default function MyComponent() {
  return someCondition ? <Bars1 /> : <>Something else...</>;
}
```

For detailed API and options, refer to [the API documentation](https://react18-tools.github.io/turborepo-template-upgrade).

**Using LoaderContainer**

`LoaderContainer` is a fullscreen component. You can add this component directly in your layout and then use `useLoader` hook to toggle its visibility.

```tsx
// layout.tsx
<LoaderContainer />
	 ...
```

```tsx
// some other page or component
import { useLoader } from "turborepo-template-upgrade-upgrade/dist/hooks";

export default MyComponent() {
	const { setLoading } = useLoader();
	useCallback(()=>{
		setLoading(true);
		...do some work
		setLoading(false);
	}, [])
	...
}
```

## License

This library is licensed under the MPL-2.0 open-source license.



> <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 20px"/> Please enroll in [our courses](https://mayank-chaudhari.vercel.app/courses) or [sponsor](https://github.com/sponsors/mayank1513) our work.

<hr />

<p align="center" style="text-align:center">with 💖 by <a href="https://mayank-chaudhari.vercel.app" target="_blank">Mayank Kumar Chaudhari</a></p>
