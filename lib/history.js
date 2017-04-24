'use strict';

exports.__esModule = true;
exports['default'] = createObjectHistory;

var _diffObj = require('./diff/diff-obj');

var diffObj = _interopRequireWildcard(_diffObj);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var initialConfig = {
  obj: {},
  history: {
    count: 50
  }
};
function createObjectHistory() {
  var configs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialConfig;


  var _history = {
    cur: {
      obj: configs.obj || {},
      index: -1
    },
    histories: []
  },
      _configs = configs;

  function _updateHistory(newObj, diffs, cause) {
    if (_history.histories.length >= _configs.history.count) {
      _history.histories.splice(0, 1);
    }
    _history.histories.push({
      diffs: diffs,
      cause: cause,
      ts: new Date().getTime()
    });

    _history.cur.obj = newObj;
    _history.cur.index = _history.histories.length - 1;
  }

  function _pos() {
    return {
      cur: Object.assign({}, _history.cur),
      forward: _history.histories.length - _history.cur.index - 1,
      //for we have a start object that is default as {}
      back: _history.histories.length > 0 ? _history.cur.index + 1 : 0
    };
  }

  return {

    current: function current() {
      return _pos();
    },

    update: function update(newObj, cause) {
      var diffs = diffObj.diff(_history.cur.obj, newObj);
      if (diffs && diffs.length > 0) {
        _updateHistory(newObj, diffs, cause);
      }
      return _pos();
    },

    forward: function forward() {
      if (_history.cur.index < _history.histories.length - 1) {
        _history.cur.index++;
        _history.cur.obj = diffObj.deduce(_history.cur.obj, _history.histories[_history.cur.index].diffs, 'f');
      }
      return _pos();
    },

    back: function back() {
      if (_history.cur.index >= 0) {
        var deduced = diffObj.deduce(_history.cur.obj, _history.histories[_history.cur.index].diffs, 'b');
        _history.cur.obj = deduced;
        _history.cur.index--;
      }
      return _pos();
    },

    go: function go(nr) {
      if (nr > 0) {
        while (nr-- > 0) {
          this.forward();
        }
      } else if (nr < 0) {
        while (nr++ < 0) {
          this.back();
        }
      }
      return _pos();
    }

  };
}