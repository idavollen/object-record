import * as diffObj from './diff/diff-obj';

const initialConfig = {
  obj: {},
  history: {
    count: 50
  }
}
export default function createObjectHistory(configs = initialConfig) {
  
  var _history = {
    cur: {
      obj: configs.obj || {},
      index: -1
    },
    histories: []
  }, _configs = configs;

  function _updateHistory(newObj, diffs, cause) {
    if (_history.histories.length >= _configs.history.count) {
      _history.histories.splice(0, 1);
    }
    _history.histories.push({
      diffs,
      cause,
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
      back: _history.histories.length > 0? _history.cur.index+1 : 0
    }
  }

  return {  

    current: function() {
      return _pos();
    },

    update: function(newObj, cause) {
      let diffs = diffObj.diff(_history.cur.obj, newObj);
      if (diffs && diffs.length > 0) {
        _updateHistory(newObj, diffs, cause)
      }
      return _pos();
    },  

    forward: function() {
      if (_history.cur.index < _history.histories.length - 1) {
        _history.cur.index++;
        _history.cur.obj = diffObj.deduce(_history.cur.obj, _history.histories[_history.cur.index].diffs, 'f');
      }
      return _pos();
    },

    back: function() {
      if (_history.cur.index >= 0) {
        let deduced = diffObj.deduce(_history.cur.obj, _history.histories[_history.cur.index].diffs, 'b');
        _history.cur.obj = deduced;
        _history.cur.index--;
      }
      return _pos();
    },

    go: function(nr) {
      if (nr > 0) {
        while (nr-- > 0) this.forward();
      } else if (nr < 0) {
        while (nr++ < 0) this.back();
      }
      return _pos();
    }

  }
}