import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'

import times from 'lodash/times'
import debounce from 'lodash/debounce'

import styles from './PivotTable.styles'
import { LookupMap } from '../utils/LookupMap'

const doClipping = (position, size, step, totalCount) => {
    const count = Math.ceil(size / step)
    const start = Math.min(totalCount - count, Math.floor(position / step))
    const pre = start * step
    const post = (totalCount - (start + count)) * step
    const indices = times(
        count,
        n => start + n
    )

    return {
        indices,
        pre,
        post
    }
}

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

    const clippedRows = doClipping(scrollPosition.y, 600 - lookup.dimensionLookup.rows.length * 25, 25, lookup.height)
    const clippedCols = doClipping(scrollPosition.x, 1200 - lookup.dimensionLookup.rows.length * 150, 150, lookup.width)

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
                        {clippedCols.indices.map((idx, colNumber) => {
                            const showHeader = idx % column.size === 0 || colNumber === 0;
                            if (!showHeader) return null;

                            const colCount = clippedCols.indices.length;
                            const preClipCount = clippedCols.indices[0] % column.size;

                            const colSpan = Math.min(colNumber === 0 ? column.size - preClipCount : column.size, colCount - colNumber)

                            return <th className="col-header" colSpan={colSpan} key={idx}>{
                                lookup.getColumnHeader(idx)[columnLevel]
                                    ? lookup.getColumnHeader(idx)[columnLevel].name
                                    : null
                            }</th>
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

                {clippedRows.indices.map((idx, rowNumber) =>
                    <tr key={idx}>
                        {lookup.dimensionLookup.rows.map((row, rowLevel) => {
                            const showHeader = idx % row.size === 0 || rowNumber === 0;
                            if (!showHeader) return null;

                            const rowCount = clippedRows.indices.length;
                            const preClipCount = clippedRows.indices[0] % row.size;

                            const rowSpan = Math.min(rowNumber === 0 ? row.size - preClipCount : row.size, rowCount - rowNumber)

                            const header = lookup.getRowHeader(idx)[rowLevel]
                            return <td className="row-header" rowSpan={rowSpan}>{
                                header
                                    ? header.name
                                    : null
                            }</td>
                        })}
                        {clippedCols.pre ? <td /> : null}
                        {
                            clippedCols.indices.map(col => {
                                const dataRow = lookup.get({ row: idx, column: col })
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