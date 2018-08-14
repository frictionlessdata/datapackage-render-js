// Utilities and classes for working with Data Package Views
import { indexOf, find, zipObject, map, isPlainObject, isArray, sortBy, isObject } from 'lodash'
import * as transform from './transform'

export function getResourceCachedValues(resource, rowsAsObjects=false) {
  if (rowsAsObjects) {
    if (resource._values && isArray(resource._values[0])) {
      let fieldNames = resource.schema.fields.map(field => {
        return field.name
      })
      return resource._values.map(row => {
        return zipObject(fieldNames, row)
      })
    }
    return resource._values
  } else {
    if (resource._values && isPlainObject(resource._values[0])) {
      let fieldNames = resource.schema.fields.map(field => {
        return field.name
      })

      return map(resource._values, (row) => {
         let rowAsArray = fieldNames.map(field => row[field])
         return rowAsArray
      })
    }
    return resource._values
  }
}


/**
 * Convert a view using a simple graph spec to plotly spec for rendering
 * @param {View} view descriptor with compiled in data
 * @return {Object} Plotly spec
 */
export function simpleToPlotly(view) {
  const lineSpec = {
    type: 'scatter'
    , mode: 'lines'
    , line: {
      width: 1.5
      , shape: 'spline'
      , dash:	'solid'
    }
  }
  const simpleGraphTypesToPlotly = {
    line: lineSpec
    , bar: {
      type: 'bar'
    }
    , scatter: lineSpec
    , 'lines-and-points': lineSpec
  }
  const rowsAsObjects = true
  let rows = getResourceCachedValues(view.resources[0], rowsAsObjects)
  // Sort rows based on field for X axis. Only do it if length is not too long:
  if (rows.length < 1000) {
    rows = sortBy(rows, [view.spec.group])
  }
  const xValues = rows.map(row => row[view.spec.group])
  // generate the plotly series
  // { 'x': ..., 'y': ..., 'type': ...}
  const data = view.spec.series.map((serie) => {
    const out = {
      x: xValues
      , y: rows.map(row => row[serie])
      , name: serie
    }
    Object.assign(out, simpleGraphTypesToPlotly[view.spec.type])
    return out
  })

  const xAxisField = view.resources[0].schema.fields.find(field => field.name === view.spec.group)
  const dateFields = ['date', 'year', 'yearmonth']
  let shouldBeLinear = false
  if (xAxisField.type === 'date') {
    // If date range is less than 10 days (864000001 miliseconds), we have
    // repeating dates as Plotly tries to have at least 10 ticks by default.
    // So if the range is less than 10d, we set `tickmode` property a `linear`
    // which handles displaying date ticks correctly:
    const range = new Date(xValues[xValues.length - 1]) - new Date(xValues[0])
    shouldBeLinear = range < 864000001
  }
  const plotlySpec = {
    data
    , layout: {
      title: view.title ? view.title : ''
      , height: 450
      , xaxis: {
        title: view.spec.xTitle || view.spec.group
        , tickformat: xAxisField.type === 'date' ? "%e %b %Y" : ''
        , type: dateFields.includes(xAxisField.type) ? 'date' : xAxisField.type
        , tickmode: shouldBeLinear ? 'linear' : undefined
        , ticksuffix: view.spec.xSuffix || ''
      }
      , yaxis: {
        title: view.spec.yTitle || (view.spec.series.length === 1 ? view.spec.series[0] : '')
        , ticksuffix: view.spec.ySuffix || ''
      }
      , font: {
        family: "\"Open Sans\", verdana, arial, sans-serif"
        , size: 12
        , color: "rgb(169, 169, 169)"
      }
      , titlefont: {
        family:	"\"Open Sans\", verdana, arial, sans-serif"
        , size:	17
        , color: "rgb(76, 76, 76)"
      }
      , colorway: ['#0a0a0a', '#ff8a0e', '#dadada', '#f4eb41', '#d10808', '#5bd107']
    }
  }
  return plotlySpec
}


