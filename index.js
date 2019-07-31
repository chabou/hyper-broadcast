const merge = require('lodash.merge');

const defaultConfig = {
  debug: false,
  hotkeys: {
    selectCurrentPane: 'CommandOrControl+Alt+P',
    selectCurrentTabPanes: 'CommandOrControl+Alt+T',
    selectAllPanes: 'CommandOrControl+Alt+A',
    toggleCurrentPane: 'CommandOrControl+Alt+B'
  },
  indicatorStyle: {
    position: 'absolute',
    top: 1,
    right: 10,
    borderRadius: '50%',
    width: '10px',
    height: '10px',
    background: 'red'
  }
};

let config = defaultConfig;

const debug = function() {
  if (config.debug) {
    [].unshift.call(arguments, '|HYPER-BROADCAST|');
    console.log.apply(this, arguments);
  }
};

let broadcastMenuItems;

// Find all sessions that are below the given
// termGroup uid in the hierarchy:
function findChildSessions(termGroups, uid) {
  const group = termGroups[uid];
  if (group.sessionUid) {
    return [group.sessionUid];
  }

  return group.children.reduce((total, childUid) => total.concat(findChildSessions(termGroups, childUid)), []);
}

exports.decorateConfig = globalConfig => {
  if (globalConfig.broadcast) {
    debug('load config', globalConfig.broadcast);
    config = merge(JSON.parse(JSON.stringify(defaultConfig)), globalConfig.broadcast);
  }

  return globalConfig;
};

exports.decorateMenu = menu => {
  debug('decorateMenu');
  const isMac = process.platform === 'darwin';
  const menuLabel = isMac ? 'Shell' : 'File';

  return menu.map(menuItem => {
    if (menuItem.label !== menuLabel) {
      return menuItem;
    }

    const newMenuItem = Object.assign({}, menuItem);
    newMenuItem.submenu = [...newMenuItem.submenu];

    newMenuItem.submenu.push({
      type: 'separator'
    });

    broadcastMenuItems = {
      label: 'Broadcast Input',
      submenu: [
        {
          label: 'Send Input to Focused Pane Only',
          type: 'radio',
          accelerator: config.hotkeys.selectCurrentPane,
          checked: true,
          click(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.rpc.emit('broadcast reset');
            }
          }
        },
        {
          label: 'Broadcast Input to All Panes in Current Tab',
          type: 'radio',
          accelerator: config.hotkeys.selectCurrentTabPanes,
          click(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.rpc.emit('broadcast selectCurrentTabPanes');
            }
          }
        },
        {
          label: 'Broadcast Input to All Panes in All Tabs',
          type: 'radio',
          accelerator: config.hotkeys.selectAllPanes,
          click(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.rpc.emit('broadcast selectAllPanes');
            }
          }
        },
        {
          label: 'Toggle Broadcast Input to Current Pane',
          type: 'radio',
          accelerator: config.hotkeys.toggleCurrentPane,
          click(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.rpc.emit('broadcast toggleCurrentPane');
            }
          }
        }
      ]
    };
    newMenuItem.submenu.push(broadcastMenuItems);

    return newMenuItem;
  });
};

exports.middleware = store => next => action => {
  switch (action.type) {
    case 'CONFIG_LOAD':
    case 'CONFIG_RELOAD':
      if (action.config.broadcast) {
        debug('reload renderer config');
        config = merge(JSON.parse(JSON.stringify(defaultConfig)), action.config.broadcast);
      }
      break;
    case 'SESSION_USER_DATA':
      {
        const {sessions} = store.getState();
        const targetedSessions = sessions.broadcast;
        if (targetedSessions) {
          const sesssionsToRemove = [];
          targetedSessions.filter(session => session !== sessions.activeUid).forEach(sessionUid => {
            if (sessions.sessions[sessionUid]) {
              debug(`Emit data to ${sessionUid}`);
              store.dispatch({
                type: 'BROADCAST_SESSIONS_USER_DATA',
                data: action.data,
                effect() {
                  // If no uid is passed, data is sent to the active session.
                  window.rpc.emit('data', {uid: sessionUid, data: action.data});
                }
              });
            } else {
              sesssionsToRemove.push(sessionUid);
            }
          });
          if (sesssionsToRemove.length > 0) {
            store.dispatch({
              type: 'BROADCAST_SESSIONS_REMOVE',
              sessions: sesssionsToRemove
            });
          }
        }
      }
      break;
  }
  return next(action);
};

