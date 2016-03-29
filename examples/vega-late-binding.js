var fs = require('fs')
  , vega = require('vega')
  ;

var data =  [
    {
      "name": "table"
    }
  ];

var data1 =  [
    {
      "name": "table",
      "values": [
        {"x": 1,  "y": 28}, {"x": 2,  "y": 55},
        {"x": 3,  "y": 43}, {"x": 4,  "y": 91},
        {"x": 5,  "y": 81}, {"x": 6,  "y": 53}
      ]
    }
  ];

var spec = {
  "width": 400,
  "height": 200,
  "padding": {"top": 10, "left": 30, "bottom": 30, "right": 10},
  "data": data,
  "scales": [
    {
      "name": "x",
      "type": "ordinal",
      "range": "width",
      "domain": {"data": "table", "field": "x"}
    },
    {
      "name": "y",
      "type": "linear",
      "range": "height",
      "domain": {"data": "table", "field": "y"},
      "nice": true
    }
  ],
  "axes": [
    {"type": "x", "scale": "x"},
    {"type": "y", "scale": "y"}
  ],
  "marks": [
    {
      "type": "rect",
      "from": {"data": "table"},
      "properties": {
        "enter": {
          "x": {"scale": "x", "field": "x"},
          "width": {"scale": "x", "band": true, "offset": -1},
          "y": {"scale": "y", "field": "y"},
          "y2": {"scale": "y", "value": 0}
        },
        "update": {
          "fill": {"value": "steelblue"}
        },
        "hover": {
          "fill": {"value": "red"}
        }
      }
    }
  ]
};

vega.parse.spec(spec, function(chart) {
  // var view = chart({ renderer: "canvas", data: data1 })
  var view = chart({ renderer: "canvas" })
    .update();
  view.data('table').insert(data1[0].values);
  view.update();

  // do something with the node-canvas instance...
  var canvas = view.canvas();
  var stream = canvas.createPNGStream();
  var out = process.stdout;
  stream.pipe(out);
});

