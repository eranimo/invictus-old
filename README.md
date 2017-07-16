# Invictus

WIP browser game engine.

![Screenshot of UI](assets/images/screenshot.png)

## Features

* Zoomable world map
* Map views: heightmap, sea level, radiation (temperature), rainfall, and biome
* Asynchronous worker process architecture for map generation

## Installation

Ensure you have node 7.9.0:

```
$ node --version
7.9.0
```

Checkout the repo.

```
git checkout https://github.com/eranimo/invictus.git
cd invictus
```

Install dependencies.

```
npm install
```

Run the webpack and development server.

```
npm run dev
```

Look for `Project is running at http://localhost:4000/` in the output. Copy and
paste that URL in your browser's URL bar to view the website.
