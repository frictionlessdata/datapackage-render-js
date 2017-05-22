import * as transform from '../../lib/transform'

var data = [
 {
   "a": 17.76,
   "b": 20.14,
   "c": 17.05,
   "d": 17.79
 },
 {
   "a": 19.19,
   "b": 21.29,
   "c": 19.19,
   "d": 19.92
 },
 {
   "a": 20.33,
   "b": 22.9,
   "c": 19.52,
   "d": 21.12
 },
 {
   "a": 20.15,
   "b": 20.72,
   "c": 19.04,
   "d": 19.31
 },
 {
   "a": 17.93,
   "b": 18.09,
   "c": 16.99,
   "d": 17.01
 }
]


describe('transform functions', () => {
  it('can aggregate data', () => {
    const operations = ['count', 'sum', 'min', 'max']
    const fields = ['a', 'b', 'c', 'd']
    const aggregatedData = transform.aggregate(fields, operations, data)
    expect(aggregatedData[0].count_a).toEqual(5)
    expect(aggregatedData[0].sum_b).toEqual(103.14)
    expect(aggregatedData[0].min_c).toEqual(16.99)
    expect(aggregatedData[0].max_d).toEqual(21.12)
  })

  it('can filter data', () => {
    const expression = 'data["a"] > 19'
    const filteredData = transform.filterByExpr(expression, data)
    expect(filteredData.length).toEqual(3)
    expect(filteredData[0]["a"]).toEqual(19.19)
  })

  it('can map data (or apply formula)', () => {
    const expressions = ['data.a * 10', 'data.c / 10', 'data.d + 10']
    const as = ['e', 'f', 'g']
    const mappedData = transform.applyFormula(expressions, as, data)
    expect(mappedData[0]).toEqual(data[0])
  })

  it('can sample data', () => {
    const size = 2
    const sampleData = transform.sample(size, data)
    expect(sampleData.length).toEqual(2)
  })
})
