// Utilities and classes for working with Data Package Views
import { indexOf, find, zipObject, map } from 'lodash'
import * as transform from './transform'

export function getResourceCachedValues(resource, rowsAsObjects=false) {
  if (rowsAsObjects) {
    let fieldNames = resource.schema.fields.map(field => {
      return field.name
    })
    return resource._values.map(row => {
      return zipObject(fieldNames, row)
    })
  } else {
    if (resource._values && resource._values[0].constructor === Object) {
      let fieldNames = resource.schema.fields.map(field => {
        return field.name
      })

      return map(resource._values, (row) => {
         let rowAsArray = fieldNames.map(field => row[field])
         return rowAsArray
      })
    }
    return resource._values;
  }
}


/**
 * Convert a view using a simple graph spec to plotly spec for rendering
 * @param {View} view descriptor with compiled in data
 * @return {Object} Plotly spec
 */
export function simpleToPlotly(view) {
  const simpleGraphTypesToPlotly = {
    line: {
      type: 'scatter'
      , mode: 'lines'
      , line: {
        width: 2
        , shape: 'spline'
      }
    }
    , bar: {
      type: 'bar'
    }
    , scatter: {
      type: 'scatter'
    }
  }
  const rowsAsObjects = true
  const rows = getResourceCachedValues(view.resources[0], rowsAsObjects)
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

  const plotlySpec = {
    data
    , layout: {
      title: view.title ? view.title : ''
      , height: 450
      , xaxis: {
        title: view.spec.group
      }
    }
  }
  if(view.spec.series.length === 1) {
    plotlySpec.layout.yaxis = {
      title: view.spec.series[0]
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
        let resource = findResourceByNameOrIndex(view, dataItem.name)
        let rowsAsObjects = !(resource.format === "topojson" || resource.format === "geojson")
        dataItem.values = getResourceCachedValues(resource, rowsAsObjects)
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
  * @param {resource}
  * @return {resource} with formatted dates and times
  */
export function normalizeDateAndTime(resource) {
  if(resource._values) {
    let dateFields = []
        , timeFields = []
        , dateTimeFields = []

    resource.schema.fields.forEach((field, idx) => {
      if(field.type === 'date') {
        dateFields.push(idx)
      } else if (field.type === 'time') {
        timeFields.push(idx)
      } else if (field.type === 'datetime') {
        dateTimeFields.push(idx)
      }
    })

    resource._values.forEach((entry) => {
      dateFields.forEach(fieldIdx => {
        let date = entry[fieldIdx].toString()
        date = new Date(date.substring(0, 28))
        entry[fieldIdx] = date.toISOString().substring(0, 10)
      })
      timeFields.forEach(timeField => {
        let time = entry[timeField].toISOString()
        entry[timeField] = time.substring(11,19)
      })
      dateTimeFields.forEach(dateTimeField => {
        entry[dateTimeField] = entry[dateTimeField].toISOString()
      })
    })

  }
  return resource
}
