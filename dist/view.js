'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; // Utilities and classes for working with Data Package Views


exports.getResourceCachedValues = getResourceCachedValues;
exports.simpleToPlotly = simpleToPlotly;
exports.handsOnTableToHandsOnTable = handsOnTableToHandsOnTable;
exports.normalizeView = normalizeView;
exports.convertReclineToSimple = convertReclineToSimple;
exports.compileData = compileData;
exports.findResourceByNameOrIndex = findResourceByNameOrIndex;
exports.compileView = compileView;
exports.allResourcesLoaded = allResourcesLoaded;
exports.vegaToVega = vegaToVega;
exports.reactVirtualizedToReactVirtualized = reactVirtualizedToReactVirtualized;
exports.normalizeDateAndTime = normalizeDateAndTime;

var _lodash = require('lodash');

var _transform = require('./transform');

var transform = _interopRequireWildcard(_transform);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function getResourceCachedValues(resource) {
  var rowsAsObjects = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var fieldNames = void 0;
  if (resource.schema) {
    fieldNames = resource.schema.fields.map(function (field) {
      return field.name;
    });
  }
  if (rowsAsObjects) {
    if (resource._values && (0, _lodash.isArray)(resource._values[0])) {
      if (!fieldNames) {
        fieldNames = resource._values[0];
      }
      return resource._values.map(function (row) {
        return (0, _lodash.zipObject)(fieldNames, row);
      });
    }
    return resource._values;
  } else {
    if (resource._values && (0, _lodash.isPlainObject)(resource._values[0])) {
      if (!fieldNames) {
        fieldNames = Object.keys(resource._values[0]);
      }
      return (0, _lodash.map)(resource._values, function (row) {
        var rowAsArray = fieldNames.map(function (field) {
          return row[field];
        });
        return rowAsArray;
      });
    }
    return resource._values;
  }
}

/**
 * Convert a view using a simple graph spec to plotly spec for rendering
 * @param {View} view descriptor with compiled in data
 * @return {Object} Plotly spec
 */
function simpleToPlotly(view) {
  var lineSpec = {
    type: 'scatter',
    mode: 'lines',
    line: {
      width: 1.5,
      shape: 'spline',
      dash: 'solid'
    }
  };
  var simpleGraphTypesToPlotly = {
    line: lineSpec,
    bar: {
      type: 'bar'
    },
    scatter: lineSpec,
    'lines-and-points': lineSpec
  };
  var rowsAsObjects = true;
  var rows = getResourceCachedValues(view.resources[0], rowsAsObjects);
  // Sort rows based on field for X axis. Only do it if length is not too long:
  if (rows.length < 1000) {
    rows = (0, _lodash.sortBy)(rows, [view.spec.group]);
  }
  var xValues = rows.map(function (row) {
    return row[view.spec.group];
  });
  // generate the plotly series
  // { 'x': ..., 'y': ..., 'type': ...}
  var data = view.spec.series.map(function (serie) {
    var out = {
      x: xValues,
      y: rows.map(function (row) {
        return row[serie];
      }),
      name: serie
    };
    Object.assign(out, simpleGraphTypesToPlotly[view.spec.type]);
    return out;
  });

  var xAxisField = view.resources[0].schema.fields.find(function (field) {
    return field.name === view.spec.group;
  });
  var dateFields = ['date', 'year', 'yearmonth'];
  var shouldBeLinear = false;
  if (xAxisField.type === 'date') {
    // If date range is less than 10 days (864000001 miliseconds), we have
    // repeating dates as Plotly tries to have at least 10 ticks by default.
    // So if the range is less than 10d, we set `tickmode` property a `linear`
    // which handles displaying date ticks correctly:
    var range = new Date(xValues[xValues.length - 1]) - new Date(xValues[0]);
    shouldBeLinear = range < 864000001;
  }
  var plotlySpec = {
    data: data,
    layout: {
      title: view.title ? view.title : '',
      height: 450,
      xaxis: {
        title: view.spec.xTitle || view.spec.group,
        tickformat: xAxisField.type === 'date' ? "%e %b %Y" : '',
        type: dateFields.includes(xAxisField.type) ? 'date' : xAxisField.type,
        tickmode: shouldBeLinear ? 'linear' : undefined,
        ticksuffix: view.spec.xSuffix || ''
      },
      yaxis: {
        title: view.spec.yTitle || (view.spec.series.length === 1 ? view.spec.series[0] : ''),
        ticksuffix: view.spec.ySuffix || ''
      },
      font: {
        family: "\"Open Sans\", verdana, arial, sans-serif",
        size: 12,
        color: "rgb(169, 169, 169)"
      },
      titlefont: {
        family: "\"Open Sans\", verdana, arial, sans-serif",
        size: 17,
        color: "rgb(76, 76, 76)"
      },
      colorway: ['#0a0a0a', '#ff8a0e', '#dadada', '#f4eb41', '#d10808', '#5bd107', '#2274A5', '#E83F6F', '#6E9887', '#3A435E', '#861388', '#9F8082']
    }
  };
  return plotlySpec;
}

