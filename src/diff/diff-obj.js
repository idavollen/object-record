//due to Object.keys
//require('babel-polyfill');


const ary2Obj = (...elems) => elems.reduce( (obj, cur, idx) => {obj[idx] = cur; return obj}, {})
const isArray = array => Array.isArray && Array.isArray(array) || array && array.constructor === Array
const at = (obj, idx) => obj && obj[Object.keys(obj)[idx]]
const empty = obj => !(obj && (obj.length || Object.keys(obj).length))
const exclude = (obj, ...keys) => keys.reduce((no, k) => { delete no[k]; return no}, obj)
const aryCopy = (src, start, end, dst) => {
  console.log('aryCopy:', src, start, end, dst)
  if (start >= 0 && end > start && end <= src.length) {
    let subset = src.slice(start, end);
    dst.push(...subset);
    console.log('after aryCopy:', dst, subset)
    return end-start;
  }
  return 0;
}
const update = (obj, idx, ary) => {
  let keys = Object.keys(obj), placed = false;
  idx = Number(idx)
  console.log('updating obj:', obj, idx, 'array:', ary, 'keys = ', keys)
  for (let oi = 0; oi < keys.length; oi++) {
    let k = keys[oi];
    let i = Number(k)
    if (!obj[k]) continue;
    if (i < idx && obj[k].elms.length+i === idx) {
      console.log('found lower match', i, obj[k].elms)
      let melms = obj[k].elms.concat(...ary);
      placed = true
      if (oi < keys.length - 1) {
        //the new 'ary' is actually string between Matched(n-1) and Match(n). therefore these two plus new 'ary' merged together
        if (idx+ary.length === Number(keys[oi+1])) {
          console.log('merging follwing matched')
          let follwing = obj[keys[oi+1]];
          melms = melms.concat(...follwing.elms);
          delete obj[keys[oi+1]];
        }
      }
      console.log('newly merged melms', melms)
      obj[k].elms = melms
    } else if (i > idx && idx + ary.length == i) { 
      console.log('found upper match', i, obj[k].elms)
      let melms = ary.concat(...obj[k].elms)
      placed = true
      //also check the preceeding matched one
      if (oi > 0) {
        let preceeding = obj[keys[oi-1]]
        if (Number(keys[oi-1]) + preceeding.elms.length === idx) {
          obj[keys[oi-1]].elms = preceeding.elms.concat(...melms)
          delete obj[k];
          continue;
        }
      }     
      obj[idx] = { elms: ary.concat(...obj[k].elms) };
      delete obj[k];
    }
  }
  if (!placed) {
    obj[idx] = { elms: ary }
  }
  console.log('after updating obj = ', obj)
}
const stageElms = (obj, val, idx, pidx) => { 
  let discrete = false; pidx = pidx != undefined && Number(pidx) || pidx
  if (obj.startIdx === undefined) {
    obj.startIdx = idx
    obj[obj.startIdx] = { elms: [] };
    if (pidx !== undefined) {
      obj[obj.startIdx].pidx = pidx  
    }
  }
  if (obj.idx === undefined || idx === obj.idx + 1 && (pidx === undefined || pidx !== undefined && obj[obj.startIdx].pidx !== undefined && pidx == (obj[obj.startIdx].elms.length+ Number(obj[obj.startIdx].pidx)))) {
    obj[obj.startIdx].elms.push(val);
  } else {        
    obj.startIdx = idx
    obj[obj.startIdx] = { elms: [val] };
    if (pidx !== undefined) {
      obj[obj.startIdx].pidx = pidx
    }
  }
  obj.idx = idx;
  return obj;
}

