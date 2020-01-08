
const countFromDisaggregates = list => {
    if (list.length === 0) {
        return 0;
    }

    let count = 1;
    list.forEach(x => {
        count *= x.items.length
    })
    return count
}

const addLookupFactors = list => {
    const reversedList = list.slice().reverse()
    reversedList.forEach((level, idx) => { // Start at the "leaf" disaggregate
        const lastLevel = reversedList[idx - 1]
        level.lookupFactor = lastLevel ? lastLevel.count * lastLevel.lookupFactor : 1
    })
}

const listByDimension = list =>
    list.reduce((all, item) => {
        all[item.dimension] = item
        return all;
    }, {})

const buildDimensionLookup = (visualization, metadata, headers) => {
    const rows = visualization.rows.map(row => ({
        dimension: row.dimension,
        count: metadata.dimensions[row.dimension].length,
        itemIds: metadata.dimensions[row.dimension],
        items: metadata.dimensions[row.dimension].map(item => metadata.items[item]),
        position: 'row'
    }))
    const columns = visualization.columns.map(column => ({
        dimension: column.dimension,
        count: metadata.dimensions[column.dimension].length,
        itemIds: metadata.dimensions[column.dimension],
        items: metadata.dimensions[column.dimension].map(item => metadata.items[item]),
        position: 'column'
    }))

    addLookupFactors(rows)
    addLookupFactors(columns)

    const allByDimension = {
        ...listByDimension(rows),
        ...listByDimension(columns)
    }

    const headerDimensions = headers.map(header =>
        allByDimension[header.name]
    )

    const rowHeaders = headerDimensions
        .map((_, idx) => idx)
        .filter(idx => headerDimensions[idx] && headerDimensions[idx].position === 'row')
    const columnHeaders = headerDimensions
        .map((_, idx) => idx)
        .filter(idx => headerDimensions[idx] && headerDimensions[idx].position === 'column')

    return {
        rows,
        columns,
        allByDimension,
        headerDimensions,
        rowHeaders,
        columnHeaders
    }
}

const lookup = (dataRow, dimensionLookup) => {
    let row = 0;
    dimensionLookup.rowHeaders.forEach(headerIndex => {
        const idx = dimensionLookup.headerDimensions[headerIndex].itemIds.indexOf(dataRow[headerIndex])
        const factor = dimensionLookup.headerDimensions[headerIndex].lookupFactor
        row += idx * factor
    })

    let column = 0;
    dimensionLookup.columnHeaders.forEach(headerIndex => {
        const idx = dimensionLookup.headerDimensions[headerIndex].itemIds.indexOf(dataRow[headerIndex])
        const factor = dimensionLookup.headerDimensions[headerIndex].lookupFactor
        column += idx * factor
    })

    return { column, row }
}

export class LookupMap {
    height = 0
    width = 0
    data = []
    occupiedColumns = []

    constructor(visualization, data) {
        this.visualization = visualization
        this.rawData = data

        this.dimensionLookup = buildDimensionLookup(this.visualization, this.rawData.metaData, this.rawData.headers)

        this.height = countFromDisaggregates(this.dimensionLookup.rows)
        this.width = countFromDisaggregates(this.dimensionLookup.columns)

        this.buildMatrix()
    }

    get({ row, column }) {
        if (this.data[row]) {
            return this.data[row][column]
        }
        return undefined
    }
    reverseLookup(dataRow) {
        return lookup(dataRow, this.dimensionLookup)
    }

    rowIsEmpty(row) {
        return this.data[row] && this.data[row].length === 0
    }
    columnIsEmpty(column) {
        return !this.occupiedColumns[column]
    }

    buildMatrix() {
        this.data = []
        this.occupiedColumns = []
        for (let row = 0; row < this.height; ++row) {
            this.data[row] = [];
        }

        this.rawData.rows.forEach(dataRow => {
            const pos = this.reverseLookup(dataRow)
            this.data[pos.row][pos.column] = dataRow
            this.occupiedColumns[pos.column] = true
        })
    }
}