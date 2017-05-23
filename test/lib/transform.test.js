import * as transform from '../../lib/transform'

let data = [
 {
   "a": 10,
   "b": 20,
   "c": 30,
   "d": 40
 },
 {
   "a": 20,
   "b": 30,
   "c": 30,
   "d": 20
 },
 {
   "a": 30,
   "b": 20,
   "c": 10,
   "d": 40
 },
 {
   "a": 40,
   "b": 20,
   "c": 30,
   "d": 10
 },
 {
   "a": 10,
   "b": 20,
   "c": 30,
   "d": 40
 }
]


describe('transform functions', () => {
  it('can aggregate data', () => {
    const operations = ['count', 'sum', 'min', 'max']
    const fields = ['a', 'b', 'c', 'd']
    const aggregatedData = transform.aggregate(fields, operations, data)
    expect(aggregatedData[0].count_a).toEqual(5)
    expect(aggregatedData[0].sum_b).toEqual(110)
    expect(aggregatedData[0].min_c).toEqual(10)
    expect(aggregatedData[0].max_d).toEqual(40)
  })

  it('can filter data', () => {
    const expression = 'data["a"] > 19'
    const filteredData = transform.filterByExpr(expression, data)
    expect(filteredData.length).toEqual(3)
    expect(filteredData[0]["a"]).toEqual(20)
  })

  it('can map data (or apply formula)', () => {
    const expressions = ['data.a * 10', 'data.c / 10', 'data.d + 10']
    const as = ['e', 'f', 'g']
    const mappedData = transform.applyFormula(expressions, as, data)
    expect(mappedData[0]['e']).toEqual(data[0]['a'] * 10)
    expect(mappedData[0]['f']).toEqual(data[0]['c'] / 10)
    expect(mappedData[0]['g']).toEqual(data[0]['d'] + 10)
  })

  it('can sample data', () => {
    const size = 2
    const sampleData = transform.sample(size, data)
    expect(sampleData.length).toEqual(2)
  })
})
