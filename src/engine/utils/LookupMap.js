import React from 'react'
import times from "lodash/times";

const dataFields = ['value', 'numerator', 'denominator', 'factor', 'multiplier', 'divisor']

const CELL_TYPE_VALUE = 'value'
const CELL_TYPE_SUBTOTAL = 'subtotal'
const CELL_TYPE_TOTAL = 'total'

const defaultOptions = {
    hideEmptyColumns: false,
    hideEmptyRows: false,
    showRowTotals: false,
    showColumnTotals: false,
    showRowSubtotals: false,
    showColumnSubtotals: false,
    aggregateType: 'count'
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
        const type = this.getCellType({ row, column })
        const mappedRow = this.rowMap[row],
            mappedColumn = this.columnMap[column]
        if (!mappedRow && mappedRow !== 0 || !mappedColumn && mappedColumn !== 0) {
            return undefined
        }
        if (this.data[mappedRow]) {
            const dataRow = this.data[mappedRow][mappedColumn]
            if (dataRow) {
                switch (type) {
                    case CELL_TYPE_VALUE:
                        const dataValue = dataRow[this.dimensionLookup.dataHeaders['value']]
                        return dataValue ? dataValue : undefined
                    default:
                        //TODO: Different aggregation types (count only works for now)
                        const totalValue = dataRow.count
                        return totalValue ? totalValue : undefined
                }
            }
        }
        return undefined
    }

    rowIsEmpty(row) {
        return !this.data[row] || this.data[row].length === 0
    }
    columnIsEmpty(column) {
        return !this.occupiedColumns[column]
    }

    getColumnHeader(column) {
        column = this.columnMap[column]
        if (this.options.showRowTotals && column === this.dataWidth - 1) {
            return times(this.dimensionLookup.columns.length - 1, () => undefined).concat([{ name: 'TOTAL' }])
        }
        if (this.options.showRowSubtotals) {
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
        if (this.options.showColumnTotals && row === this.dataHeight - 1) {
            return times(this.dimensionLookup.rows.length - 1, () => undefined).concat([{ name: 'TOTAL' }])
        }
        if (this.options.showColumnSubtotals) {
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

    getDependantTotalCells({ row, column }) {
        const rowSubtotalSize = this.dimensionLookup.columns[0].size + 1
        const rowSubtotal = this.options.showRowSubtotals && {
            row,
            column: Math.ceil((column + 1) / rowSubtotalSize) * rowSubtotalSize - 1,
            size: rowSubtotalSize - 1
        }

        const columnSubtotalSize = this.dimensionLookup.rows[0].size + 1
        const columnSubtotal = this.options.showColumnSubtotals && {
            row: Math.ceil((row + 1) / columnSubtotalSize) * columnSubtotalSize - 1,
            column,
            size: columnSubtotalSize - 1
        }

        const rowTotal = this.options.showRowTotals && {
            row,
            column: this.dataWidth - 1,
            size: this.rawDataWidth
        }

        const columnTotal = this.options.showColumnTotals && {
            row: this.dataHeight - 1,
            column,
            size: this.rawDataHeight
        }
        return {
            rowSubtotal,
            columnSubtotal,
            rowTotal,
            columnTotal
        }
    }

    addCellValueToTotals(pos, dataRow) {
        const totals = this.getDependantTotalCells(pos)

        Object.entries(totals).forEach(([totalType, total]) => {
            if (!total) return;

            this.data[total.row] = this.data[total.row] || [];
            this.occupiedColumns[total.column] = true

            this.data[total.row][total.column] = this.data[total.row][total.column] || {
                count: 0,
                totalCount: total.size
            }
            const totalCell = this.data[total.row][total.column]

            dataFields.forEach(field => {
                const headerIndex = this.dimensionLookup.dataHeaders[field]
                // TODO: Fix number parsing, check data type in header
                const value = Number(dataRow[headerIndex])
                if (value && !isNaN(value)) {
                    totalCell[field] += value
                }
            })
            totalCell.count += 1
        })
    }
    finalizeTotals() {
        // TODO: Different aggregation types?
    }

    getCellType({ row, column }) {
        row = this.rowMap[row]
        column = this.columnMap[column]
        const isRowTotal = this.options.showRowTotals && row === this.dataHeight - 1
        const isColumnTotal = this.options.showColumnTotals && column === this.dataWidth - 1
        if (isRowTotal || isColumnTotal) {
            return CELL_TYPE_TOTAL
        }

        const isRowSubtotal = this.options.showRowSubtotals && (row + 1) % (this.dimensionLookup.rows[0].size + 1) === 0
        const isColumnSubtotal = this.options.showColumnSubtotals && (column + 1) % (this.dimensionLookup.columns[0].size + 1) === 0

        if (isRowSubtotal || isColumnSubtotal) {
            return CELL_TYPE_SUBTOTAL
        }

        return CELL_TYPE_VALUE
    }

    buildMatrix() {
        this.data = []
        this.occupiedColumns = []

        this.dataHeight = this.rawDataHeight = countFromDisaggregates(this.dimensionLookup.rows)
        this.dataWidth = this.rawDataWidth = countFromDisaggregates(this.dimensionLookup.columns)

        if (this.options.showRowSubtotals) {
            this.dataWidth += this.dimensionLookup.columns[0].count
        }
        if (this.options.showColumnSubtotals) {
            this.dataHeight += this.dimensionLookup.rows[0].count
        }
        if (this.options.showRowTotals) {
            this.dataWidth += 1;
        }
        if (this.options.showColumnTotals) {
            this.dataHeight += 1;
        }

        this.rawData.rows.forEach(dataRow => {
            const pos = lookup(dataRow, this.dimensionLookup, this.options)
            this.data[pos.row] = this.data[pos.row] || []
            this.data[pos.row][pos.column] = dataRow
            this.occupiedColumns[pos.column] = true

            this.addCellValueToTotals(pos, dataRow)
        })

        this.finalizeTotals()

        this.columnMap = this.options.hideEmptyColumns
            ? times(this.dataWidth, n => n).filter(idx => !!this.occupiedColumns[idx])
            : times(this.dataWidth, n => n)
        this.rowMap = this.options.hideEmptyRows
            ? times(this.dataHeight, n => n).filter(idx => !!this.data[idx])
            : times(this.dataHeight, n => n)

        this.height = this.rowMap.length;
        this.width = this.columnMap.length;
    }
}