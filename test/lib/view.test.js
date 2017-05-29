import * as utils from '../../lib/view'

const mockTable1 = [
  ['2014-01-01', 14.32, 14.59]
  , ['2014-01-02', 14.06, 14.22]
  , ['2014-01-05', 13.41, 14.00]
]

const mockDescriptor = {
  name: 'demo-package'
  , resources: [
    {
      name: 'demo-resource'
      , path: 'data/demo-resource.csv'
      , format: 'csv'
      , mediatype: 'text/csv'
      , _values: mockTable1
      , schema: {
        fields: [
          {
            name: 'Date'
            , type: 'date'
            , description: ''
          }
          , {
            name: 'Open'
            , type: 'number'
            , description: ''
          }
          , {
            name: 'High'
            , type: 'number'
            , description: ''
          }
        ]
        , primaryKey: 'Date'
      }
    }
  ]
  , views: []
}

const mockDescriptorWithoutData =  {
  name: 'demo-package'
  , resources: [
    {
      name: 'demo-resource'
      , path: 'data/demo-resource.csv'
      , format: 'csv'
      , mediatype: 'text/csv'
      , schema: {
        fields: [
          {
            name: 'Date'
            , type: 'date'
            , description: ''
          }
          , {
            name: 'Open'
            , type: 'number'
            , description: ''
          }
          , {
            name: 'High'
            , type: 'number'
            , description: ''
          }
        ]
        , primaryKey: 'Date'
      }
    }
  ]
  , views: []
}

const mockViews = {
  recline: {
    id: 'Graph'
    , type: 'Graph'
    , state: {
      graphType: 'lines'
      , group: 'Date'
      , series: ['High']
    }
  }
  , simple: {
    name: 'graph'
    , title: 'title1'
    , specType: 'simple'
    , spec: {
      type: 'line'
      , group: 'Date'
      , series: ['High']
    }
  }
  , simple2: {
    name: 'graph'
    , title: 'title2'
    , specType: 'simple'
    , spec: {
      type: 'line'
      , group: 'Date'
      , series: ['High', 'Open']
    }
  }
  , simpleBar: {
    name: 'graph'
    , title: 'titleBar'
    , specType: 'simple'
    , spec: {
      type: 'bar'
      , group: 'Date'
      , series: ['High']
    }
  }
  , vegaNoDataProperty1: {
    name: 'vega1'
    , resources: [0]
    , specType: 'vega'
    , spec: {
      scale: [],
      axes: []
    }
  }
  , vegaNoDataProperty2: {
    name: 'vega2'
    , specType: 'vega'
    , spec: {
      scale: [],
      axes: []
    }
  }
  , vegaWithDataProperty1: {
    name: 'vega3'
    , specType: 'vega'
    , spec: {
      data: [
        {
          name: 'demo-resource'
          , transform: [{type: 'test'}]
        },
        {
          name: 'internal-sourcing'
          , source: 'demo-resource'
          , transform: [{type: 'filter'}]
        }
      ]
    }
  }
  , vegaWithDataProperty2: {
    name: 'vega4'
    , resources: [0]
    , specType: 'vega'
    , spec: {
      data: [
        {
          name: 'data1'
          , values: [{x:1,y:0}, {x:2,y:5}]
        }
        , {
          name: 'demo-resource'
        }
      ]
    }
  }
}

const vegaExpected = {
  vegaNoDataProperty: {
    data: [
      {
        name: 'demo-resource'
        , values: [
          {'Date': '2014-01-01', 'Open': 14.32, 'High': 14.59}
          , {'Date': '2014-01-02', 'Open': 14.06, 'High': 14.22}
          , {'Date': '2014-01-05', 'Open': 13.41, 'High': 14.00}
        ]
      }
    ]
    , scale: []
    , axes: []
  }
  , vegaWithDataProperty1: {
    data: [
      {
        name: 'demo-resource'
        , values: [
          {'Date': '2014-01-01', 'Open': 14.32, 'High': 14.59}
          , {'Date': '2014-01-02', 'Open': 14.06, 'High': 14.22}
          , {'Date': '2014-01-05', 'Open': 13.41, 'High': 14.00}
        ]
        , transform: [{type: 'test'}]
      }
      , {
        name: 'internal-sourcing'
        , source: 'demo-resource'
        , transform: [{type: 'filter'}]
      }
    ]
  }
  , vegaWithDataProperty2: {
    data: [
      {
        name: 'data1'
        , values: [{x:1,y:0}, {x:2,y:5}]
      }
      , {
        name: 'demo-resource'
        , values: [
          {'Date': '2014-01-01', 'Open': 14.32, 'High': 14.59}
          , {'Date': '2014-01-02', 'Open': 14.06, 'High': 14.22}
          , {'Date': '2014-01-05', 'Open': 13.41, 'High': 14.00}
        ]
      }
    ]
  }
}

