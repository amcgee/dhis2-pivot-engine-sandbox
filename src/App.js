import React from 'react'
import { PivotTable } from './engine'

// OPTIONS test, deep, emptyRows, emptyColumns
import data from './data/emptyRows.data.json'
import visualization from './data/emptyRows.visualization.json'

const invert = false
const options = {
    hideEmptyRows: true,
    hideEmptyColumns: true,
    showColumnSubtotals: true,
    showRowSubtotals: true,
    showColumnTotals: true,
    showRowTotals: true,
}

if (invert) {
    const oldRows = visualization.rows;
    visualization.rows = visualization.columns;
    visualization.columns = oldRows;
}

const MyApp = () => (
    <div className="container">
        <style jsx>{`
            .container {
                position: absolute;
                top: 48px;
                bottom: 0px;
                left: 0px;
                right: 0px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
            }
        }`}</style>
        <PivotTable visualization={visualization} data={data} options={options} />
    </div>
)

export default MyApp