/**
 * Convert a [handson]table view to HandsOnTable spec
 * @param {View} view descriptor with compiled in data
 * @return {Object} HandsOnTable spec
 */
function handsOnTableToHandsOnTable(view) {
  var headers = void 0;
  var columnsAlignment = [];
  if (view.resources[0].schema) {
    headers = view.resources[0].schema.fields.map(function (field) {
      return field.title || field.name;
    });
    view.resources[0].schema.fields.forEach(function (field) {
      if (field.type === 'number' || field.type === 'integer') {
        columnsAlignment.push({ className: 'htRight' });
      } else {
        columnsAlignment.push({ className: 'htLeft' });
      }
    });
  } else {
    if ((0, _lodash.isArray)(view.resources[0]._values[0])) {
      headers = view.resources[0]._values[0];
    } else if ((0, _lodash.isPlainObject)(view.resources[0]._values[0])) {
      headers = Object.keys(view.resources[0]._values[0]);
    }
  }
  var data = void 0;
  if (view.resources[0]._values) {
    view.resources[0]._values = getResourceCachedValues(view.resources[0]);
    data = normalizeDateAndTime(view.resources[0])._values;
  } else {
    data = getResourceCachedValues(view.resources[0]);
  }

  return {
    data: data,
    colHeaders: headers,
    readOnly: true,
    colWidths: 47,
    rowWidth: 27,
    stretchH: 'all',
    columnSorting: true,
    search: true,
    manualColumnResize: true,
    viewTitle: view.title,
    columns: !!columnsAlignment.length ? columnsAlignment : undefined,
    headerTooltips: true,
    manualColumnMove: true,
    rowcount: data ? data.length : 0,
    totalrowcount: view.resources[0].totalrowcount
  };
}

/**
 * Ensure view spec is in "normal" form - i.e. has all the standard fields (esp
 * the resources attribute)
 * @param {View} viewSpec (note: Changes the viewSpec in place)
 */
function normalizeView(viewSpec) {
  if (!viewSpec.resources) {
    viewSpec.resources = [0];
  }
}

/**
 * convert old Recline "view" to DP View with simple graph spec
 * @param {View} reclineViewSpec
 */
function convertReclineToSimple(reclineViewSpec) {
  var graphTypeConvert = {
    lines: 'line'
    // TODO: support multiple series
  };var out = {
    name: reclineViewSpec.id.toLowerCase(),
    specType: 'simple',
    spec: {
      type: graphTypeConvert[reclineViewSpec.state.graphType],
      group: reclineViewSpec.state.group,
      series: reclineViewSpec.state.series
    }
  };
  return out;
}

/**
 * compile together resources needed for this view based on its data source spec
 * @param {View} view descriptor
 * @param {dataPackage} parent data package - used for resolving the resources
 * @return {Array} An array of resources with their data inlined
 */
function compileData(view, dataPackage) {
  var out = view.resources.map(function (resourceId) {
    if ((typeof resourceId === 'undefined' ? 'undefined' : _typeof(resourceId)) == 'object') {
      var resource = Object.assign({}, findResourceByNameOrIndex(dataPackage, resourceId.name));
      if (resource._values) {
        var rowsAsObjects = true,
            prepForTransform = getResourceCachedValues(resource, rowsAsObjects);
        resourceId.transform.forEach(function (transformObj) {
          switch (transformObj.type) {
            case "aggregate":
              resource._values = transform.aggregate(transformObj.fields, transformObj.operations, prepForTransform);
              break;
            case "filter":
              resource._values = transform.filterByExpr(transformObj.expression, prepForTransform);
              break;
            case "formula":
              resource._values = transform.applyFormula(transformObj.expressions, transformObj.asFields, prepForTransform);
              break;
            case "sample":
              resource._values = transform.sample(transformObj.size, prepForTransform);
              break;
          }
          prepForTransform = resource._values;
        });
      }
      return resource;
    } else {
      var _resource = Object.assign({}, findResourceByNameOrIndex(dataPackage, resourceId));
      return _resource;
    }
  });
  return out;
}

function findResourceByNameOrIndex(dp, nameOrIndex) {
  if (typeof nameOrIndex == 'number') {
    return dp.resources[nameOrIndex];
  } else {
    return (0, _lodash.find)(dp.resources, function (resource) {
      return resource.name == nameOrIndex;
    });
  }
}