const plotlyExpected = {
  simple: {
    data: [
      {
        x: [
          '2014-01-01'
          , '2014-01-02'
          , '2014-01-05'
        ]
        , y: [
          14.59
          , 14.22
          , 14
        ]
        , type: 'scatter'
        , mode: 'lines'
        , line: { width: 2, shape: 'spline' }
        , name: 'High'
      }
    ]
    , layout: {
      title: mockViews.simple.title
      , height: 450
      , xaxis: {
        title: 'Date'
      }
      , yaxis: {
        title: 'High'
      }
    }
  }
  , simple2: {
    data: [
      {
        x: [
          '2014-01-01'
          , '2014-01-02'
          , '2014-01-05'
        ]
        , y: [
          14.59
          , 14.22
          , 14
        ]
        , name: 'High'
        , type: 'scatter'
        , mode: 'lines'
        , line: {
          width: 2
          , shape: 'spline'
        }
      }
      , {
        x: [
          '2014-01-01'
          , '2014-01-02'
          , '2014-01-05'
        ]
        , y: [
          14.32
  , 14.06
  , 13.41
        ]
        , name: 'Open'
        , type: 'scatter'
        , mode: 'lines'
        , line: {
          width: 2
  , shape: 'spline'
        }
      }
    ]
    , layout: {
      title: mockViews.simple2.title
      , height: 450
      , xaxis: {
        title: 'Date'
      }
    }
  }
  , simpleBar: {
    data: [
      {
        x: [
          '2014-01-01'
          , '2014-01-02'
          , '2014-01-05'
        ]
        , y: [
          14.59
          , 14.22
          , 14
        ]
        , name: 'High'
        , type: 'bar'
      }
    ]
    , layout: {
      title: mockViews.simpleBar.title
      , height: 450
      , xaxis: {
        title: 'Date'
      }
      , yaxis: {
        title: 'High'
      }
    }
  }
}


describe('Data Package View utils', () => {
  it('should generate Plotly spec - lines', () => {
    const view = utils.compileView(mockViews.simple, mockDescriptor)
    const plotlySpec = utils.simpleToPlotly(view)
    expect(plotlySpec).toEqual(plotlyExpected.simple)
  })
  it('should generate Plotly spec - 2 lines', () => {
    const view = utils.compileView(mockViews.simple2, mockDescriptor)
    const plotlySpec = utils.simpleToPlotly(view)
    expect(plotlySpec).toEqual(plotlyExpected.simple2)
  })
  it('should generate Plotly spec - bar', () => {
    const view = utils.compileView(mockViews.simpleBar, mockDescriptor)
    const plotlySpec = utils.simpleToPlotly(view)
    expect(plotlySpec).toEqual(plotlyExpected.simpleBar)
  })
})


describe('Data Package View utils - HandsOnTable ', () => {
  it('should generate handsontable -> handsontable', () => {
    const view = {
      name: 'table-resource1'
      , resources: ['demo-resource']
      , specType: 'handsontable'
    }
    const viewCompiled = utils.compileView(view, mockDescriptor)
    const outSpec = utils.handsOnTableToHandsOnTable(viewCompiled)
    const expected = {
      data: [
        [
          '2014-01-01'
          , 14.32
          , 14.59
        ]
        , [
          '2014-01-02'
          , 14.06
          , 14.22
        ]
        , [
          '2014-01-05'
          , 13.41
          , 14
        ]
      ]
      , colHeaders: [
        'Date'
        , 'Open'
        , 'High'
      ]
      , readOnly: true
      , colWidths: 47
      , rowWidth: 27
      , stretchH: 'all'
      , columnSorting: true
      , search: true
      , manualColumnResize: true
    }
    // console.log(JSON.stringify(outSpec, null, 2));
    expect(outSpec).toEqual(expected)
  })

  it('should generate handsontable without data', () => {
    const view = {
      name: 'table-resource1'
      , resources: ['demo-resource']
      , specType: 'handsontable'
    }
    const viewCompiled = utils.compileView(view, mockDescriptorWithoutData)
    const outSpec = utils.handsOnTableToHandsOnTable(viewCompiled)
    const expected = {
      data: undefined
      , colHeaders: [
        'Date'
        , 'Open'
        , 'High'
      ]
      , readOnly: true
      , colWidths: 47
      , rowWidth: 27
      , stretchH: 'all'
      , columnSorting: true
      , search: true
      , manualColumnResize: true
    }
    expect(outSpec).toEqual(expected)
  })
})


