import times from "lodash/times";

const defaultOptions = {
    hideEmptyColumns: false,
    hideEmptyRows: false
}

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

const addSize = list => {
    const reversedList = list.slice().reverse()
    reversedList.forEach((level, idx) => { // Start at the "leaf" disaggregate
        const lastLevel = reversedList[idx - 1]
        level.size = lastLevel ? lastLevel.count * lastLevel.size : 1
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

    addSize(rows)
    addSize(columns)

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
        const size = dimensionLookup.headerDimensions[headerIndex].size
        row += idx * size
    })

    let column = 0;
    dimensionLookup.columnHeaders.forEach(headerIndex => {
        const idx = dimensionLookup.headerDimensions[headerIndex].itemIds.indexOf(dataRow[headerIndex])
        const size = dimensionLookup.headerDimensions[headerIndex].size
        column += idx * size
    })

    return { column, row }
}

export class LookupMap {
    height = 0
    width = 0
    data = []
    occupiedColumns = []

    columnDepth = 0
    rowDepth = 0

    constructor(visualization, data, options) {
        this.visualization = visualization
        this.rawData = data
        this.options = {
            ...defaultOptions,
            ...options
        }

        this.dimensionLookup = buildDimensionLookup(this.visualization, this.rawData.metaData, this.rawData.headers)

        this.columnDepth = this.dimensionLookup.columns.length;
        this.rowDepth = this.dimensionLookup.rows.length;

        this.buildMatrix()
    }

    get({ row, column }) {
        const mappedRow = this.rowMap[row],
            mappedColumn = this.columnMap[column]
        if (!mappedRow && mappedRow !== 0 || !mappedColumn && mappedColumn !== 0) {
            return undefined
        }
        if (this.data[mappedRow]) {
            return this.data[mappedRow][mappedColumn]
        }
        return undefined
    }

    rowIsEmpty(row) {
        return this.data[row] && this.data[row].length === 0
    }
    columnIsEmpty(column) {
        return !this.occupiedColumns[column]
    }

    getColumnHeader(column) {
        return this.dimensionLookup.columns.map(dimension => {
            const itemIndex = Math.floor(column / dimension.size) % dimension.count;
            return dimension.items[itemIndex]
        })
    }

    getRowHeader(row) {
        return this.dimensionLookup.rows.map(dimension => {
            const itemIndex = Math.floor(row / dimension.size) % dimension.count;
            return dimension.items[itemIndex]
        })
    }

    buildMatrix() {
        this.data = []
        this.occupiedColumns = []

        const rowCount = countFromDisaggregates(this.dimensionLookup.rows)
        const columnCount = countFromDisaggregates(this.dimensionLookup.columns)
        for (let row = 0; row < rowCount; ++row) {
            this.data[row] = [];
        }

        this.rawData.rows.forEach(dataRow => {
            const pos = lookup(dataRow, this.dimensionLookup)
            this.data[pos.row][pos.column] = dataRow
            this.occupiedColumns[pos.column] = true
        })

        this.columnMap = this.options.hideEmptyColumns
            ? times(columnCount, n => n).filter(idx => !!this.occupiedColumns[idx])
            : times(columnCount, n => n)
        this.rowMap = this.options.hideEmptyRows
            ? times(rowCount, n => n).filter(idx => !!this.data[idx].length)
            : times(rowCount, n => n)

        console.log(this.columnMap, this.rowMap, this.data)

        this.height = this.rowMap.length;
        this.width = this.columnMap.length;
    }
}