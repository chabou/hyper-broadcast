# hyper-broadcast
Extension for [Hyper.app](https://hyper.is) to broadcast user inputs to multiple terms.


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
``` js
module.exports = {
  config: {
    // other configs...
    broadcast: {
      debug: false,
      hotkeys: {
        selectCurrentPane: 'Command+Alt+Shift+B',
        selectCurrentTabPanes: 'Command+Alt+B',
        selectAllPanes: 'Command+Shift+B',
        toggleCurrentPane: 'Command+Alt+Control+Shift+B'
      },
      indicatorStyle: {
        position: 'absolute',
        top: 5,
        right: 10,
        borderRadius: '50%',
        width: '10px',
        height: '10px',
        background: 'red'
      }
    }
  }
  //...
};
```

For hotkeys, you can use any [Electron Accelerator](https://github.com/electron/electron/blob/master/docs/api/accelerator.md)

## Licence

[MIT](LICENSE.md)