describe('Basic view utility functions', () => {
  it('normalizeView - add dataSource', () => {
    const inView = {
      name: 'graph-1'
      , spec: {
      }
    }
    utils.normalizeView(inView)
    const expected = {
      name: 'graph-1'
      , resources: [0]
      , spec: {}
    }
    expect(inView).toEqual(expected)
  })

  it('convertReclineToSimple', () => {
    const out = utils.convertReclineToSimple(mockViews.recline)
    const expected = {
      name: 'graph'
      , specType: 'simple'
      , spec: {
        type: 'line'
        , group: 'Date'
        , series: ['High']
      }
    }
    expect(out).toEqual(expected)
  })

  it('getResourceCachedValues works', () => {
    let rowsAsObjects = false
    let out = utils.getResourceCachedValues(mockDescriptor.resources[0], rowsAsObjects)
    expect(out).toEqual(mockTable1)

    rowsAsObjects = true
    out = utils.getResourceCachedValues(mockDescriptor.resources[0], rowsAsObjects)
    let expected = [
      {"Date": "2014-01-01", "High": 14.59, "Open": 14.32},
      {"Date": "2014-01-02", "High": 14.22, "Open": 14.06},
      {"Date": "2014-01-05", "High": 14, "Open": 13.41}
    ]
    expect(out).toEqual(expected)

    let resourceWithValuesAsObjects = Object.assign({}, mockDescriptor.resources[0])
    resourceWithValuesAsObjects._values = expected
    rowsAsObjects = false
    out = utils.getResourceCachedValues(resourceWithValuesAsObjects, rowsAsObjects)
    expect(out).toEqual(mockTable1)
  })

  it('compileData works', () => {
    const resourceId = mockDescriptor.resources[0].name
    let view = {
      resources: [resourceId]
    }
    const expected = [ mockDescriptor.resources[0] ]
    let out = utils.compileData(view, mockDescriptor)
    expect(out).toEqual(expected)

    // check it works with resource index as well
    view = {
      resources: [0]
    }
    out = utils.compileData(view, mockDescriptor)
    expect(out).toEqual(expected)
  })

  it('compileData work with transforms', () => {
    const resourceId = mockDescriptor.resources[0].name
    // check it works with aggregate
    let view = {
      resources: [
        {
          name: resourceId,
          transform: [
            {
              type: "aggregate",
              fields: ["Open", "High"],
              operations: ["sum", "max"]
            }
          ]
        }
      ]
    }
    let out = utils.compileData(view, mockDescriptor)
    expect(out[0]._values[0]["High"]).toEqual(14.59)
    expect(out[0]._values[0]["Open"]).toEqual(41.790000000000006)

    // check it works with filter
    view.resources[0].transform[0] = {
      type: "filter",
      expression: "data['Open'] > 14"
    }
    out = utils.compileData(view, mockDescriptor)
    expect(out[0]._values.length).toEqual(2)

    // check if works with formula
    view.resources[0].transform[0] = {
      type: "formula",
      expressions: ["data['Open'] * 10", "data['High'] - 10"],
      asFields: ["new1", "new2"]
    }
    out = utils.compileData(view, mockDescriptor)
    expect(out[0]._values[0].new1).toEqual(143.2)
    expect(out[0]._values[2].new2).toEqual(4)

    // check if works with sample
    view.resources[0].transform[0] = {
      type: "sample",
      size: 2
    }
    out = utils.compileData(view, mockDescriptor)
    expect(out[0]._values.length).toEqual(2)
  })

  it('works with more than 1 transforms', () => {
    // apply formula and then get sample
    const resourceId = mockDescriptor.resources[0].name
    let view = {
      resources: [
        {
          name: resourceId,
          transform: [
            {
              type: "formula",
              expressions: ["data['Open'] * 10", "data['High'] - 10"],
              asFields: ["new1", "new2"]
            },
            {
              type: "sample",
              size: 2
            }
          ]
        }
      ]
    }
    let out = utils.compileData(view, mockDescriptor)
    expect(out[0]._values.length).toEqual(2)
    expect(out[0]._values[0].new1).toBeTruthy // so it has new1 field

    // first filter then apply formula
    view.resources[0].transform = [
      {
        type: "filter",
        expression: "data['Open'] > 14"
      },
      {
        type: "formula",
        expressions: ["data['High'] * 10"],
        asFields: ["High"]
      }
    ]
    out = utils.compileData(view, mockDescriptor)
    expect(out[0]._values.length).toEqual(2)
    expect(out[0]._values[0]["High"]).toEqual(145.9)
  })

  it('findResourceByNameOrIndex with name', () => {
    const out = utils.findResourceByNameOrIndex(mockDescriptor, 'demo-resource')
    expect(out.name).toEqual('demo-resource')
  })

  it('findResourceByNameOrIndex with index', () => {
    const out = utils.findResourceByNameOrIndex(mockDescriptor, 0)
    expect(out.name).toEqual('demo-resource')
  })

  it('compileView works', () => {
    const out = utils.compileView(mockViews.simple, mockDescriptor)
    expect(out.resources[0].format).toEqual('csv')
    expect(out.resources[0]._values.length).toEqual(3)
  })

  it('allResourcesLoaded works', () => {
    const out = utils.allResourcesLoaded(mockDescriptorWithoutData.resources)
    expect(out).toBeFalsy()
    const out2 = utils.allResourcesLoaded(mockDescriptor.resources)
    expect(out2).toBeTruthy()
  })
})

