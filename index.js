
/**
 * slice() reference.
 */

var slice = Array.prototype.slice;

/**
 * Expose `co`.
 */

module.exports = co['default'] = co.co = co;

/**
 * Wrap the given generator `fn` into a
 * function that returns a promise.
 * This is a separate function so that
 * every `co()` call doesn't create a new,
 * unnecessary closure.
 *
 * @param {GeneratorFunction} fn
 * @return {Function}
 * @api public
 */

co.wrap = function (fn) {
  createPromise.__generatorFunction__ = fn;
  return createPromise;
  function createPromise() {
    return new CoRoutine().wrap(this, fn, arguments);
  }
};

/**
 * Execute the generator function or a generator
 * and return a promise.
 *
 * @param {Function} gen
 * @return {Promise}
 * @api public
 */

function co(gen) {
  return new CoRoutine().execute(this, gen, arguments);
}

 /**
  * Initialize a new `CoRoutine`.
  *
  * @api private
  */

function CoRoutine() {
}

/**
 * CoRoutine prototype.
 */

CoRoutinePrototype = CoRoutine.prototype;

/**
 * Execute the generator function or a generator
 * and return a promise.
 *
 * @param {Object} generatorContext
 * @param {Function} generator
 * @param {Object} args
 * @return {Promise}
 * @api private
 */

CoRoutinePrototype.execute = function(generatorContext, generator, args) {
  var ctx = this;
  return new Promise(function(resolve, reject) {
      var executedGenerator = ctx._executeGenerator(generatorContext, generator, args);
      ctx._start(executedGenerator, resolve, reject);
  });
};

/**
 * Execute the generator function or a generator for `wrap`
 * and return a promise.
 *
 * @param {Object} generatorContext
 * @param {Function} generator
 * @param {Object} args
 * @return {Promise}
 * @api private
 */
CoRoutinePrototype.wrap = function(generatorContext, generator, args) {
  var ctx = this;
  return new Promise(function(resolve, reject) {
      var executedGenerator = ctx._executeGeneratorForWrap(generatorContext, generator, args);
      ctx._start(executedGenerator, resolve, reject);
  });
};

/**
 * Execute the generator function,
 * and return an invoked generator object.
 *
 * @param {Object} generatorContext
 * @param {Function} generator
 * @param {Object} args
 * @return {Object}
 * @api private
 */

CoRoutinePrototype._executeGenerator = function(generatorContext, generator, args) {
    if (!this._isFunction(generator)) return generator;

    var argc = args.length;

    if (argc === 1) {
      return generator.call(generatorContext);
    } else if (argc === 2) {
      return generator.call(generatorContext, args[1]);
    } else {
      return generator.apply(generatorContext, slice.call(args, 1));
    }
};

/**
 * Execute the generator function for `wrap`,
 * and return an invoked generator object.
 *
 * @param {Object} generatorContext
 * @param {Function} generator
 * @param {Object} args
 * @return {Object}
 * @api private
 */

CoRoutinePrototype._executeGeneratorForWrap = function(generatorContext, generator, args) {
    if (!this._isFunction(generator)) return generator;

    var argc = args.length;

    if (argc === 0) {
      return generator.call(generatorContext);
    } else if (argc === 1) {
      return generator.call(generatorContext, args[0]);
    } else {
      return generator.apply(generatorContext, args);
    }
};

/**
 * Start to process the main logic.
 *
 * @param {Object} executedGenerator
 * @param {Function} resolve
 * @param {Function} reject
 * @api private
 */
CoRoutinePrototype._start  = function(executedGenerator, resolve, reject) {
  if (!executedGenerator || !this._isFunction(executedGenerator.next)) resolve(executedGenerator);

  this._generator = executedGenerator;
  this._resolve = resolve;
  this._reject  = reject;

  this._onFulfilled();
};

/**
 * @param {Mixed} res
 * @return {Promise}
 * @api private
 */

CoRoutinePrototype._onFulfilled = function(res) {
  var ret;
  try {
    ret = this._generator.next(res);
  } catch (e) {
    return this._reject(e);
  }
  this._next(ret);
};