function diffArray(curAry, newAry) {
  console.log('incoming = ', curAry, newAry)
  if (curAry.length === 0 && newAry.length === 0) return undefined;
  else if (curAry.length === 0 && newAry.length) return ['+|'+JSON.stringify(newAry)+'|0'];
  else if (curAry.length && newAry.length === 0) return ['-|'+JSON.stringify(curAry)+'|0'];
  let curObj = ary2Obj(...curAry), newObj = ary2Obj(...newAry);
  let diffs = [], matches = {}, diffStage = {}, newElms = {}, curElms = {}
  for (let nkey in newObj) {
    let cfound = -1, nval = newObj[nkey], ckey;
    for (ckey in curObj) {
      let cval = curObj[ckey]
      if (isArray(nval) && isArray(cval)) {
        let delta = diffArray(cval, nval);
        if (!delta) {
          cfound = ckey;
          break;
        }
      } else if (typeof nval === 'object' && typeof cval === 'object') {
        let delta = diff(cval, nval);
        console.log('diffs between js objects:', delta, cval, nval, ckey, nkey)
        if (!delta) {
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
      console.log('no match:', nkey, newElms)
    } else {
      stageElms(matches, nval, Number(nkey), cfound)
      delete curObj[ckey]
      console.log('found match:', ckey, nkey, matches, curObj)
    }
  }
  console.log('after loop, curObj =', curObj)
  for (let k in curObj) {
    stageElms(curElms, curObj[k], Number(k));
  }
      console.log('after stagging: curObj = ', curObj)
  exclude(newElms, 'idx', 'startIdx');
  exclude(matches, 'idx', 'startIdx');
  exclude(curElms, 'idx', 'startIdx');

  console.log('b4 normalizing, matches = ', matches)

  //normalize matches 
  let matched = Object.keys(matches).length;
  for (let m = 0; m < matched; m++) {
    let first;
    for (let cbidx in matches) {
      if (first !== undefined) {
        let other = matches[cbidx]
        if (cbidx > first.idx && other.pidx < first.obj.pidx) {
          if (other.elms.length <= first.obj.elms.length) {
            delete matches[cbidx]
            //put the matched other into newElms and curElms
            update(curElms, other.pidx, other.elms);
            update(newElms, cbidx, other.elms)
          } else {
            delete matches[first.idx];
            //put the matched first into newElms and curElms
            update(curElms, first.obj.pidx, first.obj.elms)
            update(newElms, first.idx, first.obj.elms)
            break
          }
        } else {
          first = { idx: cbidx, obj: other }
        }
      } else {
        first = { idx: cbidx, obj: matches[cbidx] }
      }
    }
  }
console.log('staged parts: ', newElms, curElms, matches);
  if (empty(curElms) && ! empty(newElms)) {
    for (let k in newElms) {
      diffs.push('+|'+JSON.stringify(newElms[k].elms)+'|'+k)
    }
  } else if (!empty(curElms) && empty(newElms)) {
    for (let k in curElms) {
      diffs.push('-|'+JSON.stringify(curElms[k].elms)+'|'+k)
    }
  } else if (! empty(curElms) && ! empty(newElms)) {
    //diff from both new and cur
    let matched = Object.keys(matches).length;
    console.log('being here, matched = ', matched)
    if (!matched || matched > 3 && matched > Math.min(curAry.length, newAry.length)/2 ) {
      console.log('there exists too many matched', matched)
      diffs.push('c|'+JSON.stringify(curAry)+'|'+JSON.stringify(newAry)+'|0')
    } else {
      let nstartidx = 0;
      for (let midx in matches) {
        let nelm, celm;
        for (let nidx in newElms) {
          if (nidx < midx) {
            nelm = { idx: nidx, val: newElms[nidx].elms };
            nstartidx += newElms[nidx].elms.length;
            delete newElms[nidx];
          }
          
          break;
        }
        for (let cidx in curElms) {
          if (matches[midx].pidx > cidx) {
            celm = { idx: cidx, val: curElms[cidx].elms };
            delete curElms[cidx];
          } 
          break;
        }

      console.log('matched idx:', midx, matches[midx], nelm, celm, diffs)
        if (nelm && celm) {
          diffs.push('c|'+JSON.stringify(celm.val)+'|'+JSON.stringify(nelm.val)+'|'+nelm.idx)
        } else if (nelm) {
          diffs.push('+|'+JSON.stringify(nelm.val)+'|'+nelm.idx)
        } else if (celm) {
          diffs.push('-|'+JSON.stringify(celm.val)+'|'+nstartidx)
        }
      console.log('new diffs in loop:', diffs)
        nstartidx += matches[midx].elms.length
      }
      //remaining either curElms or newElms
      console.log('after loop, situations:', curElms, newElms, diffs)
      if (!empty(curElms) && !empty(newElms)) {
        diffs.push('c|'+JSON.stringify(at(curElms, 0).elms)+'|'+JSON.stringify(at(newElms, 0).elms)+'|'+Object.keys(newElms)[0])
      } else if (!empty(newElms)) {
        diffs.push('+|'+JSON.stringify(at(newElms, 0).elms)+'|'+Object.keys(newElms)[0])
      } else if (!empty(curElms)) {
        diffs.push('-|'+JSON.stringify(at(curElms, 0).elms)+'|'+nstartidx)
      }
      console.log('final diffs:', diffs)
    }
  }
  return diffs.length? diffs : undefined
}


function _diff(curJson, newJson, path = '', diffs = []) {
  let curKeys = Object.keys(curJson), newKeys = Object.keys(newJson);
  //console.log('curJson = ', curJson, curKeys, ' newJson = ', newJson, newKeys, path, diffs)

  if (curKeys.length === 0 && newKeys.length === 0) return diffs;

  for (let n = newKeys.length-1; n >= 0; n--) {
    if (curKeys.length === 0) {
      //new node in newJson
      diffs.push((path? path + ':'+ n:n)+'/+/'+newKeys[n]+'/'+JSON.stringify(newJson[newKeys[n]]));
      continue;  
    }
    var c = curKeys.length > 0 ? curKeys.length-1 : 0;
    //console.log('c = ', c, ' and curKeys = ', curKeys)
    for (;curKeys.length > 0 && c >= 0; c--) {
      if (newKeys[n] === curKeys[c]) {
        if (isArray(newJson[newKeys[n]]) && isArray(curJson[curKeys[c]])) {
          let aryDiff = diffArray(curJson[curKeys[c]], newJson[newKeys[n]]);
          if (aryDiff) {
            diffs.push((path? path+':'+n: n)+'/a/'+JSON.stringify(aryDiff))
          }
        } else if (typeof newJson[newKeys[n]] === 'object' && typeof curJson[curKeys[c]] === 'object') {
          //console.log('both node is object', c, n, curKeys)
          _diff(curJson[curKeys[c]], newJson[newKeys[n]], (path? path + ':'+ n:n), diffs);
          //console.log('both node is object after', c, n, curKeys)
        } else if (newJson[newKeys[n]] !== curJson[curKeys[c]]) {
          //console.log('two node has diff values:', newKeys[n],newJson[newKeys[n]], curKeys[c], curJson[curKeys[c]])
          //nodes with the same key, but different values
          diffs.push((path? path+':'+n: n)+'/c/'+JSON.stringify(curJson[curKeys[c]])+'/'+JSON.stringify(newJson[newKeys[n]]));
        }  
        curKeys.splice(c, 1);
        //console.log(' splice the matched one frm curKeys:', curKeys);
        break;
      }
    }
    if (c < 0 && curKeys.length > 0) {
      //new node in newJson
      //console.log('no matched key in curKeys', c, n,curKeys)
      diffs.push((path? path + ':'+ n:n)+'/+/'+newKeys[n]+'/'+JSON.stringify(newJson[newKeys[n]]));
    }
  }
  //missing
  for (let c = 0; c < curKeys.length; c++) {
    //console.log('more keys in curKeys', curKeys)
    diffs.push((path? path + ':'+ (newKeys.length+c):newKeys.length+c)+'/-/'+curKeys[c]+'/'+JSON.stringify(curJson[curKeys[c]]));
  }
  return diffs;
}

export function diff(left, right) {
  if (typeof left != 'object' || typeof right != 'object')
    return

  let diffs = _diff(left, right);
  //console.log('diffs result = ', diffs);
  if (diffs == undefined || diffs.length === 0) return
  return diffs;
}

function _deduceArray(orig, diffs, forward) {
  //diffs[] =   [ '0/a/["|c|[{\\"a\\":2}]|[{\\"a\\":3}]|1"]' ]

  console.log('_deduceArray incoming cur = ', orig, diffs, forward)
  let newAry = [], srcIdx = 0, dstIdx = 0;
  diffs.forEach ( d => {
    let parts = d.split('|');
    console.log('_deduceArray:', srcIdx, dstIdx, parts, 'newAry = ', newAry)
    if (parts[0] === 'c') {
      let blkEnd = Number(parts[3]), end = forward? (srcIdx+blkEnd-dstIdx):blkEnd
      let cnr = aryCopy(orig, srcIdx, end, newAry);
      srcIdx += cnr, dstIdx += cnr;
      console.log('b4 deduced by change op', orig[parts[3]] )
      let res = JSON.parse(forward? parts[2] : parts[1]);
      newAry.splice(dstIdx, 0, ...res);
      dstIdx += res.length
      let srcBlk = JSON.parse(forward? parts[1] : parts[2]);
      srcIdx += srcBlk.length
      console.log('deduced by change op change', newAry, srcBlk, dstIdx, srcIdx )
    } else if (parts[0] === '+') {
      let blkEnd = Number(parts[2]), end = forward? (srcIdx+blkEnd-dstIdx):blkEnd
      let cnr = aryCopy(orig, srcIdx, end, newAry);
      srcIdx += cnr, dstIdx += cnr;
      let p1 = JSON.parse(parts[1]);
      if (forward) {
        newAry.splice(dstIdx, 0, ...p1);
        dstIdx += p1.length
      } else {
        srcIdx += p1.length
      }
      console.log('deduced by change op+', newAry, p1, dstIdx, srcIdx )
    } else if (parts[0] === '-') {
      let blkEnd = Number(parts[2]), start = srcIdx, end = forward? (start+blkEnd-dstIdx):blkEnd
      console.log('b4 aryCopy:', start, end, blkEnd, srcIdx, dstIdx)
      let cnr = aryCopy(orig, start, end, newAry);
      srcIdx += cnr, dstIdx += cnr;
      let p1 = JSON.parse(parts[1]);
      if (forward) {
        srcIdx += p1.length;
      } else {
        newAry.splice(dstIdx, 0, ...p1);
        dstIdx += p1.length
      }
      console.log('deduced by change op-', newAry, p1, dstIdx, srcIdx )
    }
  })
  if (srcIdx < orig.length) {
      console.log('remaining elms', newAry, srcIdx, dstIdx )
    newAry.splice(dstIdx, 0, ...orig.slice(srcIdx))
  }
console.log('orig = ', newAry)
  return newAry;
}

export function deduce(cur, diffs, dir) {
  //console.log('incoming cur = ', cur, diffs, dir)
  var newObj = Object.assign({}, cur);
  //console.log('newObj = ', newObj, cur);
  diffs.forEach( d => {
    let parts = d.split('/');
    // '2:1:1:0/c/1/11', '2/+/c/{"a":2}'
    let path = parts[0].split(':');
    let key = path.pop();
    let node = path.reduce((obj, idx) => obj[Object.keys(obj)[idx]], newObj);
    let forward = (dir === 1 || dir === 'f');
    //console.log('deducing...', path, parts, key, 'node = ',node, forward, cur, diffs)
    if (parts[1] === 'a') {
      //array diffs i.e.   [ '0/a/["|c|[{\\"a\\":2}]|[{\\"a\\":3}]|1"]' ]
      console.log('cur val at node(Array) = ', node[Object.keys(node)[key]], node, key, parts)
      node[Object.keys(node)[key]] = _deduceArray(node[Object.keys(node)[key]], JSON.parse(parts[2]), forward);

      console.log('after val at node = ', node[Object.keys(node)[key]], node, key, newObj)
    } else if (parts[1] === 'c') {
      //console.log('cur val at node = ', node[Object.keys(node)[key]], node, key, parts)
      node[Object.keys(node)[key]] = JSON.parse(forward? parts[3] : parts[2]);

      //console.log('after val at node = ', node[Object.keys(node)[key]], node, key, newObj)
    } else if (parts[1] === '+') {
      //console.log('+ to node', node, forward, newObj)
      if (forward) node[[parts[2]]] = JSON.parse(parts[3]);
      else delete node[parts[2]];
    } else if (parts[1] === '-') {
      //console.log('- to node', node, forward, newObj)
      if (forward) delete node[parts[2]];
      else node[[parts[2]]] = JSON.parse(parts[3]);
    }
  });
  //console.log('returned deduced obj = ', newObj)
  return newObj;
}