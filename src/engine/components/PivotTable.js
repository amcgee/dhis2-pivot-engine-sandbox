import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'

import debounce from 'lodash/debounce'

import styles from './PivotTable.styles'
import { LookupMap } from '../utils/LookupMap'
import { clipAxis } from '../utils/clipAxis'
import { getHeaderForDisplay } from '../utils/getHeaderForDisplay'

export const PivotTable = ({ visualization, data, options }) => {
    const container = useRef(undefined)
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })

    const lookup = useMemo(() => new LookupMap(visualization, data), [visualization, data])

    const onScroll = useCallback(debounce(() => {
        const scroll = { x: container.current.scrollLeft, y: container.current.scrollTop }
        setScrollPosition(scroll)
    }, 10))

    useEffect(() => {
        if (!container) {
            return;
        }

        container.current.addEventListener('scroll', onScroll)
        return () => {
            container.current.removeEventListener('scroll', onScroll)
        }
    }, [container])

    const clippedRows = clipAxis(scrollPosition.y, 600 - lookup.dimensionLookup.rows.length * 25, 25, lookup.height)
    const clippedCols = clipAxis(scrollPosition.x, 1200 - lookup.dimensionLookup.rows.length * 150, 150, lookup.width)

    return <div className="pivot-table-container" ref={container}>
        <style jsx>{styles}</style>
        <table>
            <thead>
                {lookup.dimensionLookup.columns.map((column, columnLevel) =>
                    <tr>
                        <th colSpan={lookup.rowDepth} className="empty-header row-header"></th>
                        {clippedCols.pre ?
                            <th className="col-header" style={{ minWidth: clippedCols.pre }} /> : null
                        }
                        {clippedCols.indices.map((index, clippedIndex) => {
                            const header = getHeaderForDisplay({
                                index,
                                clippedIndex,
                                clippedIndices: clippedCols.indices,
                                dimension: column,
                                dimensionLevel: columnLevel,
                                getHeader: idx => lookup.getColumnHeader(idx)
                            })
                            return !header ? null : <th className="col-header" key={index} colSpan={header.span}>{header.name}</th>
                        })}
                        {clippedCols.post ?
                            <th className="col-header" style={{ minWidth: clippedCols.post }} /> : null
                        }
                    </tr>
                )}
            </thead>
            <tbody>
                {clippedRows.pre ?
                    <tr><td style={{ height: clippedRows.pre }} /></tr> : null
                }

                {clippedRows.indices.map((index, clippedIndex) =>
                    <tr key={index}>
                        {lookup.dimensionLookup.rows.map((row, rowLevel) => {
                            const header = getHeaderForDisplay({
                                index,
                                clippedIndex,
                                clippedIndices: clippedRows.indices,
                                dimension: row,
                                dimensionLevel: rowLevel,
                                getHeader: idx => lookup.getRowHeader(idx)
                            })
                            return !header ? null : <td className="row-header" rowSpan={header.span}>{header.name}</td>
                        })}
                        {clippedCols.pre ? <td /> : null}
                        {
                            clippedCols.indices.map(col => {
                                const dataRow = lookup.get({ row: index, column: col })
                                return <td key={col}>{dataRow ? dataRow[4] : null}</td>
                            })
                        }
                        {clippedCols.post ? <td /> : null}
                    </tr>
                )}

                {clippedRows.post ?
                    <tr><td style={{ height: clippedRows.post }} /></tr> : null
                }
            </tbody>
        </table>
    </div>
}