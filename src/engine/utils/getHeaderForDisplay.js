export const getHeaderForDisplay = ({
    index, clippedIndices, clippedIndex, dimension, dimensionLevel, getHeader
}) => {
    const showHeader = index % dimension.size === 0 || clippedIndex === 0;
    if (!showHeader) return null;

    const count = clippedIndices.length;
    const preClipCount = clippedIndices[0] % dimension.size;

    const span = Math.min(clippedIndex === 0 ? dimension.size - preClipCount : dimension.size, count - clippedIndex)

    const header = getHeader(index)[dimensionLevel]

    return {
        span,
        name: header ? header.name : null,
    }
}