/**
 * Convert a [handson]table view to HandsOnTable spec
 * @param {View} view descriptor with compiled in data
 * @return {Object} HandsOnTable spec
 */
export function handsOnTableToHandsOnTable(view) {
  const headers = view.resources[0].schema.fields.map(field => field.name)
  const columnsAlignment = []
  view.resources[0].schema.fields.forEach(field => {
    if (field.type === 'number' || field.type === 'integer') {
      columnsAlignment.push({className: 'htRight'})
    } else {
      columnsAlignment.push({className: 'htLeft'})
    }
  })
  let data
  if(view.resources[0]._values) {
    view.resources[0]._values = getResourceCachedValues(view.resources[0])
    data = normalizeDateAndTime(view.resources[0])._values
  } else {
    data = getResourceCachedValues(view.resources[0])
  }

  return {
    data
    , colHeaders: headers
    , readOnly: true
    , colWidths: 47
    , rowWidth: 27
    , stretchH: 'all'
    , columnSorting: true
    , search: true
    , manualColumnResize: true
    , viewTitle: view.title
    , columns: columnsAlignment
  }
}

/**
 * Ensure view spec is in "normal" form - i.e. has all the standard fields (esp
 * the resources attribute)
 * @param {View} viewSpec (note: Changes the viewSpec in place)
 */
export function normalizeView(viewSpec) {
  if (!viewSpec.resources) {
    viewSpec.resources = [0]
  }
}

/**
 * convert old Recline "view" to DP View with simple graph spec
 * @param {View} reclineViewSpec
 */
export function convertReclineToSimple(reclineViewSpec) {
  const graphTypeConvert = {
    lines: 'line'
  }
  // TODO: support multiple series
  const out = {
    name: reclineViewSpec.id.toLowerCase()
    , specType: 'simple'
    , spec: {
      type: graphTypeConvert[reclineViewSpec.state.graphType]
        , group: reclineViewSpec.state.group
        , series: reclineViewSpec.state.series
    }
  }
  return out
}

/**
 * compile together resources needed for this view based on its data source spec
 * @param {View} view descriptor
 * @param {dataPackage} parent data package - used for resolving the resources
 * @return {Array} An array of resources with their data inlined
 */
export function compileData(view, dataPackage) {
  const out = view.resources.map((resourceId) => {
    if(typeof (resourceId) == 'object') {
      const resource = Object.assign({}, findResourceByNameOrIndex(dataPackage, resourceId.name))
      if(resource._values) {
        let rowsAsObjects = true,
            prepForTransform = getResourceCachedValues(resource, rowsAsObjects)
        resourceId.transform.forEach(transformObj => {
          switch(transformObj.type) {
            case "aggregate":
              resource._values = transform.aggregate(transformObj.fields, transformObj.operations, prepForTransform)
              break
            case "filter":
              resource._values = transform.filterByExpr(transformObj.expression, prepForTransform)
              break
            case "formula":
              resource._values = transform.applyFormula(transformObj.expressions, transformObj.asFields, prepForTransform)
              break
            case "sample":
              resource._values = transform.sample(transformObj.size, prepForTransform)
              break
          }
          prepForTransform = resource._values
        })
      }
      return resource
    } else {
      const resource = Object.assign({}, findResourceByNameOrIndex(dataPackage, resourceId))
      return resource
    }
  })
  return out
}

export function findResourceByNameOrIndex(dp, nameOrIndex) {
  if (typeof (nameOrIndex) == 'number') {
    return dp.resources[nameOrIndex]
  } else {
    return find(dp.resources, resource => (resource.name == nameOrIndex))
  }
}


/**
 * Prepare a view for conversion to a renderable spec (normalize it and compile in data)
 * Params as for compileData
 * @return {Object} "compiled" view - normalized and with data inline
 */
export function compileView(inView, dataPackage) {
  const view = Object.assign({}, inView)
  normalizeView(view)
  const compiledData = compileData(view, dataPackage)
  view.resources = compiledData
  return view
}

/**
 * Check if all resources for the view are loaded - vega specific
 * @param {viewResources} Array of resources
 * @return {Boolean} true if all resources have _values, otherwise false
 */
