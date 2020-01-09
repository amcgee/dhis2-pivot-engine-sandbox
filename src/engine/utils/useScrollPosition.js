import React, {
    useState,
    useCallback,
    useEffect
} from 'react'

import debounce from 'lodash/debounce'

export const useScrollPosition = (containerRef, debounceWait = 10) => {
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })

    const onScroll = useCallback(
        debounce(() => {
            const scroll = { x: containerRef.current.scrollLeft, y: containerRef.current.scrollTop }
            setScrollPosition(scroll)
        }, debounceWait)
    )

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        containerRef.current.addEventListener('scroll', onScroll)
        return () => {
            containerRef.current.removeEventListener('scroll', onScroll)
        }
    }, [containerRef.current])

    return scrollPosition
}