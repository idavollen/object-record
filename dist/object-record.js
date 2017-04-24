(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global['object-record'] = factory());
}(this, (function () { 'use strict';

//due to Object.keys
//require('babel-polyfill');


var ary2Obj = function ary2Obj() {
  for (var _len = arguments.length, elems = Array(_len), _key = 0; _key < _len; _key++) {
    elems[_key] = arguments[_key];
  }

  return elems.reduce(function (obj, cur, idx) {
    obj[idx] = cur;return obj;
  }, {});
};
var isArray = function isArray(array) {
  return Array.isArray && Array.isArray(array) || array && array.constructor === Array;
};
var at = function at(obj, idx) {
  return obj && obj[Object.keys(obj)[idx]];
};
var empty = function empty(obj) {
  return !(obj && (obj.length || Object.keys(obj).length));
};
var exclude = function exclude(obj) {
  for (var _len2 = arguments.length, keys = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    keys[_key2 - 1] = arguments[_key2];
  }

  return keys.reduce(function (no, k) {
    delete no[k];return no;
  }, obj);
};
var aryCopy = function aryCopy(src, start, end, dst) {
  console.log('aryCopy:', src, start, end, dst);
  if (start >= 0 && end > start && end <= src.length) {
    var subset = src.slice(start, end);
    dst.push.apply(dst, subset);
    console.log('after aryCopy:', dst, subset);
    return end - start;
  }
  return 0;
};
var update = function update(obj, idx, ary) {
  var keys = Object.keys(obj),
      placed = false;
  idx = Number(idx);
  console.log('updating obj:', obj, idx, 'array:', ary, 'keys = ', keys);
  for (var oi = 0; oi < keys.length; oi++) {
    var k = keys[oi];
    var i = Number(k);
    if (!obj[k]) continue;
    if (i < idx && obj[k].elms.length + i === idx) {
      var _obj$k$elms;

      console.log('found lower match', i, obj[k].elms);
      var melms = (_obj$k$elms = obj[k].elms).concat.apply(_obj$k$elms, ary);
      placed = true;
      if (oi < keys.length - 1) {
        //the new 'ary' is actually string between Matched(n-1) and Match(n). therefore these two plus new 'ary' merged together
        if (idx + ary.length === Number(keys[oi + 1])) {
          var _melms;

          console.log('merging follwing matched');
          var follwing = obj[keys[oi + 1]];
          melms = (_melms = melms).concat.apply(_melms, follwing.elms);
          delete obj[keys[oi + 1]];
        }
      }
      console.log('newly merged melms', melms);
      obj[k].elms = melms;
    } else if (i > idx && idx + ary.length == i) {
      console.log('found upper match', i, obj[k].elms);
      var _melms2 = ary.concat.apply(ary, obj[k].elms);
      placed = true;
      //also check the preceeding matched one
      if (oi > 0) {
        var preceeding = obj[keys[oi - 1]];
        if (Number(keys[oi - 1]) + preceeding.elms.length === idx) {
          var _preceeding$elms;

          obj[keys[oi - 1]].elms = (_preceeding$elms = preceeding.elms).concat.apply(_preceeding$elms, _melms2);
          delete obj[k];
          continue;
        }
      }
      obj[idx] = { elms: ary.concat.apply(ary, obj[k].elms) };
      delete obj[k];
    }
  }
  if (!placed) {
    obj[idx] = { elms: ary };
  }
  console.log('after updating obj = ', obj);
};
var stageElms = function stageElms(obj, val, idx, pidx) {
  var discrete = false;pidx = pidx != undefined && Number(pidx) || pidx;
  if (obj.startIdx === undefined) {
    obj.startIdx = idx;
    obj[obj.startIdx] = { elms: [] };
    if (pidx !== undefined) {
      obj[obj.startIdx].pidx = pidx;
    }
  }
  if (obj.idx === undefined || idx === obj.idx + 1 && (pidx === undefined || pidx !== undefined && obj[obj.startIdx].pidx !== undefined && pidx == obj[obj.startIdx].elms.length + Number(obj[obj.startIdx].pidx))) {
    obj[obj.startIdx].elms.push(val);
  } else {
    obj.startIdx = idx;
    obj[obj.startIdx] = { elms: [val] };
    if (pidx !== undefined) {
      obj[obj.startIdx].pidx = pidx;
    }
  }
  obj.idx = idx;
  return obj;
};

function diffArray(curAry, newAry) {
  console.log('incoming = ', curAry, newAry);
  if (curAry.length === 0 && newAry.length === 0) return undefined;else if (curAry.length === 0 && newAry.length) return ['+|' + JSON.stringify(newAry) + '|0'];else if (curAry.length && newAry.length === 0) return ['-|' + JSON.stringify(curAry) + '|0'];
  var curObj = ary2Obj.apply(undefined, curAry),
      newObj = ary2Obj.apply(undefined, newAry);
  var diffs = [],
      matches = {},
      diffStage = {},
      newElms = {},
      curElms = {};
  for (var nkey in newObj) {
    var cfound = -1,
        nval = newObj[nkey],
        ckey = void 0;
    for (ckey in curObj) {
      var cval = curObj[ckey];
      if (isArray(nval) && isArray(cval)) {
        var delta = diffArray(cval, nval);
        if (!delta) {
          cfound = ckey;
          break;
        }
      } else if (typeof nval === 'object' && typeof cval === 'object') {
        var _delta = diff(cval, nval);
        console.log('diffs between js objects:', _delta, cval, nval, ckey, nkey);
        if (!_delta) {
          cfound = ckey;
          break;
        }
      } else if (nval === cval) {
        cfound = ckey;
        break;
      }
    }
    if (cfound === -1) {
      stageElms(newElms, nval, Number(nkey));
      console.log('no match:', nkey, newElms);
    } else {
      stageElms(matches, nval, Number(nkey), cfound);
      delete curObj[ckey];
      console.log('found match:', ckey, nkey, matches, curObj);
    }
  }
  console.log('after loop, curObj =', curObj);
  for (var k in curObj) {
    stageElms(curElms, curObj[k], Number(k));
  }
  console.log('after stagging: curObj = ', curObj);
  exclude(newElms, 'idx', 'startIdx');
  exclude(matches, 'idx', 'startIdx');
  exclude(curElms, 'idx', 'startIdx');

  console.log('b4 normalizing, matches = ', matches);

  //normalize matches 
  var matched = Object.keys(matches).length;
  for (var m = 0; m < matched; m++) {
    var first = void 0;
    for (var cbidx in matches) {
      if (first !== undefined) {
        var other = matches[cbidx];
        if (cbidx > first.idx && other.pidx < first.obj.pidx) {
          if (other.elms.length <= first.obj.elms.length) {
            delete matches[cbidx];
            //put the matched other into newElms and curElms
            update(curElms, other.pidx, other.elms);
            update(newElms, cbidx, other.elms);
          } else {
            delete matches[first.idx];
            //put the matched first into newElms and curElms
            update(curElms, first.obj.pidx, first.obj.elms);
            update(newElms, first.idx, first.obj.elms);
            break;
          }
        } else {
          first = { idx: cbidx, obj: other };
        }
      } else {
        first = { idx: cbidx, obj: matches[cbidx] };
      }
    }
  }
  console.log('staged parts: ', newElms, curElms, matches);
  if (empty(curElms) && !empty(newElms)) {
    for (var _k in newElms) {
      diffs.push('+|' + JSON.stringify(newElms[_k].elms) + '|' + _k);
    }
  } else if (!empty(curElms) && empty(newElms)) {
    for (var _k2 in curElms) {
      diffs.push('-|' + JSON.stringify(curElms[_k2].elms) + '|' + _k2);
    }
  } else if (!empty(curElms) && !empty(newElms)) {
    //diff from both new and cur
    var _matched = Object.keys(matches).length;
    console.log('being here, matched = ', _matched);
    if (!_matched || _matched > 3 && _matched > Math.min(curAry.length, newAry.length) / 2) {
      console.log('there exists too many matched', _matched);
      diffs.push('c|' + JSON.stringify(curAry) + '|' + JSON.stringify(newAry) + '|0');
    } else {
      var nstartidx = 0;
      for (var midx in matches) {
        var nelm = void 0,
            celm = void 0;
        for (var nidx in newElms) {
          if (nidx < midx) {
            nelm = { idx: nidx, val: newElms[nidx].elms };
            nstartidx += newElms[nidx].elms.length;
            delete newElms[nidx];
          }

          break;
        }
        for (var cidx in curElms) {
          if (matches[midx].pidx > cidx) {
            celm = { idx: cidx, val: curElms[cidx].elms };
            delete curElms[cidx];
          }
          break;
        }

        console.log('matched idx:', midx, matches[midx], nelm, celm, diffs);
        if (nelm && celm) {
          diffs.push('c|' + JSON.stringify(celm.val) + '|' + JSON.stringify(nelm.val) + '|' + nelm.idx);
        } else if (nelm) {
          diffs.push('+|' + JSON.stringify(nelm.val) + '|' + nelm.idx);
        } else if (celm) {
          diffs.push('-|' + JSON.stringify(celm.val) + '|' + nstartidx);
        }
        console.log('new diffs in loop:', diffs);
        nstartidx += matches[midx].elms.length;
      }
      //remaining either curElms or newElms
      console.log('after loop, situations:', curElms, newElms, diffs);
      if (!empty(curElms) && !empty(newElms)) {
        diffs.push('c|' + JSON.stringify(at(curElms, 0).elms) + '|' + JSON.stringify(at(newElms, 0).elms) + '|' + Object.keys(newElms)[0]);
      } else if (!empty(newElms)) {
        diffs.push('+|' + JSON.stringify(at(newElms, 0).elms) + '|' + Object.keys(newElms)[0]);
      } else if (!empty(curElms)) {
        diffs.push('-|' + JSON.stringify(at(curElms, 0).elms) + '|' + nstartidx);
      }
      console.log('final diffs:', diffs);
    }
  }
  return diffs.length ? diffs : undefined;
}

function _diff(curJson, newJson) {
  var path = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  var diffs = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

  var curKeys = Object.keys(curJson),
      newKeys = Object.keys(newJson);
  //console.log('curJson = ', curJson, curKeys, ' newJson = ', newJson, newKeys, path, diffs)

  if (curKeys.length === 0 && newKeys.length === 0) return diffs;

  for (var n = newKeys.length - 1; n >= 0; n--) {
    if (curKeys.length === 0) {
      //new node in newJson
      diffs.push((path ? path + ':' + n : n) + '/+/' + newKeys[n] + '/' + JSON.stringify(newJson[newKeys[n]]));
      continue;
    }
    var c = curKeys.length > 0 ? curKeys.length - 1 : 0;
    //console.log('c = ', c, ' and curKeys = ', curKeys)
    for (; curKeys.length > 0 && c >= 0; c--) {
      if (newKeys[n] === curKeys[c]) {
        if (isArray(newJson[newKeys[n]]) && isArray(curJson[curKeys[c]])) {
          var aryDiff = diffArray(curJson[curKeys[c]], newJson[newKeys[n]]);
          if (aryDiff) {
            diffs.push((path ? path + ':' + n : n) + '/a/' + JSON.stringify(aryDiff));
          }
        } else if (typeof newJson[newKeys[n]] === 'object' && typeof curJson[curKeys[c]] === 'object') {
          //console.log('both node is object', c, n, curKeys)
          _diff(curJson[curKeys[c]], newJson[newKeys[n]], path ? path + ':' + n : n, diffs);
          //console.log('both node is object after', c, n, curKeys)
        } else if (newJson[newKeys[n]] !== curJson[curKeys[c]]) {
          //console.log('two node has diff values:', newKeys[n],newJson[newKeys[n]], curKeys[c], curJson[curKeys[c]])
          //nodes with the same key, but different values
          diffs.push((path ? path + ':' + n : n) + '/c/' + JSON.stringify(curJson[curKeys[c]]) + '/' + JSON.stringify(newJson[newKeys[n]]));
        }
        curKeys.splice(c, 1);
        //console.log(' splice the matched one frm curKeys:', curKeys);
        break;
      }
    }
    if (c < 0 && curKeys.length > 0) {
      //new node in newJson
      //console.log('no matched key in curKeys', c, n,curKeys)
      diffs.push((path ? path + ':' + n : n) + '/+/' + newKeys[n] + '/' + JSON.stringify(newJson[newKeys[n]]));
    }
  }
  //missing
  for (var _c = 0; _c < curKeys.length; _c++) {
    //console.log('more keys in curKeys', curKeys)
    diffs.push((path ? path + ':' + (newKeys.length + _c) : newKeys.length + _c) + '/-/' + curKeys[_c] + '/' + JSON.stringify(curJson[curKeys[_c]]));
  }
  return diffs;
}

function diff(left, right) {
  if (typeof left != 'object' || typeof right != 'object') return;

  var diffs = _diff(left, right);
  //console.log('diffs result = ', diffs);
  if (diffs == undefined || diffs.length === 0) return;
  return diffs;
}

function _deduceArray(orig, diffs, forward) {
  //diffs[] =   [ '0/a/["|c|[{\\"a\\":2}]|[{\\"a\\":3}]|1"]' ]

  console.log('_deduceArray incoming cur = ', orig, diffs, forward);
  var newAry = [],
      srcIdx = 0,
      dstIdx = 0;
  diffs.forEach(function (d) {
    var parts = d.split('|');
    console.log('_deduceArray:', srcIdx, dstIdx, parts, 'newAry = ', newAry);
    if (parts[0] === 'c') {
      var blkEnd = Number(parts[3]),
          end = forward ? srcIdx + blkEnd - dstIdx : blkEnd;
      var cnr = aryCopy(orig, srcIdx, end, newAry);
      srcIdx += cnr, dstIdx += cnr;
      console.log('b4 deduced by change op', orig[parts[3]]);
      var res = JSON.parse(forward ? parts[2] : parts[1]);
      newAry.splice.apply(newAry, [dstIdx, 0].concat(res));
      dstIdx += res.length;
      var srcBlk = JSON.parse(forward ? parts[1] : parts[2]);
      srcIdx += srcBlk.length;
      console.log('deduced by change op change', newAry, srcBlk, dstIdx, srcIdx);
    } else if (parts[0] === '+') {
      var _blkEnd = Number(parts[2]),
          _end = forward ? srcIdx + _blkEnd - dstIdx : _blkEnd;
      var _cnr = aryCopy(orig, srcIdx, _end, newAry);
      srcIdx += _cnr, dstIdx += _cnr;
      var p1 = JSON.parse(parts[1]);
      if (forward) {
        newAry.splice.apply(newAry, [dstIdx, 0].concat(p1));
        dstIdx += p1.length;
      } else {
        srcIdx += p1.length;
      }
      console.log('deduced by change op+', newAry, p1, dstIdx, srcIdx);
    } else if (parts[0] === '-') {
      var _blkEnd2 = Number(parts[2]),
          start = srcIdx,
          _end2 = forward ? start + _blkEnd2 - dstIdx : _blkEnd2;
      console.log('b4 aryCopy:', start, _end2, _blkEnd2, srcIdx, dstIdx);
      var _cnr2 = aryCopy(orig, start, _end2, newAry);
      srcIdx += _cnr2, dstIdx += _cnr2;
      var _p = JSON.parse(parts[1]);
      if (forward) {
        srcIdx += _p.length;
      } else {
        newAry.splice.apply(newAry, [dstIdx, 0].concat(_p));
        dstIdx += _p.length;
      }
      console.log('deduced by change op-', newAry, _p, dstIdx, srcIdx);
    }
  });
  if (srcIdx < orig.length) {
    console.log('remaining elms', newAry, srcIdx, dstIdx);
    newAry.splice.apply(newAry, [dstIdx, 0].concat(orig.slice(srcIdx)));
  }
  console.log('orig = ', newAry);
  return newAry;
}

function deduce(cur, diffs, dir) {
  //console.log('incoming cur = ', cur, diffs, dir)
  var newObj = Object.assign({}, cur);
  //console.log('newObj = ', newObj, cur);
  diffs.forEach(function (d) {
    var parts = d.split('/');
    // '2:1:1:0/c/1/11', '2/+/c/{"a":2}'
    var path = parts[0].split(':');
    var key = path.pop();
    var node = path.reduce(function (obj, idx) {
      return obj[Object.keys(obj)[idx]];
    }, newObj);
    var forward = dir === 1 || dir === 'f';
    //console.log('deducing...', path, parts, key, 'node = ',node, forward, cur, diffs)
    if (parts[1] === 'a') {
      //array diffs i.e.   [ '0/a/["|c|[{\\"a\\":2}]|[{\\"a\\":3}]|1"]' ]
      console.log('cur val at node(Array) = ', node[Object.keys(node)[key]], node, key, parts);
      node[Object.keys(node)[key]] = _deduceArray(node[Object.keys(node)[key]], JSON.parse(parts[2]), forward);

      console.log('after val at node = ', node[Object.keys(node)[key]], node, key, newObj);
    } else if (parts[1] === 'c') {
      //console.log('cur val at node = ', node[Object.keys(node)[key]], node, key, parts)
      node[Object.keys(node)[key]] = JSON.parse(forward ? parts[3] : parts[2]);

      //console.log('after val at node = ', node[Object.keys(node)[key]], node, key, newObj)
    } else if (parts[1] === '+') {
      //console.log('+ to node', node, forward, newObj)
      if (forward) node[[parts[2]]] = JSON.parse(parts[3]);else delete node[parts[2]];
    } else if (parts[1] === '-') {
      //console.log('- to node', node, forward, newObj)
      if (forward) delete node[parts[2]];else node[[parts[2]]] = JSON.parse(parts[3]);
    }
  });
  //console.log('returned deduced obj = ', newObj)
  return newObj;
}

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
      var diffs = diff(_history.cur.obj, newObj);
      if (diffs && diffs.length > 0) {
        _updateHistory(newObj, diffs, cause);
      }
      return _pos();
    },

    forward: function forward() {
      if (_history.cur.index < _history.histories.length - 1) {
        _history.cur.index++;
        _history.cur.obj = deduce(_history.cur.obj, _history.histories[_history.cur.index].diffs, 'f');
      }
      return _pos();
    },

    back: function back() {
      if (_history.cur.index >= 0) {
        var deduced = deduce(_history.cur.obj, _history.histories[_history.cur.index].diffs, 'b');
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

return createObjectHistory;

})));
