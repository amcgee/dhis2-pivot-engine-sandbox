import React from 'react'
import times from "lodash/times";

const dataFields = ['value', 'numerator', 'denominator', 'factor', 'multiplier', 'divisor']

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

    const dataHeaders = dataFields.reduce((out, field) => {
        out[field] = headers.findIndex(header => header.name === field)
        return out;
    }, {})

    return {
        rows,
        columns,
        allByDimension,
        headerDimensions,
        rowHeaders,
        columnHeaders,
        dataHeaders
    }
}

const lookup = (dataRow, dimensionLookup, options) => {
    let row = 0;
    dimensionLookup.rowHeaders.forEach(headerIndex => {
        const idx = dimensionLookup.headerDimensions[headerIndex].itemIds.indexOf(dataRow[headerIndex])
        const size = dimensionLookup.headerDimensions[headerIndex].size
        row += idx * size
    })

    if (options.showRowSubtotals) {
        row += Math.floor(row / dimensionLookup.rows[0].size)
    }

    let column = 0;
    dimensionLookup.columnHeaders.forEach(headerIndex => {
        const idx = dimensionLookup.headerDimensions[headerIndex].itemIds.indexOf(dataRow[headerIndex])
        const size = dimensionLookup.headerDimensions[headerIndex].size
        column += idx * size
    })

    if (options.showColumnSubtotals) {
        column += Math.floor(column / dimensionLookup.columns[0].size)
    }

    return { column, row }
}

export class LookupMap {
    visualization
    rawData
    options

    dimensionLookup

    columnDepth = 0
    rowDepth = 0

    height = 0
    width = 0
    data = []
    occupiedColumns = []
    rowMap = []
    columnMap = []

    constructor(visualization, data, options = {}) {
        this.visualization = visualization
        this.rawData = data
        this.options = options

        this.dimensionLookup = buildDimensionLookup(this.visualization, this.rawData.metaData, this.rawData.headers)

        this.columnDepth = this.dimensionLookup.columns.length;
        this.rowDepth = this.dimensionLookup.rows.length;

        this.buildMatrix()
    }

    get({ row, column, field }) {
        const mappedRow = this.rowMap[row],
            mappedColumn = this.columnMap[column]
        if (!mappedRow && mappedRow !== 0 || !mappedColumn && mappedColumn !== 0) {
            return undefined
        }
        if (this.data[mappedRow]) {
            const dataRow = this.data[mappedRow][mappedColumn]
            if (!field) {
                return dataRow
            } else if (dataRow && this.dimensionLookup.dataHeaders[field]) {
                return dataRow[this.dimensionLookup.dataHeaders[field]]
            }
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
        column = this.columnMap[column]
        if (this.options.showColumnTotals && column === this.width - 1) {
            return times(this.dimensionLookup.columns.length - 1, () => undefined).concat([{ name: 'TOTAL' }])
        }
        if (this.options.showColumnSubtotals) {
            if ((column + 1) % (this.dimensionLookup.columns[0].size + 1) === 0) {
                return []
            }
            column -= Math.floor(column / (this.dimensionLookup.columns[0].size + 1))
        }
        return this.dimensionLookup.columns.map(dimension => {
            let itemIndex = Math.floor(column / dimension.size) % dimension.count;
            return dimension.items[itemIndex]
        })
    }

    getRowHeader(row) {
        row = this.rowMap[row]
        if (this.options.showRowTotals && row === this.height - 1) {
            return times(this.dimensionLookup.rows.length - 1, () => undefined).concat([{ name: 'TOTAL' }])
        }
        if (this.options.showRowSubtotals) {
            if ((row + 1) % (this.dimensionLookup.rows[0].size + 1) === 0) {
                return []
            }
            row -= Math.floor(row / (this.dimensionLookup.rows[0].size + 1))
        }
        return this.dimensionLookup.rows.map(dimension => {
            let itemIndex = Math.floor(row / dimension.size) % dimension.count;
            return dimension.items[itemIndex]
        })
    }

    buildMatrix() {
        this.data = []
        this.occupiedColumns = []

        let rowCount = countFromDisaggregates(this.dimensionLookup.rows)
        let columnCount = countFromDisaggregates(this.dimensionLookup.columns)

        if (this.options.showRowSubtotals) {
            rowCount += this.dimensionLookup.rows[0].count
        }
        if (this.options.showColumnSubtotals) {
            columnCount += this.dimensionLookup.columns[0].count
        }
        if (this.options.showRowTotals) {
            rowCount += 1;
        }
        if (this.options.showColumnTotals) {
            columnCount += 1;
        }

        this.rawData.rows.forEach(dataRow => {
            const pos = lookup(dataRow, this.dimensionLookup, this.options)
            this.data[pos.row] = this.data[pos.row] || []
            this.data[pos.row][pos.column] = dataRow
            this.occupiedColumns[pos.column] = true
        })

        if (this.options.showColumnSubtotals) {
            times(this.dimensionLookup.rows[0].count, row => {
                row = (row + 1) * (this.dimensionLookup.rows[0].size + 1) - 1
                times(columnCount - (this.options.showRowTotals ? 1 : 0), column => {
                    if (!this.occupiedColumns[column]) return;
                    this.data[row][column] = times(8, () => <strong>ST</strong>) //TODO: Actually calculate sub-totals
                })
            })
        }

        if (this.options.showRowSubtotals) {
            times(this.dimensionLookup.columns[0].count, column => {
                column = (column + 1) * (this.dimensionLookup.columns[0].size + 1) - 1
                times(rowCount - (this.options.showColumnTotals ? 1 : 0), row => {
                    if (!this.data[row]) return;
                    this.data[row][column] = times(8, () => <strong>ST</strong>) //TODO: Actually calculate sub-totals
                })
            })
        }

        if (this.options.showColumnTotals) {
            this.data[rowCount - 1] = this.data[rowCount - 1] || []
            times(columnCount, column => {
                if (!this.occupiedColumns[column]) return;
                this.data[rowCount - 1][column] = times(8, () => <strong>TOTAL</strong>) //TODO: Actually calculate totals
            })
        }

        if (this.options.showRowTotals) {
            this.occupiedColumns[columnCount - 1] = true
            times(rowCount, row => {
                if (!this.data[row]) return;
                this.data[row][columnCount - 1] = times(8, () => <strong>TOTAL</strong>) //TODO: Actually calculate totals
            })
        }

        this.columnMap = this.options.hideEmptyColumns
            ? times(columnCount, n => n).filter(idx => !!this.occupiedColumns[idx])
            : times(columnCount, n => n)
        this.rowMap = this.options.hideEmptyRows
            ? times(rowCount, n => n).filter(idx => !!this.data[idx])
            : times(rowCount, n => n)

        this.height = this.rowMap.length;
        this.width = this.columnMap.length;
    }
}