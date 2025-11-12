import { useState, useRef, useEffect, useCallback } from 'react';

interface ImageViewerProps {
  imageUrl: string;
  altText: string;
  onClose: () => void;
}

export default function ImageViewer({
  imageUrl,
  altText,
  onClose,
}: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // 缩放步长
  const ZOOM_STEP = 0.2; // 按钮点击的步长
  const WHEEL_ZOOM_STEP = 0.05; // 滚轮缩放的步长（更小，更精细）
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;

  // 放大
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + ZOOM_STEP, MAX_SCALE));
  };

  // 缩小
  const zoomOut = () => {
    setScale((prev) => Math.max(prev - ZOOM_STEP, MIN_SCALE));
  };

  // 旋转
  const rotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const rotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  // 重置
  const reset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // 适应屏幕
  const fitToScreen = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只响应左键
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position.x, position.y]);

  // 鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    // 缓存当前鼠标位置
    const clientX = e.clientX;
    const clientY = e.clientY;
    // 使用 requestAnimationFrame 优化性能
    requestAnimationFrame(() => {
      setPosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
    });
  }, [isDragging, dragStart.x, dragStart.y]);

  // 鼠标松开
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // 单指拖拽
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    } else if (e.touches.length === 2) {
      // 双指缩放
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setLastTouchDistance(distance);
      setIsDragging(false);
    }
  }, [position.x, position.y]);

  // 触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // 防止页面滚动

    if (e.touches.length === 1 && isDragging) {
      // 单指拖拽
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      requestAnimationFrame(() => {
        setPosition({
          x: clientX - dragStart.x,
          y: clientY - dragStart.y,
        });
      });
    } else if (e.touches.length === 2) {
      // 双指缩放
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastTouchDistance !== null) {
        const delta = (distance - lastTouchDistance) * 0.01;
        setScale((prev) => {
          const newScale = prev + delta;
          return Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
        });
      }
      setLastTouchDistance(distance);
    }
  }, [isDragging, dragStart.x, dragStart.y, lastTouchDistance, MIN_SCALE, MAX_SCALE]);

  // 触摸结束
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setLastTouchDistance(null);
  }, []);

  // 鼠标滚轮缩放（带节流优化）
  const wheelTimerRef = useRef<number | null>(null);
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    // 清除之前的定时器
    if (wheelTimerRef.current) {
      return; // 如果还在节流期内，直接返回
    }

    const delta = e.deltaY > 0 ? -WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP;
    setScale((prev) => {
      const newScale = prev + delta;
      return Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
    });

    // 设置节流定时器（16ms ≈ 60fps）
    wheelTimerRef.current = window.setTimeout(() => {
      wheelTimerRef.current = null;
    }, 16);
  }, []);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // 清理滚轮节流定时器
      if (wheelTimerRef.current) {
        clearTimeout(wheelTimerRef.current);
      }
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={(e) => {
        // 点击背景关闭
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm py-4 px-6 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h3 className="text-white font-medium">{altText}</h3>
            <span className="text-white/70 text-sm">
              {Math.round(scale * 100)}%
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            title="关闭 (ESC)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 图片容器 */}
      <div
        ref={imageRef}
        className="flex-1 flex items-center justify-center overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        <img
          src={imageUrl}
          alt={altText}
          draggable={false}
          className="select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        />
      </div>

      {/* 底部工具栏 */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm py-4 px-6 z-10">
        <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto flex-wrap">
          {/* 缩放按钮 */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            <button
              onClick={zoomOut}
              disabled={scale <= MIN_SCALE}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="缩小"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                />
              </svg>
            </button>
            <span className="text-white/90 text-sm font-medium px-2 min-w-[4rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="放大"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </button>
          </div>

          {/* 旋转按钮 */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            <button
              onClick={rotateLeft}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="向左旋转"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            <button
              onClick={rotateRight}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="向右旋转"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                />
              </svg>
            </button>
          </div>

          {/* 其他操作 */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            <button
              onClick={fitToScreen}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="适应屏幕"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
            <button
              onClick={reset}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="重置"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 操作提示 */}
        <div className="text-center mt-3 text-white/50 text-xs">
          <span className="mr-4 hidden sm:inline">🖱️ 拖拽平移</span>
          <span className="mr-4 hidden sm:inline">🔍 滚轮缩放</span>
          <span className="mr-4 sm:hidden">👆 单指拖拽</span>
          <span className="mr-4 sm:hidden">🤏 双指缩放</span>
          <span>⌨️ ESC 关闭</span>
        </div>
      </div>
    </div>
  );
}