/**
 * @param {Error} err
 * @return {Promise}
 * @api private
 */

CoRoutinePrototype._onRejected = function(err) {
  var ret;
  try {
    ret = this._generator.throw(err);
  } catch (e) {
    return this._reject(e);
  }
  this._next(ret);
};

/**
 * Get the next value in the generator
 *
 * @param {Object} ret
 * @api private
 */

CoRoutinePrototype._next = function(ret) {
  if (ret.done) {
    this._resolve(ret.value);
  } else {
    this._executePromise(ret.value);
  }
};

/**
 * Execute a converted promise from a `yield`ed value.
 *
 * @param {Mixed} obj
 * @api private
 */

CoRoutinePrototype._executePromise = function(obj) {
    var promise = this._convertPromise(obj);

    if (promise) {
      var ctx = this;

      promise.then(function(res) {
        ctx._onFulfilled(res);
      }, function(err) {
        ctx._onRejected(err);
      });
    } else {
        this._onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, ' +
        'but the following object was passed: "' + String(obj) + '"'));
    }
};

/**
 * Convert a `yield`ed value into a promise.
 *
 * @param {Mixed} obj
 * @return {Promise}
 * @api private
 */

CoRoutinePrototype._convertPromise = function(obj) {
  var promise;

  if (obj) {
    if (this._isPromise(obj)) {
      promise = obj;
    } else if (this._isGenerator(obj) || this._isGeneratorFunction(obj)) {
      promise = co(obj);
    } else if (this._isFunction(obj)) {
      promise = this._convertThunkToPromise(obj);
    } else if (Array.isArray(obj)) {
      promise = this._convertArrayToPromise(obj);
    } else if (this._isObject(obj)) {
      promise = this._convertObjectToPromise(obj);
    }
  }

  return promise;
};

/**
 * Convert a thunk to a promise.
 *
 * @param {Function}
 * @return {Promise}
 * @api private
 */

CoRoutinePrototype._convertThunkToPromise = function(fn) {
    var ctx = this;
    return new Promise(function (resolve, reject) {
      fn.call(ctx, function (err, res) {
        if (err) return reject(err);
        if (arguments.length > 2) res = slice.call(arguments, 1);
        resolve(res);
      });
  });
};

/**
 * Convert an array of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Array} obj
 * @return {Promise}
 * @api private
 */

CoRoutinePrototype._convertArrayToPromise = function(arr) {
  var arrayLen = arr.length;
  var promises = new Array(arrayLen);

  for(var i = 0; i < arrayLen; i++) {
    promises[i] = this._convertPromise(arr[i]);
  }

  return Promise.all(promises);
};

/**
 * Convert an object of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Object} obj
 * @return {Promise}
 * @api private
 */

CoRoutinePrototype._convertObjectToPromise = function(obj) {
  var results = new obj.constructor();
  var keys = Object.keys(obj);
  var promises = [];

  var keyLength = keys.length;
  for (var i = 0; i < keyLength; i++) {
    var key = keys[i];
    var target = this._convertPromise(obj[key]) || obj[key];

    if (target && this._isPromise(target)) {
      defer(target, key);
    } else {
      results[key] = target;
    }
  }

  function defer(promise, key) {
    // predefine the key in the result
    results[key] = undefined;
    promises.push(promise.then(function (res) {
      results[key] = res;
    }));
  }

  return Promise.all(promises).then(function () {
    return results;
  });
};

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

CoRoutinePrototype._isPromise = function(obj) {
  return 'function' == typeof obj.then;
};

/**
 * Check if `obj` is a function.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

CoRoutinePrototype._isFunction  = function(obj) {
  return 'function' == typeof obj;
};

/**
 * Check if `obj` is a generator.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

CoRoutinePrototype._isGenerator  = function(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
};

/**
 * Check if `obj` is a generator function.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

CoRoutinePrototype._isGeneratorFunction  = function(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return this._isGenerator(constructor.prototype);
};

/**
 * Check if `obj` is a object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

CoRoutinePrototype._isObject = function(obj) {
  return Object == obj.constructor;
};
