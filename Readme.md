# co-booster

[![NPM version][npm-image]][npm-url]

  `co-booster` is a performance tuning version of `co`. If you're already using `co`, you can make it work faster by changing only the module. Naturally, It's fully compatible with `co`.

  `co` is Generator based control flow goodness for nodejs and the browser, using promises, letting you write non-blocking code in a nice-ish way. You can check out `co` [here](https://github.com/tj/co).

  This work is all thanks to tj who is the author of `co`.

## How to change from `co`
  Just change the module. You don't need anything else.

  ```js
  //var co = require('co');
  var co = require('co-booster');

  co(function *(){
    ...
  });
  ```

## Performance
- co() - [benchmark code](https://gist.github.com/ifsnow/15a25b14a1aa8b998970380749fe0854)
  - Node 4.4.7 : 8% faster
  - Node 6.9.1 : 12% faster

- co.wrap() - [benchmark code](https://gist.github.com/ifsnow/b23435726b15e92ebeab8a1ad96787c5)
  - Node 4.4.7 : 3% faster
  - Node 6.9.1 : 8% faster

- koa@1 style - [benchmark code](https://gist.github.com/ifsnow/5481c17061b370df71d2ccc0d70bc9cc)
  - Node 4.4.7 : 15% faster
  - Node 6.9.1 : 32%  faster

## Platform Compatibility

  `co-booster` requires a `Promise` implementation.
  For versions of node `< 0.11` and for many older browsers,
  you should/must include your own `Promise` polyfill.

  When using node 0.10.x and lower or browsers without generator support,
  you must use [gnode](https://github.com/TooTallNate/gnode) and/or [regenerator](http://facebook.github.io/regenerator/).

  When using node 0.11.x, you must use the `--harmony-generators`
  flag or just `--harmony` to get access to generators.

  Node v4+ is supported out of the box, you can use `co-booster` without flags or polyfills.

## Installation

```
$ npm install co-booster
```

## Associated libraries

Any library that returns promises work well with `co-booster`.

- [mz](https://github.com/normalize/mz) - wrap all of node's code libraries as promises.

View the [wiki](https://github.com/visionmedia/co/wiki) for more libraries.

## Examples

```js
var co = require('co-booster');

co(function *(){
  // yield any promise
  var result = yield Promise.resolve(true);
}).catch(onerror);

co(function *(){
  // resolve multiple promises in parallel
  var a = Promise.resolve(1);
  var b = Promise.resolve(2);
  var c = Promise.resolve(3);
  var res = yield [a, b, c];
  console.log(res);
  // => [1, 2, 3]
}).catch(onerror);

// errors can be try/catched
co(function *(){
  try {
    yield Promise.reject(new Error('boom'));
  } catch (err) {
    console.error(err.message); // "boom"
 }
}).catch(onerror);

function onerror(err) {
  // log any uncaught errors
  // co will not throw any errors you do not handle!!!
  // HANDLE ALL YOUR ERRORS!!!
  console.error(err.stack);
}
```

## Yieldables

  The `yieldable` objects currently supported are:

  - promises
  - thunks (functions)
  - array (parallel execution)
  - objects (parallel execution)
  - generators (delegation)
  - generator functions (delegation)

Nested `yieldable` objects are supported, meaning you can nest
promises within objects within arrays, and so on!

### Promises

[Read more on promises!](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

### Thunks

Thunks are functions that only have a single argument, a callback.
Thunk support only remains for backwards compatibility and may
be removed in future versions of `co-booster`.

### Arrays

`yield`ing an array will resolve all the `yieldables` in parallel.

```js
co(function* () {
  var res = yield [
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3),
  ];
  console.log(res); // => [1, 2, 3]
}).catch(onerror);
```

### Objects

Just like arrays, objects resolve all `yieldable`s in parallel.

```js
co(function* () {
  var res = yield {
    1: Promise.resolve(1),
    2: Promise.resolve(2),
  };
  console.log(res); // => { 1: 1, 2: 2 }
}).catch(onerror);
```

### Generators and Generator Functions

Any generator or generator function you can pass into `co-booster`
can be yielded as well. This should generally be avoided
as we should be moving towards spec-compliant `Promise`s instead.

## API

### co(fn*).then( val => )

Returns a promise that resolves a generator, generator function,
or any function that returns a generator.

```js
co(function* () {
  return yield Promise.resolve(true);
}).then(function (val) {
  console.log(val);
}, function (err) {
  console.error(err.stack);
});
```

### var fn = co.wrap(fn*)

Convert a generator into a regular function that returns a `Promise`.

```js
var fn = co.wrap(function* (val) {
  return yield Promise.resolve(val);
});

fn(true).then(function (val) {

});
```

## License

  MIT

[npm-image]: https://img.shields.io/npm/v/co.svg?style=flat-square
[npm-url]: https://npmjs.org/package/co-booster
