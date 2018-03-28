# hyper-broadcast

[![CI Status](https://circleci.com/gh/chabou/hyper-broadcast.svg?style=shield)](https://circleci.com/gh/chabou/hyper-broadcast)
[![NPM version](https://badge.fury.io/js/hyper-broadcast.svg)](https://www.npmjs.com/package/hyper-broadcast)
![Downloads](https://img.shields.io/npm/dm/hyper-broadcast.svg?style=flat)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

Extension for [Hyper.app](https://hyper.is) to broadcast user inputs to multiple terms.

![Screenshot](https://cloud.githubusercontent.com/assets/4137761/24778477/135b1200-1b2b-11e7-8f4a-16b64f66c0a3.gif)

## Install

### Using [hpm](https://github.com/zeit/hpm)

```
hpm install hyper-broadcast
```

### Manually

To install, edit `~/.hyper.js` and add `"hyper-broadcast"` to `plugins`:

```
plugins: [
  "hyper-broadcast",
],
```

## Configuration

### Default configuration:

```js
module.exports = {
  config: {
    // other configs...
    broadcast: {
      debug: false,
      hotkeys: {
        selectCurrentPane: "Command+Alt+Shift+B",
        selectCurrentTabPanes: "Command+Alt+B",
        selectAllPanes: "Command+Shift+B",
        toggleCurrentPane: "Command+Alt+Control+Shift+B"
      },
      indicatorStyle: {
        position: "absolute",
        top: 5,
        right: 10,
        borderRadius: "50%",
        width: "10px",
        height: "10px",
        background: "red"
      }
    }
  }
  //...
};
```

For hotkeys, you can use any [Electron Accelerator](https://github.com/electron/electron/blob/master/docs/api/accelerator.md)

## Licence

[MIT](LICENSE.md)
