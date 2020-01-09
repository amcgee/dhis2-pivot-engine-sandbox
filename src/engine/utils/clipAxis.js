import times from 'lodash/times'

export const clipAxis = (position, size, step, totalCount) => {
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