var assert = require('chai').assert;
import createObjectHistory from '../src/history.js';

const _pick = (obj, ...keys) => {
  return keys.reduce((no, k) => {
    no[k] = obj[k];
    return no;
  }, {})
}

describe('Object History API Testing', function() {
  var history, startObj =  {a:1, b:{c:3}};
  beforeEach(function() {
    history = createObjectHistory({
      obj: startObj,
      history: {
        count: 3
      }
    })
  })
  describe('Object History Update', function() {
    it('Updating history should change history', function() {
      var pos = history.update({a:2, b:3}, {type: 'NEW_TODO'});
      console.log('new pos after updating', pos);
      assert.deepEqual({forward:0, back: 1}, _pick(pos, 'forward', 'back'));
    });

    it('Updating history with the same Object should not change history', function() {
      const obj = {a:2, b:3};
      var pos = history.update(obj, {type: 'NEW_TODO'});
      console.log('new pos after updating', pos);
      var newpos = history.update(obj, {type: 'NEW_TODO'});
      console.log('new pos after updating with the same obj', pos);
      assert.deepEqual({forward:0, back: 1}, _pick(pos, 'forward', 'back'));
      assert.deepEqual(newpos, pos);
    });

    it('Updating history twice should have two back navigatable', function() {
      let pos = history.update({a:2, b:3}, {type: 'NEW_TODO'});
      pos = history.update({a:2, b:{d:2}}, {type: 'NEW_TODO'});
      console.log('new pos after updating', pos);
      assert.deepEqual({forward:0, back: 2}, _pick(pos, 'forward', 'back'));
    })

    it('History cannot have more items then it is configed', function() {
      let pos = history.update({a:2, b:3}, {type: 'NEW_TODO'});
      pos = history.update({a:2, b:{d:2}}, {type: 'NEW_TODO'});
      pos = history.update({a:2, b:{dd:2}}, {type: 'NEW_TODO'});
      console.log('new pos after three updatings', pos);
      assert.deepEqual({forward:0, back: 3}, _pick(pos, 'forward', 'back'));
      const obj4 = {a:2, b:{bdd:2}};
      pos = history.update(obj4, {type: 'NEW_TODO'});
      console.log('new pos after four updatings', pos);
      assert.deepEqual(obj4, pos.cur.obj);
      assert.deepEqual({forward:0, back: 3},  _pick(pos, 'forward', 'back'), 'max history items is 3');
    })
  })

  describe('Object History Back api', function() {
    var obj1 = {a:2, b:3};
    var obj2 = {a:2, b:4};
    var obj3 = {a:2, b:5}
    beforeEach(function() {
      history.update(obj1, {type: 'NEW_TODO'});
      history.update(obj2, {type: 'NEW_TODO'});
      history.update(obj3, {type: 'NEW_TODO'});
    })

    it('Back once should have 1 forward and 2 backword', function() {
      var pos = history.back();
      console.log('new pos after back', pos);
      assert.deepEqual(obj2, pos.cur.obj)
      assert.deepEqual({forward:1, back: 2}, _pick(pos, 'forward', 'back'));
    });

    it('Back three comes to the original', function() {
      var pos = history.back();
      console.log('new pos after back', pos);
      pos = history.back();
      console.log('new pos after second back', pos);
      pos = history.back();
      console.log('new pos after the third back', pos);
      assert.deepEqual(startObj, pos.cur.obj)
      assert.deepEqual({forward:3, back: 0}, _pick(pos, 'forward', 'back'));
    })

    it('Back cannot be beyond leftmost', function() {
      var pos = history.back();
      pos = history.back();
      pos = history.back();
      pos = history.back();
      pos = history.back();

      var newpos = history.back();
      assert.deepEqual(newpos, pos);
      assert.deepEqual(startObj, newpos.cur.obj)
      assert.deepEqual({forward:3, back: 0}, _pick(pos, 'forward', 'back'));
    })
  })

  describe('Object History Forward api', function() {
    var obj1 = {a:2, b:3};
    var obj2 = {a:2, b:4};
    var obj3 = {a:2, b:5};

    beforeEach(function() {
      history.update(obj1, {type: 'NEW_TODO'});
      history.update(obj2, {type: 'NEW_TODO'});
      history.update(obj3, {type: 'NEW_TODO'});
      //navigated to left-most
      history.back();
      history.back();
      let pos = history.back();
      console.log('history pos after 3 back()s', pos)
    })

    it('Forward once should have 1 back and 2 forward', function() {
      var pos = history.forward();
      console.log('new pos after forward', pos);
      assert.deepEqual(obj1, pos.cur.obj)
      assert.deepEqual({forward:2, back: 1}, _pick(pos, 'forward', 'back'));
    });

    it('Forward three times comes to the last', function() {
      var pos = history.forward();
      pos = history.forward();
      pos = history.forward();
      console.log('new pos after second forward', pos);
      assert.deepEqual(obj3, pos.cur.obj)
      assert.deepEqual({forward:0, back: 3}, _pick(pos, 'forward', 'back'));
    })

    it('Back cannot be beyond leftmost', function() {
      var pos = history.forward();
      pos = history.forward();
      pos = history.forward();
      var newpos = history.forward();
      assert.deepEqual(newpos, pos)
      assert.deepEqual({forward:0, back: 3}, _pick(pos, 'forward', 'back'));
    })
  })

  describe('Object History GO api', function() {
    var obj1 = {a:2, b:3};
    var obj2 = {a:2, b:4};
    var obj3 = {a:2, b:5};
    var objCur

    beforeEach(function() {
      history.update(obj1, {type: 'NEW_TODO'});
      history.update(obj2, {type: 'NEW_TODO'});
      objCur = history.update(obj3, {type: 'NEW_TODO'});
      
    })

    it('Go forward has no effet when it is already on top', function() {
      var pos = history.go(1);
      console.log('new pos after going 1 step forward', pos);
      assert.deepEqual(obj3, pos.cur.obj)
      assert.deepEqual({forward:0, back: 3}, _pick(pos, 'forward', 'back'));
    });

    it('Go one step backwards should reduce back by 1', function() {
      var pos = history.go(-1);
      console.log('new pos after forward', pos);
      assert.deepEqual(obj2, pos.cur.obj)
      assert.deepEqual({forward:1, back: 2}, _pick(pos, 'forward', 'back'));
      pos = history.go(-1);
      console.log('new pos after forward', pos);
      assert.deepEqual(obj1, pos.cur.obj)
      assert.deepEqual({forward:2, back: 1}, _pick(pos, 'forward', 'back'));
    });

    it('Go 1 step backward and 1 step forward should come back to where it was', function() {
      var pos = history.go(-1);
      console.log('new pos after forward', pos);
      pos = history.go(1);
      console.log('new pos after forward', pos);
      assert.deepEqual(objCur, pos)
      assert.deepEqual({forward:0, back: 3}, _pick(pos, 'forward', 'back'));
    });

    it('Go multiple steps back&forth once should work', function() {
      var pos = history.go(-3);
      console.log('new pos after forward', pos);
      assert.deepEqual(startObj, pos.cur.obj)
      assert.deepEqual({forward:3, back: 0}, _pick(pos, 'forward', 'back'));

      var pos = history.go(3);
      console.log('new pos after forward', pos);
      assert.deepEqual(objCur, pos)
      assert.deepEqual({forward:0, back: 3}, _pick(pos, 'forward', 'back'));
    });

    it('Go more steps backward than history.count should arrive the original', function() {
      var pos = history.go(-10);
      console.log('new pos after forward', pos);
      assert.deepEqual(startObj, pos.cur.obj)
      assert.deepEqual({forward:3, back: 0}, _pick(pos, 'forward', 'back'));

      pos = history.go(1);
      console.log('new pos after forward', pos);
      pos = history.go(10);
      console.log('new pos after forward', pos);
      assert.deepEqual(objCur, pos)
      assert.deepEqual({forward:0, back: 3}, _pick(pos, 'forward', 'back'));
    });

  })

  describe('Object History With Very Complex Objects', function() {
    it('Updating history should change history', function() {
      let comObj1 = {a:3, b: {a:1, b:{a:1, c:2, d:{d:1, b:{a:2, b:{a:2, d:{d:{d:{d:{e:2}}}} ,c:3}, v:1, vs:'asdfasdfa '}, g:1, ge:{}, hj:23}}}, ui:{u:{u:'i', v:'asdfasdf', e:3}, hjj:3}, hj:34};
      let comObj2 = {a:3, b: {a:1, b:{a:1, c:2, d:{d:1, b:{a:2, b:{a:2, d:{d:{d:{d:{e:5}}}} ,c:3}, v:1, vs:'asdfasdfa '}, g:1, ge:{}, hj:23}}}, ui:{u:{u:'ie', v:'asdfasdf', e:3}}, hj:34};
      let comObj3 = {a:3, b: {a:1, b:{a:1, c:2, d:{d:1, b:{a:2, b:{a:2, d:{d:{d:{d:{e:2, d:{a:5, f:{f:{r:3}}}}}}} ,c:3}, v:1, vs:'asdfasdfa '}, g:1, ge:{}, hj:23}}}, ui:{u:{u:'i', v:'asdfasdf', e:3}}, hj:34};
      
     
      var pos = history.update(comObj1, {type: 'NEW_TODO'});
      history.update(comObj2);
      history.update(comObj3);
      pos = history.go(-2);
      console.log('new pos after updating', pos);
      assert.deepEqual(comObj1, pos.cur.obj);
      pos = history.go(1);console.log('new pos after updating', pos);
      assert.deepEqual(comObj2, pos.cur.obj);
    });

    it('Updating history of Todos state data', function() {
      let initialState = {"todos":[],"visibilityFilter":"SHOW_ALL"}
      let st1 = {"todos":[{"id":0,"text":"em","completed":false},{"id":1,"text":"vm","completed":true},{"id":2,"text":"ski","completed":false}],"visibilityFilter":"SHOW_ALL"}
      let st2 = {"todos":[{"id":0,"text":"em","completed":false},{"id":1,"text":"vm","completed":false},{"id":2,"text":"ski","completed":false}],"visibilityFilter":"SHOW_ALL"}
      let st3 = {"todos":[{"id":0,"text":"em","completed":false},{"id":1,"text":"vm","completed":false},{"id":2,"text":"ski","completed":false}],"visibilityFilter":"SHOW_ACTIVE"}
      let st4 = {"todos":[{"id":0,"text":"em","completed":false},{"id":1,"text":"vm","completed":false},{"id":2,"text":"ski","completed":true}],"visibilityFilter":"SHOW_ALL"}
      
      let pos = history.update(initialState, {type: 'init'})
      let cur = history.update(st1, {type: 'toggling', id: 0});
      cur = history.update(st2);
      cur = history.update(st3);
      cur = history.update(st4);
      let back4s = history.go(-4)
      console.log('backward 4 steps:', back4s, 'position after initialState:', pos)
      assert.deepEqual(back4s.obj, pos.obj)
      pos = history.go(4)
      console.log('forward 4 steps', pos, cur)
      assert.deepEqual(pos, cur)
      pos = history.back();
      console.log('one step back again:', pos.cur.obj)
      assert.deepEqual(pos.cur.obj, st3)
    })
  });

});