var assert = require('chai').assert;
import { diff as diffObj,  deduce } from '../src/diff/diff-obj.js';

describe('Diff two JS objects', function() {
  it('two empty objects should be equal', function() {
    var diffs = diffObj({}, {})
    assert.equal(diffs, undefined);
  });

  it('diff to current empty object should be itself', function() {
    var diffs = diffObj({}, {a:1})
    assert.equal(diffs[0], '0/+/a/1');
  });

  it('diff to new empty object should be itself', function() {
    var diffs = diffObj({a:1}, {})
    assert.equal(diffs[0], '0/-/a/1');
  });

  it('two equal objects should be equal', function() {
    var diffs = diffObj({a:1}, {a:1});
    assert.equal(diffs, undefined);
  })

  it('two diff objects should be found', function() {
    var diffs = diffObj({a:1}, {a:2});
    console.log('diffs = ',diffs)
    assert.equal(1, diffs.length);
  })

  it('two diff objects should be found', function() {
    var diffs = diffObj({a:1}, {a:2, b:2});
    console.log('diffs = ',diffs)
    assert.equal(2, diffs.length);
  })

  it('deleted node  should be found', function() {
    var diffs = diffObj({a:2, b:2}, {a:2});
    console.log('diffs = ',diffs)
    assert.equal(1, diffs.length);
  })

  it('deleted node-obj  should be found', function() {
    var diffs = diffObj({a:2, b:{a:2 }}, {a:2});
    console.log('diffs = ',diffs)
    assert.equal(1, diffs.length);
  })

  it('two diff objects with two deepth should be found', function() {
    var diffs = diffObj({a:2, c:{a:1}, b:2}, {a:2, b:2, c:{a:2}});
    console.log('diffs = ',diffs)
    assert.equal(1, diffs.length);
  })


  it('two diff objects with two deepth should be found', function() {
    var diffs = diffObj({a:2, d:{a:1}, b:2}, {a:2, b:2, c:{a:2}});
    console.log('diffs = ',diffs)
    assert.equal(2, diffs.length);
  })

  it('two diff objects with three deepth should be found', function() {
    var diffs = diffObj({a:{}, c:{a:1, b:{a:2, b:{c:1}}}, b:2}, {a:2, b:2, c:{a:2, b:{a:2, b:{c:11}}}});
    console.log('diffs = ',diffs)
    assert.equal(3, diffs.length);
  })
});

describe('Deduce a new object based on current one with diff', function() {
  it('two empty objects should be equal', function() {
    var cur = {a:2}
    var diffs =  [ '0/c/1/2' ];
    var prev = deduce(cur, diffs, -1);
    console.log(' deduced obj = ', prev)
    assert.deepEqual(prev.a, 1);
  });

  it('back by deletion', function() {
    var cur =  { a: 2, b: 2 }
    var diffs =  [ '1/+/b/2' ];
    var prev = deduce(cur, diffs, -1);
    var now = deduce(prev, diffs, 'f');
    console.log(' deduced obj = ', prev, now);
    assert.deepEqual(cur, now);
  });

  it('back by deletion&changes', function() {
    var cur =  { a: 2, b: 2 }
    var diffs =  [ '1/+/b/2', '0/c/1/2'];
    var reversedDiffs = [ '0/c/1/2', '1/+/b/2'];
    var prev = deduce(cur, diffs, -1);
    var prev2 = deduce(cur, reversedDiffs, 'b');
    console.log(' deduced obj = ', prev, prev2);
    assert.deepEqual(prev, prev2)
    var now = deduce(prev, diffs, 'f');
    assert.deepEqual(cur, now);
  });

  it('navigation with two deepth', function() {
    // prev = {a:{}, c:{a:1, b:{a:2, b:{c:1}}}, b:2}
    var cur =  {a:2, b:2, c:{a:2, b:{a:2, b:{c:11}}}}
    console.log('cur = ', cur, cur.c.a, cur.c.b.b.c)
    var diffs =  [ '2:1:1:0/c/1/11', '2:0/c/1/2', '0/c/{}/2'];
    var prev = deduce(cur, diffs, -1);
    var now = deduce(prev, diffs, 'f');
    console.log(' deduced obj = ', prev, now);
    assert.deepEqual(cur, now);
  });

  
  it('back by deletion&addition', function() {
    //orig = { a: 2, d: { a: 1 }, b: 2 }
    var cur =  {a:2, b:2, c:{a:2}}
    var diffs =  ['2/+/c/{"a":2}', '3/-/d/{"a":1}' ];
    var prev = deduce(cur, diffs, -1);
    var now = deduce(prev, diffs, 'f');
    console.log(' deduced obj = ', prev, now, cur);
    assert.deepEqual(cur, now);
  });

  it('two empty objects should be equal', function() {
    var cur = {b:2}
    var diffs =  [ '1/-/d/{"a":1}' ];
    var prev = deduce(cur, diffs, -1);
    console.log(' deduced obj = ', prev);
    var now = deduce(prev, diffs, 'f');
    assert.deepEqual(cur, now);
  });
});

