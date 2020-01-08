import React, { useState, useRef, useCallback, useEffect } from 'react'

import times from 'lodash/times'
import debounce from 'lodash/debounce'

import styles from './PivotTable.styles'

const columnCount = 100000
const rowCount = 30
const columns = times(columnCount, n => `COLUMN ${n}`)
const rows = times(rowCount, n => `ROW ${n}`)

const colWidth = 150;
const totalWidth = columnCount * colWidth

const data = times(rowCount, () =>
    times(3, () =>
        times(columnCount, () => Math.floor(Math.random() * 10000) / 100)
    )
)

const getClippedHeaders = (scrollPositionX, width) => {
    const count = Math.ceil(width / colWidth)
    const start = Math.min(columnCount - count, Math.floor(scrollPositionX / colWidth))
    const bufferLeft = start * colWidth
    const bufferRight = totalWidth - (start + count) * colWidth
    const cols = times(
        count,
        n => ({
            key: start + n,
            value: columns[start + n]
        })
    )

    if (start > 0) {
        cols.unshift({
            key: "pre",
            value: null,
            style: {
                minWidth: bufferLeft
            }
        })
    }
    if (start + count < columnCount) {
        cols.push({
            key: "post",
            value: null,
            style: {
                minWidth: bufferRight
            }
        })
    }

    return cols
}
const getClippedRow = (row, scrollPositionX, width) => {
    const count = Math.ceil(width / colWidth)
    const start = Math.min(columnCount - count, Math.floor(scrollPositionX / colWidth))
    const bufferLeft = start * colWidth
    const bufferRight = totalWidth - (start + count) * colWidth
    const cols = times(
        count,
        n => ({
            key: start + n,
            value: data[row[0]][row[1]][start + n]
        })
    )

    if (start > 0) {
        cols.unshift({
            key: "pre",
            value: null,
            style: {
                minWidth: bufferLeft
            }
        })
    }
    if (start + count < columnCount) {
        cols.push({
            key: "post",
            value: null,
            style: {
                minWidth: bufferRight
            }
        })
    }

    console.log(start, start + count)
    return cols
}

export const PivotTable = (data, config) => {
    const container = useRef(undefined)
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })

    const onScroll = useCallback(debounce(() => {
        const scroll = { x: container.current.scrollLeft, y: container.current.scrollTop }
        setScrollPosition(scroll)
        console.log(scroll)
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

    return <div className="pivot-table-container" ref={container}>
        <style jsx>{styles}</style>
        <table>
            <thead>
                <tr>
                    <th colSpan={2} className="empty-header row-header"></th>
                    {getClippedHeaders(scrollPosition.x, 1200).map(({ key, value, style }) =>
                        <th className="col-header" key={key} style={style}>{value}</th>
                    )}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, idx) => <>
                    <tr key={row} style={{ width: (2 + columnCount) * colWidth }}>
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
                        {getClippedRow([idx, 0], scrollPosition.x, 1200).map(({ key, value, style }) =>
                            <td key={key} style={style}>{value}</td>
                        )}
                    </tr>
                    <tr>
                        {getClippedRow([idx, 1], scrollPosition.x, 1200).map(({ key, value, style }) =>
                            <td key={key} style={style}>{value}</td>
                        )}
                    </tr>
                    <tr>
                        {getClippedRow([idx, 2], scrollPosition.x, 1200).map(({ key, value, style }) =>
                            <td key={key} style={style}>{value}</td>
                        )}
                    </tr>
                </>)}
            </tbody>
        </table>
    </div>
}