const vegadataflow = require('../vendor/vega-dataflow.js');


var tx = vegadataflow.transforms,
    changeset = vegadataflow.changeset;


export function aggregate(fields, operations, data) {
  var fieldsForAggregation = []
  fields.forEach(field => {
    fieldsForAggregation.push(vegadataflow.field(field))
  })

  var df = new vegadataflow.Dataflow(),
      col = df.add(tx.Collect),
      agg = df.add(tx.Aggregate, {
              fields: fieldsForAggregation,
              ops: operations,
              pulse: col
            }),
      out = df.add(tx.Collect, {pulse: agg});

  df.pulse(col, changeset().insert(data)).run();

  return out.value
}


export function filterByExpr(expression, data) {
  var expr = vegadataflow.accessor(data => { return eval(expression) })

  var df = new vegadataflow.Dataflow(),
    ex = df.add(null),
    col = df.add(tx.Collect),
    fil = df.add(tx.Filter, {expr: ex, pulse: col}),
    out = df.add(tx.Collect, {pulse: fil});

  df.pulse(col, changeset().insert(data));
  df.update(ex, expr).run();

  return out.value
}


export function applyFormula(expressions, as, data) {
  var expr = [],
      formulas = []

  var [e1, e2, e3] = expressions

  var df = new vegadataflow.Dataflow(),
      col = df.add(tx.Collect)

  for(var i=0; i < as.length; i++){
    if(i === 0) {
      expr[i] = vegadataflow.accessor(d => { return eval(e1) })
      formulas[i] = df.add(tx.Formula, {expr: expr[i], as: as[i], pulse: col})
    } else {
      if(i === 1) {
        expr[i] = vegadataflow.accessor(d => { return eval(e2) })
      } else {
        expr[i] = vegadataflow.accessor(d => { return eval(e3) })
      }
      formulas[i] = df.add(tx.Formula, {expr: expr[i], as: as[i], pulse: formulas[i-1]})
    }
  }

  df.pulse(col, changeset().insert(data)).run()

  return col.value
}


export function sample(size, data) {
  var df = new vegadataflow.Dataflow(),
      s = df.add(tx.Sample, {size: size});

  df.pulse(s, changeset().insert(data)).run();

  return s.value
}
