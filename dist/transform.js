'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.aggregate = aggregate;
exports.filterByExpr = filterByExpr;
exports.applyFormula = applyFormula;
exports.sample = sample;
var vegadataflow = require('../vendor/vega-dataflow.js');

var tx = vegadataflow.transforms,
    changeset = vegadataflow.changeset;

function aggregate(fields, operations, data) {
  var fieldsForAggregation = [];
  fields.forEach(function (field) {
    fieldsForAggregation.push(vegadataflow.field(field));
  });

  var df = new vegadataflow.Dataflow(),
      col = df.add(tx.Collect),
      agg = df.add(tx.Aggregate, {
    fields: fieldsForAggregation,
    ops: operations,
    pulse: col
  }),
      out = df.add(tx.Collect, { pulse: agg });

  df.pulse(col, changeset().insert(data)).run();

  return out.value;
}

function filterByExpr(expression, data) {
  var expr = vegadataflow.accessor(function (data) {
    return eval(expression);
  });

  var df = new vegadataflow.Dataflow(),
      ex = df.add(null),
      col = df.add(tx.Collect),
      fil = df.add(tx.Filter, { expr: ex, pulse: col }),
      out = df.add(tx.Collect, { pulse: fil });

  df.pulse(col, changeset().insert(data));
  df.update(ex, expr).run();

  return out.value;
}

function applyFormula(expressions, as, data) {
  var expr = [],
      formulas = [];

  var _expressions = _slicedToArray(expressions, 3),
      e1 = _expressions[0],
      e2 = _expressions[1],
      e3 = _expressions[2];

  var df = new vegadataflow.Dataflow(),
      col = df.add(tx.Collect);

  for (var i = 0; i < as.length; i++) {
    if (i === 0) {
      expr[i] = vegadataflow.accessor(function (data) {
        return eval(e1);
      });
      formulas[i] = df.add(tx.Formula, { expr: expr[i], as: as[i], pulse: col });
    } else {
      if (i === 1) {
        expr[i] = vegadataflow.accessor(function (data) {
          return eval(e2);
        });
      } else {
        expr[i] = vegadataflow.accessor(function (data) {
          return eval(e3);
        });
      }
      formulas[i] = df.add(tx.Formula, { expr: expr[i], as: as[i], pulse: formulas[i - 1] });
    }
  }

  df.pulse(col, changeset().insert(data)).run();

  return col.value;
}

function sample(size, data) {
  var df = new vegadataflow.Dataflow(),
      s = df.add(tx.Sample, { size: size });

  df.pulse(s, changeset().insert(data)).run();

  return s.value;
}