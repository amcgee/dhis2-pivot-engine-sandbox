import React, { useRef, useMemo } from 'react'

import styles from './PivotTable.styles'
import { LookupMap } from '../utils/LookupMap'
import { clipAxis } from '../utils/clipAxis'
import { getHeaderForDisplay } from '../utils/getHeaderForDisplay'
import { useScrollPosition } from '../utils/useScrollPosition'

export const PivotTable = ({ visualization, data, options }) => {
    const container = useRef(undefined)
    const scrollPosition = useScrollPosition(container)

    const lookup = useMemo(() => new LookupMap(visualization, data, options), [visualization, data, options])
    console.log(lookup)

    const clippedRows = clipAxis(scrollPosition.y, 600, 25, lookup.height)
    const clippedCols = clipAxis(scrollPosition.x, 1200, 150, lookup.width)

    return <div className="pivot-table-container" ref={container}>
        <style jsx>{styles}</style>
        <table>
            <thead>
                {lookup.dimensionLookup.columns.map((_, columnLevel) =>
                    <tr key={columnLevel}>
                        <th colSpan={lookup.rowDepth} className="empty-header row-header"></th>
                        {clippedCols.pre ?
                            <th className="col-header" style={{ minWidth: clippedCols.pre }} /> : null
                        }
                        {clippedCols.indices.map(index => {
                            const header = getHeaderForDisplay({
                                start: clippedCols.indices[0],
                                count: clippedCols.indices.length,
                                index,
                                dimensionLevel: columnLevel,
                                getHeader: idx => lookup.getColumnHeader(idx)
                            })
                            return !header ? null : <th key={index} className="col-header" colSpan={header.span}>{header.name}</th>
                        })}
                        {clippedCols.post ?
                            <th className="col-header" style={{ minWidth: clippedCols.post }} /> : null
                        }
                    </tr>
                )}
            </thead>
            <tbody>
                {clippedRows.pre ? <tr><td style={{ height: clippedRows.pre }} /></tr> : null}

                {clippedRows.indices.map(index =>
                    <tr key={index}>
                        {lookup.dimensionLookup.rows.map((_, rowLevel) => {
                            const header = getHeaderForDisplay({
                                start: clippedRows.indices[0],
                                count: clippedRows.indices.length,
                                index,
                                dimensionLevel: rowLevel,
                                getHeader: idx => lookup.getRowHeader(idx)
                            })
                            return !header ? null : <td key={rowLevel} className="row-header" rowSpan={header.span}>{header.name}</td>
                        })}
                        {clippedCols.pre ? <td /> : null}
                        {
                            clippedCols.indices.map(col => {
                                const value = lookup.get({ row: index, column: col, field: 'value' })
                                return <td key={col}>{value || null}</td>
                            })
                        }
                        {clippedCols.post ? <td /> : null}
                    </tr>
                )}

                {clippedRows.post ? <tr><td style={{ height: clippedRows.post }} /></tr> : null}
            </tbody>
        </table>
    </div>
}