describe('vegaToVega function', () => {
  it('should work with no data property in vega spec', () => {
    let compiledView1 = utils.compileView(mockViews.vegaNoDataProperty1, mockDescriptor)
    let compiledView2 = utils.compileView(mockViews.vegaNoDataProperty2, mockDescriptor)
    const vegaSpec1 = utils.vegaToVega(compiledView1)
    const vegaSpec2 = utils.vegaToVega(compiledView2)
    expect(vegaSpec1).toEqual(vegaExpected.vegaNoDataProperty)
    expect(vegaSpec2).toEqual(vegaExpected.vegaNoDataProperty)
  })

  it('should work with one normal and one internal sourcing dataItem', () => {
    let compiledView = utils.compileView(mockViews.vegaWithDataProperty1, mockDescriptor)
    const vegaSpec = utils.vegaToVega(compiledView)
    expect(vegaSpec).toEqual(vegaExpected.vegaWithDataProperty1)
  })

  it('should work with one inlined and one normal dataItem', () => {
    let compiledView = utils.compileView(mockViews.vegaWithDataProperty2, mockDescriptor)
    const vegaSpec = utils.vegaToVega(compiledView)
    expect(vegaSpec).toEqual(vegaExpected.vegaWithDataProperty2)
  })
})

describe('Data Package View utils - ReactVirtualized ', () => {
  it('should generate ReactVirtualized -> ReactVirtualized', () => {
    const view = {
      name: 'table-resource1'
      , resources: ['demo-resource']
      , specType: 'reactvirtualized'
    }
    const viewCompiled = utils.compileView(view, mockDescriptor)
    const outSpec = utils.reactVirtualizedToReactVirtualized(viewCompiled)
    const expected = {
      data: [
        {
          "Date": "2014-01-01",
          "High": 14.59,
          "Open": 14.32
        },
        {
          "Date": "2014-01-02",
          "High": 14.22,
          "Open": 14.06
        },
        {
          "Date": "2014-01-05",
          "High": 14,
          "Open": 13.41
        }
      ]
      , headers: [
        'Date'
        , 'Open'
        , 'High'
      ]
      , width: 1136
      , height: 30 * 3 + 20
      , headerHeight: 20
      , rowHeight: 30
      , rowCount: 3
      , "columnWidth": 378.6666666666667
    }

    expect(outSpec).toEqual(expected)
  })

  it('should generate ReactVirtualized without data', () => {
    const view = {
      name: 'table-resource1'
      , resources: ['demo-resource']
      , specType: 'reactvirtualized'
    }
    const viewCompiled = utils.compileView(view, mockDescriptorWithoutData)
    const outSpec = utils.reactVirtualizedToReactVirtualized(viewCompiled)
    const expected = {
      data: undefined
      , headers: [
        'Date'
        , 'Open'
        , 'High'
      ]
      , width: 1136
      , height: 20
      , headerHeight: 20
      , rowHeight: 30
      , rowCount: 0
      , "columnWidth": 378.6666666666667
    }

    expect(outSpec).toEqual(expected)
  })
})