exports.reduceSessions = (state, action) => {
  switch (action.type) {
    case 'BROADCAST_SESSIONS_SET':
      state = state.set('broadcast', action.sessions);
      break;
    case 'BROADCAST_SESSIONS_TOGGLE':
      {
        let broadcast = state.broadcast ? state.broadcast.asMutable() : [];
        const idx = broadcast.indexOf(action.session);
        if (idx !== -1) {
          broadcast.splice(idx, 1);
        } else {
          broadcast.push(action.session);
        }
        state = state.set('broadcast', broadcast);
      }
      break;
    case 'BROADCAST_SESSIONS_RESET':
      state = state.without('broadcast');
      break;
    case 'BROADCAST_SESSIONS_REMOVE':
      {
        let broadcast = state.broadcast ? state.broadcast : [];
        broadcast = broadcast.filter(session => !action.sessions.includes(session));
        state = state.set('broadcast', broadcast);
      }
      break;
  }
  return state;
};

exports.decorateTerms = (Terms, {React}) => {
  return class extends React.Component {
    componentDidMount() {
      window.rpc.on('broadcast selectCurrentTabPanes', () => {
        debug('selectCurrentTabPanes');
        window.store.dispatch((dispatch, getState) => {
          const {termGroups} = getState();
          const sessions = findChildSessions(termGroups.termGroups, termGroups.activeRootGroup);
          dispatch({
            type: 'BROADCAST_SESSIONS_SET',
            sessions: sessions
          });
        });
      });
      window.rpc.on('broadcast selectAllPanes', () => {
        debug('selectAllPanes');
        window.store.dispatch((dispatch, getState) => {
          const {termGroups} = getState();
          const sessions = Object.keys(termGroups.termGroups)
            .map(uid => termGroups.termGroups[uid])
            .filter(termGroup => termGroup.sessionUid)
            .map(termGroup => termGroup.sessionUid);
          dispatch({
            type: 'BROADCAST_SESSIONS_SET',
            sessions: sessions
          });
        });
      });
      window.rpc.on('broadcast toggleCurrentPane', () => {
        debug('toggleCurrentPane');
        window.store.dispatch((dispatch, getState) => {
          const {sessions} = getState();
          const session = sessions.activeUid;
          dispatch({
            type: 'BROADCAST_SESSIONS_TOGGLE',
            session: session
          });
        });
      });
      window.rpc.on('broadcast reset', () => {
        debug('deselect');
        window.store.dispatch({
          type: 'BROADCAST_SESSIONS_RESET'
        });
      });
    }

    render() {
      return React.createElement(Terms, this.props);
    }
  };
};

// Add indicators to panes

exports.mapTermsState = (state, map) => {
  const broadcastedSessions = state.sessions.broadcast || [];
  return Object.assign({}, map, {broadcastedSessions});
};

exports.getTermGroupProps = (uid, parentProps, props) => {
  return Object.assign(props, {
    broadcastedSessions: parentProps.broadcastedSessions
  });
};

exports.getTermProps = (uid, parentProps, props) => {
  const isBroadcasted = parentProps.broadcastedSessions.includes(uid);

  return Object.assign({}, props, {isBroadcasted});
};

exports.decorateTerm = (Term, {React}) => {
  return class extends React.Component {
    render() {
      const props = Object.assign({}, this.props);
      if (this.props.isBroadcasted) {
        const myCustomChildrenBefore = React.createElement('div', {
          style: config.indicatorStyle
        });
        const customChildrenBefore = this.props.customChildrenBefore
          ? Array.from(this.props.customChildrenBefore).concat(myCustomChildrenBefore)
          : myCustomChildrenBefore;
        props.customChildrenBefore = customChildrenBefore;
      }
      return React.createElement(Term, props);
    }
  };
};