/**
 * Prepare a view for conversion to a renderable spec (normalize it and compile in data)
 * Params as for compileData
 * @return {Object} "compiled" view - normalized and with data inline
 */
function compileView(inView, dataPackage) {
  var view = Object.assign({}, inView);
  normalizeView(view);
  var compiledData = compileData(view, dataPackage);
  view.resources = compiledData;
  return view;
}

/**
 * Check if all resources for the view are loaded - vega specific
 * @param {viewResources} Array of resources
 * @return {Boolean} true if all resources have _values, otherwise false
 */
function allResourcesLoaded(viewResources) {
  var length = 0;
  viewResources.forEach(function (resource) {
    if (resource._values) {
      length += 1;
    }
  });
  if (length === viewResources.length) {
    return true;
  }
}

/**
 * Prepare Vega spec
 * @param {view} compiled view descriptor
 * @return {Object} vegaSpec - full spec with data values
 */
function vegaToVega(view) {
  var vegaSpec = Object.assign({}, view.spec);
  var loaded = allResourcesLoaded(view.resources);
  if (loaded) {
    if (!vegaSpec.data) {
      vegaSpec.data = view.resources.map(function (resource) {
        return { "name": resource.name };
      });
    }

    vegaSpec.data.forEach(function (dataItem) {
      if (!dataItem.source && !dataItem.values) {
        try {
          var resource = findResourceByNameOrIndex(view, dataItem.name);
          var rowsAsObjects = !(resource.format === "topojson" || resource.format === "geojson");
          dataItem.values = getResourceCachedValues(resource, rowsAsObjects);
        } catch (err) {
          console.log(err);
          console.log('> problem caused by ' + dataItem.name);
        }
      }
      // As csv files are compiled into dataItem in json, vega shouldn't parse it as csv:
      if (dataItem.format && dataItem.format.type === 'csv') {
        delete dataItem.format.type;
      }
    });

    return vegaSpec;
  }
}

function reactVirtualizedToReactVirtualized(view) {
  var headers = view.resources[0].schema.fields.map(function (field) {
    return field.name;
  }),
      rowsAsObjects = true,
      data = view.resources[0]._values ? getResourceCachedValues(view.resources[0], rowsAsObjects) : undefined,
      headerHeight = 20,
      rowHeight = 30,
      rowCount = data ? data.length : 0,
      height = rowCount * rowHeight + headerHeight > 432 ? 432 : rowCount * rowHeight + headerHeight,
      width = 1136,
      columnWidth = width / headers.length;

  return {
    data: data,
    headers: headers,
    width: width,
    height: height,
    headerHeight: headerHeight,
    rowHeight: rowHeight,
    rowCount: rowCount,
    columnWidth: columnWidth
  };
}

/**
  * Ensure dates and times in resources are in ISO format.
  * Also stringify object and array types if they come as JS objects.
  * @param {resource}
  * @return {resource} with formatted dates and times
  */
function normalizeDateAndTime(resource) {
  if (!resource.schema) {
    return resource;
  }
  if (resource._values) {
    var dateFields = [],
        timeFields = [],
        dateTimeFields = [],
        objectAndArrayFields = [];

    resource.schema.fields.forEach(function (field, idx) {
      if (field.type === 'date') {
        dateFields.push(idx);
      } else if (field.type === 'time') {
        timeFields.push(idx);
      } else if (field.type === 'datetime') {
        dateTimeFields.push(idx);
      } else if (field.type === 'object' || field.type === 'array') {
        objectAndArrayFields.push(idx);
      }
    });

    resource._values.forEach(function (entry) {
      dateFields.forEach(function (fieldIdx) {
        if (entry[fieldIdx]) {
          var date = entry[fieldIdx].toString();
          date = new Date(date.substring(0, 28));
          entry[fieldIdx] = date.toISOString().substring(0, 10);
        }
      });
      timeFields.forEach(function (timeField) {
        if (entry[timeField] && entry[timeField] instanceof Date) {
          var time = entry[timeField].toTimeString();
          entry[timeField] = time.substring(0, 8);
        }
      });
      dateTimeFields.forEach(function (dateTimeField) {
        if (entry[dateTimeField] && entry[dateTimeField] instanceof Date) {
          var difference = entry[dateTimeField].getTimezoneOffset();
          entry[dateTimeField].setMinutes(entry[dateTimeField].getMinutes() - difference);
          entry[dateTimeField] = entry[dateTimeField].toISOString().split('.')[0] + 'Z';
        }
      });
      objectAndArrayFields.forEach(function (field) {
        if ((0, _lodash.isObject)(entry[field])) {
          entry[field] = JSON.stringify(entry[field]);
        }
      });
    });
  }
  return resource;
}