export function allResourcesLoaded(viewResources) {
  let length = 0
  viewResources.forEach(resource => {
    if(resource._values) {
      length += 1
    }
  })
  if (length === viewResources.length) {
    return true
  }
}

/**
 * Prepare Vega spec
 * @param {view} compiled view descriptor
 * @return {Object} vegaSpec - full spec with data values
 */
export function vegaToVega(view) {
  let vegaSpec = Object.assign({}, view.spec)
  let loaded = allResourcesLoaded(view.resources)
  if(loaded) {
    if(!vegaSpec.data) {
      vegaSpec.data = view.resources.map(resource => {
        return {"name": resource.name}
      })
    }

    vegaSpec.data.forEach(dataItem => {
      if(!dataItem.source && !dataItem.values) {
        try {
          let resource = findResourceByNameOrIndex(view, dataItem.name)
          let rowsAsObjects = !(resource.format === "topojson" || resource.format === "geojson")
          dataItem.values = getResourceCachedValues(resource, rowsAsObjects)
        } catch (err) {
          console.log(err)
          console.log(`> problem caused by ${dataItem.name}`)
        }
      }
      // As csv files are compiled into dataItem in json, vega shouldn't parse it as csv:
      if (dataItem.format && dataItem.format.type === 'csv') {
        delete dataItem.format.type
      }
    })

    return vegaSpec
  }
}

export function reactVirtualizedToReactVirtualized(view) {
  const headers = view.resources[0].schema.fields.map(field => field.name)
    , rowsAsObjects = true
    , data = view.resources[0]._values
      ? getResourceCachedValues(view.resources[0], rowsAsObjects)
      : undefined
    , headerHeight = 20
    , rowHeight = 30
    , rowCount = data ? data.length : 0
    , height = (rowCount * rowHeight + headerHeight) > 432
      ? 432
      : (rowCount * rowHeight + headerHeight)
    , width = 1136
    , columnWidth = width / headers.length

  return {
    data
    , headers
    , width
    , height
    , headerHeight
    , rowHeight
    , rowCount
    , columnWidth
  }
}

/**
  * Ensure dates and times in resources are in ISO format.
  * Also stringify object and array types if they come as JS objects.
  * @param {resource}
  * @return {resource} with formatted dates and times
  */
export function normalizeDateAndTime(resource) {
  if(resource._values) {
    let dateFields = []
        , timeFields = []
        , dateTimeFields = []
        , objectAndArrayFields = []

    resource.schema.fields.forEach((field, idx) => {
      if(field.type === 'date') {
        dateFields.push(idx)
      } else if (field.type === 'time') {
        timeFields.push(idx)
      } else if (field.type === 'datetime') {
        dateTimeFields.push(idx)
      } else if (field.type === 'object' || field.type === 'array') {
        objectAndArrayFields.push(idx)
      }
    })

    resource._values.forEach((entry) => {
      dateFields.forEach(fieldIdx => {
        if (entry[fieldIdx]) {
          let date = entry[fieldIdx].toString()
          date = new Date(date.substring(0, 28))
          entry[fieldIdx] = date.toISOString().substring(0, 10)
        }
      })
      timeFields.forEach(timeField => {
        if (entry[timeField] && entry[timeField] instanceof Date) {
          let time = entry[timeField].toTimeString()
          entry[timeField] = time.substring(0,8)
        }
      })
      dateTimeFields.forEach(dateTimeField => {
        if (entry[dateTimeField] && entry[dateTimeField] instanceof Date) {
          const difference = entry[dateTimeField].getTimezoneOffset()
          entry[dateTimeField].setMinutes(entry[dateTimeField].getMinutes() - difference)
          entry[dateTimeField] = entry[dateTimeField].toISOString().split('.')[0] + 'Z'
        }
      })
      objectAndArrayFields.forEach(field => {
        if (isObject(entry[field])) {
          entry[field] = JSON.stringify(entry[field])
        }
      })
    })

  }
  return resource
}
