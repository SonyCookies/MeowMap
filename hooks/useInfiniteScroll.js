import { useState, useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';

/**
 * Custom hook for infinite horizontal scroll functionality
 * Handles auto-scrolling, manual scrolling, and seamless looping
 * 
 * @param {Array} items - Array of items to display
 * @param {Object} options - Configuration options
 * @param {number} options.cardWidth - Width of each card (default: 280)
 * @param {number} options.gap - Gap between cards (default: 12)
 * @param {number} options.autoScrollInterval - Auto-scroll interval in ms (default: 5000)
 * @param {number} options.resumeDelay - Delay before resuming auto-scroll after manual scroll (default: 5000)
 * @returns {Object} - Scroll state and handlers
 */
export const useInfiniteScroll = (items, options = {}) => {
  const {
    cardWidth = 280,
    gap = 12,
    autoScrollInterval = 5000,
    resumeDelay = 5000,
  } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const autoScrollPausedRef = useRef(false);
  const scrollX = useRef(0);
  const screenWidth = Dimensions.get('window').width;

  const itemWidth = cardWidth + gap;
  const sectionWidth = itemWidth * items.length;
  const loopedItems = [...items, ...items, ...items];

  // Initialize scroll position to middle section
  useEffect(() => {
    if (items.length === 0 || !scrollViewRef.current) return;
    
    const initialScrollX = sectionWidth;
    
    const timeout = setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: initialScrollX,
          animated: false,
        });
        scrollX.current = initialScrollX;
        setCurrentIndex(0);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [items.length, screenWidth, sectionWidth]);

  // Auto-scroll effect
  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      if (autoScrollPausedRef.current) {
        return;
      }

      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % items.length;
        
        if (scrollViewRef.current) {
          const targetSection = 1; // Stay in middle section
          const scrollToX = targetSection * sectionWidth + (nextIndex * itemWidth);
          
          scrollViewRef.current.scrollTo({
            x: scrollToX,
            animated: true,
          });
          scrollX.current = scrollToX;
        }
        
        return nextIndex;
      });
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [items.length, screenWidth, sectionWidth, itemWidth, autoScrollInterval]);

  /**
   * Handle scroll event
   */
  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    const scrollPosition = contentOffset.x;
    
    scrollX.current = scrollPosition;
    
    // Calculate which section we're in (0, 1, or 2)
    const section = Math.floor(scrollPosition / sectionWidth);
    // Calculate position within the current section
    const positionInSection = scrollPosition % sectionWidth;
    // Find which card is closest to center
    const index = Math.round(positionInSection / itemWidth) % items.length;
    
    setCurrentIndex(index);
    
    // Loop detection: seamlessly jump between sections for infinite scroll
    if (section === 0 && positionInSection < itemWidth) {
      // Near the start of first section, jump to same position in middle section
      if (scrollViewRef.current) {
        const newScrollX = sectionWidth + positionInSection;
        scrollViewRef.current.scrollTo({
          x: newScrollX,
          animated: false,
        });
        scrollX.current = newScrollX;
      }
    } else if (section === 2 && positionInSection > sectionWidth - itemWidth) {
      // Near the end of last section, jump to same position in middle section
      if (scrollViewRef.current) {
        const newScrollX = sectionWidth + positionInSection;
        scrollViewRef.current.scrollTo({
          x: newScrollX,
          animated: false,
        });
        scrollX.current = newScrollX;
      }
    }
  };

  /**
   * Handle scroll begin drag - pause auto-scroll
   */
  const handleScrollBeginDrag = () => {
    autoScrollPausedRef.current = true;
  };

  /**
   * Handle scroll end drag - snap to nearest card and resume auto-scroll
   */
  const handleScrollEndDrag = () => {
    if (scrollViewRef.current) {
      const currentSection = Math.floor(scrollX.current / sectionWidth);
      const positionInSection = scrollX.current % sectionWidth;
      const nearestIndex = Math.round(positionInSection / itemWidth) % items.length;
      
      // Calculate centered position for the nearest card
      let targetSection = currentSection;
      if (currentSection === 0 || currentSection === 2) {
        targetSection = 1; // Jump to middle section
      }
      const snapToX = targetSection * sectionWidth + (nearestIndex * itemWidth);
      
      scrollViewRef.current.scrollTo({
        x: snapToX,
        animated: true,
      });
      scrollX.current = snapToX;
      setCurrentIndex(nearestIndex);
    }
    
    // Resume auto-scroll after delay
    setTimeout(() => {
      autoScrollPausedRef.current = false;
    }, resumeDelay);
  };

  return {
    currentIndex,
    scrollViewRef,
    loopedItems,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
  };
};

