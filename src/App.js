import React, { useMemo } from 'react'
import { DataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { PivotTable } from './engine'
import { LookupMap } from './engine/utils/LookupMap'

import data from './testData.json'
import visualization from './testVisualization.json'
import times from 'lodash/times'

const invert = true
const hideEmptyRows = true;
const hideEmptyColumns = true;

if (invert) {
    const oldRows = visualization.rows;
    visualization.rows = visualization.columns;
    visualization.columns = oldRows;
}

const Value = ({ lookup, pos }) => {
    const data = lookup.get(pos)
    if (!data) return <td style={{ border: '1px solid black' }} />
    return <td style={{ border: '1px solid black' }}>{data[4]}</td>
}
const DataTable = () => {
    const lookup = useMemo(() => new LookupMap(visualization, data))
    return <table>
        <tbody>
            {times(lookup.height, row => hideEmptyRows && lookup.rowIsEmpty(row) ? null : <tr key={row}>
                {times(lookup.width, column => hideEmptyColumns && lookup.columnIsEmpty(column) ? null : <Value key={column} lookup={lookup} pos={{ row, column }} />)}
            </tr>)}
        </tbody>
    </table>
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
        {/* <DataTable /> */}
        <PivotTable visualization={visualization} data={data} />
    </div>
)

export default MyApp