describe('Object Diff between Array', function() {

  describe('Diff Array', function() {
    it('two empty array should be equal', function() {
      var diffs = diffObj({a: []}, {a: []})
      assert.equal(diffs, undefined);
    });

    it('current is empty and the new has one element', function() {
      var diffs = diffObj({a: []}, {a: [1]})
      console.log('diffs = ', diffs)
      assert.equal(diffs.length, 1);
    });

    it('two objects with two equal nonempty arrays', function() {
      var diffs = diffObj({a: [1]}, {a: [1]})
      console.log('diffs = ', diffs)
      assert.equal(diffs, undefined);
    });

    it('two objects with two unequal, nonempty arrays', function() {
      var diffs = diffObj({a: ['a', 'b', 1,2,3, 4, 5]}, {a: [1,2,'a',3, 4, 8,9]})
      console.log('diffs = ', diffs)
      assert.equal(diffs.length, 1);
    });

    it('two objects with two unequal, nonempty arrays', function() {
      var diffs = diffObj({a: [1,2,'a',3, 4, 8,9, 6]}, {a: ['a', 'b', 1,2,3, 4, 9, 6,8]})
      console.log('diffs = ', diffs)
      assert.equal(diffs.length, 1);
    });

    it('two objects with two unequal, nonempty arrays', function() {
      var diffs = diffObj({a: [1,2,3, 4, 5, 'a']}, {a: ['a',1,2,8,3, 4, 9]})
      console.log('diffs = ', diffs)
      assert.equal(diffs.length, 1);
    });

    it('two objects with two unequal, nonempty arrays', function() {
      var diffs = diffObj({a: ['l','m','n','o', 'a','b','c', 1,2,'e','f','g']}, {a: [1,2,'l','m','n','o',7,8,9,0,0]})
      console.log('diffs = ', diffs)
      assert.equal(diffs.length, 1);
    });

    it('two arrays containing js object elements', function() {
      var diffs = diffObj({a: [{a:1}, {a:2}]}, {a: [{a:1},{a:3}]})
      console.log('diffs = ', diffs)
      assert.equal(diffs.length, 1);
    });

    it('arrays of todos data', function() {
      var no = {"todos":[{"id":0,"text":"em","completed":false},{"id":1,"text":"vm","completed":true},{"id":2,"text":"ski","completed":false}],"visibilityFilter":"SHOW_ALL"}
      var co = {"todos":[{"id":0,"text":"em","completed":false},{"id":1,"text":"vm","completed":false},{"id":2,"text":"ski","completed":false}],"visibilityFilter":"SHOW_ALL"}
      var diffs = diffObj(co, no)
      console.log('diffs between todos states:', diffs)
      assert.equal(diffs.length, 1)
      assert.include(diffs[0], 'c|')
    })


  });

  describe('Deduce JS Objects containing Array', function() {


    it('arrays of js objects', function() {
      var no = {a: 1, b:[ 'a', 1, 2, 8, 3, 4, 9,6 ], c:2}, 
      co = {a: 1, b: [ 1, 2, 3, 4, 5, 'a',6 ], c: 2}, 
      diffs = [ '1/a/["+|[\\"a\\"]|0","+|[8]|3","c|[5,\\"a\\"]|[9]|6"]' ];

      var res = deduce(no,  diffs, -1)
      console.log('orig val = ', res)
      assert.deepEqual(res,  co)

      res = deduce(co, diffs, 1)
      console.log('orig val = ', res)
      assert.deepEqual(res,  no)
    })

    it('arrays of js objects', function() {
      var no = {a: ['a', 'b', 1,2,3, 4, 9, 6,8]}, 
      co = {a: [1,2,'a',3, 4, 8,9, 6]}, 
      diffs = [ '0/a/["+|[\\"a\\",\\"b\\"]|0","-|[\\"a\\"]|4","-|[8]|6","+|[8]|8"]' ];

      var res = deduce(no,  diffs, -1)
      console.log('orig val = ', res)
      assert.deepEqual(res,  co)

      res = deduce(co, diffs, 1)
      console.log('orig val = ', res)
      assert.deepEqual(res,  no)
    })

    it('arrays of js objects', function() {
      var a = {a: [{a:1},{a:3}]};

      var r = deduce(a,  [ '0/a/["c|[{\\"a\\":2}]|[{\\"a\\":3}]|1"]' ], -1)
      console.log('orig val = ', r)
      assert.deepEqual(r, {a: [{a:1}, {a:2}]})
    })

    it('arrays of todos data', function() {
      var no = {"todos":[{"id":0,"text":"em","completed":false},{"id":1,"text":"vm","completed":true},{"id":2,"text":"ski","completed":false}],"visibilityFilter":"SHOW_ALL"}
      var co = {"todos":[{"id":0,"text":"em","completed":false},{"id":1,"text":"vm","completed":false},{"id":2,"text":"ski","completed":false}],"visibilityFilter":"SHOW_ALL"}
      var diffs = ['0/a/["c|[{\\"id\\":1,\\"text\\":\\"vm\\",\\"completed\\":false}]|[{\\"id\\":1,\\"text\\":\\"vm\\",\\"completed\\":true}]|1"]']
      var r = deduce(no, diffs, -1)
      console.log('diffs between todos states:', r)
      assert.deepEqual(co, r)
    })


  })

})