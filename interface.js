/**
 * Constructs an 'interface' object that validates other objects e.g.
 *
 * var MyInterface = interface({
 *   foo: Function,
 *   bar: Function
 * });
 *
 * var sameObjForConvenience = MyInterface.check(someObj);
 */
function interface(fields) {
  if (interface.Field) {
    for (var f in fields) {
      interface.Field.check(fields[f]);
    }
  }

  function checkError(obj) {
    if (!obj) {
      return new Error('null obj');
    }
    for (var f in fields) {
      if (!fields[f].satisfied(obj[f])) {
        return new Error('Interface not satisfied,' + 
            ' object of instance ' + (obj.constructor.name) +
            ' lacks ' + fields[f].name + ' field ' + f);
      }
    }
    return null;
  };

  return {
    name: '<interface>',
    satisfied: function(obj) {
      var err = checkError(obj);
      if (err) console.warn(err.message);
      return !err;
    },
    check: function(obj) {
      var error = checkError(obj);
      if (error) {
        throw error;
      } else {
        return obj;
      }
    },
    fields: fields
  };
}
interface.extend = function(/* ifaces... */) {
  var union = {};
  var ifaces = arguments;
  var i;
  for (i = 0; i < ifaces.length - 1; i++) {
    angular.extend(union, ifaces[i].fields);
  }

  return interface(angular.extend(union, ifaces[i]));
}
interface.check = function (val) { 
  if (!this.satisfied(val)) {
    throw new Error(val + ' is not a ' + this.name);
  }
  return val;
};
interface.optional = function(type) {
  return {
    name: 'optional(' + type.name + ')',
    satisfied: function (val) {
      return val === null || val === undefined || type.satisfied(val);
    },
    check: interface.check
  };
}
interface.bool = {
  name: 'bool',
  satisfied: function (val) {
    return (typeof val) === 'boolean';
  },
  check: interface.check
};
interface.boolean = interface.bool;

interface.string = {
  name: 'string',
  satisfied: function (val) {
    return (typeof val) === 'string';
  },
  check: interface.check
};
interface.number = {
  name: 'number',
  satisfied: function (val) {
    return (typeof val) === 'number' && !isNaN(val);
  },
  check: interface.check
};
interface.integer = {
  name: 'number',
  satisfied: function (val) {
    return interface.number.satisfied(val) && (val % 1 === 0);
  },
  check: interface.check
};
interface.int = interface.integer;

interface.stringint = {
  name: 'stringint',
  satisfied: function (val) {
    return interface.string.satisfied(val) || interface.integer.satisfied(val);
  },
  check: interface.check
};
interface.stringintbool = {
  name: 'stringintbool',
  satisfied: function (val) {
    return interface.string.satisfied(val) || 
           interface.integer.satisfied(val) ||
           interface.bool.satisfied(val);
  },
  check: interface.check
};
interface.scalar = {
  name: 'scalar',
  satisfied: function (val) {
    return !(val instanceof Object);
  },
  check: interface.check
};
interface.identifier = interface.stringint;
interface.method = {
  name: 'method',
  satisfied: function (val) {
    return val instanceof Function;
  },
  check: interface.check
};
interface.list = function(type) {
  if (!type.satisfied || !type.check) {
    throw new Error('Not a valid type object: ' + type);
  }

  return {
    name: 'list(' + type.name + ')',
    satisfied: function (val) {
      if (! (val instanceof Array) ) {
        return false;
      }
      for (var i = 0, len=val.length; i < len; i++) {
        if (!type.satisfied(val[i])) {
          return false;
        }
      }
      return true;
    },
    check: interface.check
  };
}
interface.map = function(valType) {
  if (!valType.satisfied || !valType.check) {
    throw new Error('Not a valid type object: ' + valType);
  }

  return {
    name: 'map(? -> ' + valType.name + ')',
    satisfied: function (obj) {
      if (! (obj instanceof Object) ) {
        console.warn('Not object)');
        return false;
      }
      for (var k in obj) {
        if (!valType.satisfied(obj[k])) {
          console.warn('Key', k, 'failed, in', obj);
          return false;
        }
      }
      return true;
    },
    check: interface.check
  };
}

interface.func = interface.method;
interface.object = {
  name: 'object',
  satisfied: function (val) {
    return val instanceof Object;
  },
  check: interface.check
};

interface.Field = interface({
  name: interface.string,
  satisfied: interface.method,
  check: interface.method
});
interface.Field.check(interface.string);
interface.Field.check(interface.number);
interface.Field.check(interface.method);

interface.checkInstance = function  (obj, type) {
  interface.func.check(type);
  if (! (obj instanceof type)) {
    throw new Error(obj + ' is not an instance of ' + type.name);
  }
  return obj;
}

module.exports = interface;