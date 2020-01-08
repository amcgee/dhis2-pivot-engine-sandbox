import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'

import times from 'lodash/times'
import debounce from 'lodash/debounce'

import styles from './PivotTable.styles'
import { LookupMap } from '../utils/LookupMap'

const columnCount = 100000
const rowCount = 30
const columns = times(columnCount, n => `COLUMN ${n}`)
const rows = times(rowCount, n => `ROW ${n}`)

const mockData = times(rowCount, () =>
    times(3, () =>
        times(columnCount, () => Math.floor(Math.random() * 10000) / 100)
    )
)

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

    const clippedRows = doClipping(scrollPosition.y, 600, 25, rowCount)
    const clippedCols = doClipping(scrollPosition.x, 1200, 150, columnCount)

    return <div className="pivot-table-container" ref={container}>
        <style jsx>{styles}</style>
        <table>
            <thead>
                <tr>
                    <th colSpan={2} className="empty-header row-header"></th>
                    {clippedCols.pre ?
                        <th className="col-header" style={{ minWidth: clippedCols.pre }} /> : null
                    }
                    {clippedCols.indices.map(idx =>
                        <th className="col-header" key={idx}>{columns[idx]}</th>
                    )}
                    {clippedCols.post ?
                        <th className="col-header" style={{ minWidth: clippedCols.post }} /> : null
                    }
                </tr>
            </thead>
            <tbody>
                {rows.map((row, rowidx) => <>
                    <tr key={row}>
                        <td rowSpan={3} colSpan={2} className="row-header">
                            <tr>
                                <td rowSpan={3}>{row}</td>
                                <td>{row}.1</td>
                            </tr>
                            <tr>
                                <td>{row}.2</td>
                            </tr>
                            <tr>
                                <td>{row}.3</td>
                            </tr>
                        </td>
                        {clippedCols.pre ? <td /> : null}
                        {clippedCols.indices.map(col =>
                            <td key={col}>{mockData[rowidx][0][col]}</td>
                        )}
                        {clippedCols.post ? <td /> : null}
                    </tr>
                    <tr>
                        {clippedCols.pre ? <td /> : null}
                        {clippedCols.indices.map(col =>
                            <td key={col}>{mockData[rowidx][1][col]}</td>
                        )}
                        {clippedCols.post ? <td /> : null}
                    </tr>
                    <tr>
                        {clippedCols.pre ? <td /> : null}
                        {clippedCols.indices.map(col =>
                            <td key={col}>{mockData[rowidx][2][col]}</td>
                        )}
                        {clippedCols.post ? <td /> : null}
                    </tr>
                </>)}
            </tbody>
        </table>
    </div>
}