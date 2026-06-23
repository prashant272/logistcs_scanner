import { useEffect, useRef, useCallback } from 'react';

const useInfiniteScroll = (callback, hasMore, loading) => {
    const observer = useRef();

    const lastElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                callback();
            }
        }, {
            root: node ? node.closest('.overflow-y-auto') || node.closest('.overflow-auto') : null,
            rootMargin: '200px',
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore, callback]);

    return lastElementRef;
};

export default useInfiniteScroll;
