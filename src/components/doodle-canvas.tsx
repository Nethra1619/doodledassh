"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type DoodleCanvasProps = {
  color?: string;
  lineWidth?: number;
  disabled?: boolean;
  className?: string;
};

export type DoodleCanvasRef = {
  clear: () => void;
  getDataUrl: () => string;
  download: (filename?: string) => void;
};

export const DoodleCanvas = forwardRef<DoodleCanvasRef, DoodleCanvasProps>(
  ({ color = '#000000', lineWidth = 5, disabled = false, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const isDrawing = useRef(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // For high-DPI displays
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      
      const context = canvas.getContext('2d');
      if (!context) return;
      context.scale(ratio, ratio);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      contextRef.current = context;
    }, []);

    useEffect(() => {
      if (contextRef.current) {
        contextRef.current.strokeStyle = color;
        contextRef.current.lineWidth = lineWidth;
      }
    }, [color, lineWidth]);
    
    const getCoords = (event: MouseEvent | TouchEvent): [number, number] => {
        if (!canvasRef.current) return [0,0];
        const rect = canvasRef.current.getBoundingClientRect();
        if (event instanceof MouseEvent) {
            return [event.clientX - rect.left, event.clientY - rect.top];
        }
        if (event.touches[0]) {
            return [event.touches[0].clientX - rect.left, event.touches[0].clientY - rect.top];
        }
        return [0,0];
    }

    const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      const context = contextRef.current;
      if (!context) return;
      
      const [x, y] = getCoords(event.nativeEvent);
      context.beginPath();
      context.moveTo(x, y);
      isDrawing.current = true;
      event.preventDefault();
    };

    const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current || disabled) return;
      const context = contextRef.current;
      if (!context) return;
      
      const [x, y] = getCoords(event.nativeEvent);
      context.lineTo(x, y);
      context.stroke();
      event.preventDefault();
    };

    const stopDrawing = () => {
      const context = contextRef.current;
      if (!context) return;

      context.closePath();
      isDrawing.current = false;
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (canvas && context) {
          context.fillStyle = "white";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
      },
      getDataUrl: () => {
        return canvasRef.current?.toDataURL('image/png') || '';
      },
      download: (filename = 'doodle') => {
        const canvas = canvasRef.current;
        if (canvas) {
          const link = document.createElement('a');
          link.download = `${filename.replace(/\s/g, '_')}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      },
    }));
    
    useEffect(() => {
        // Initialize with a white background
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (canvas && context) {
            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, [canvasRef, contextRef]);

    return (
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className={cn('w-full h-full cursor-crosshair', className, { 'cursor-not-allowed': disabled })}
      />
    );
  }
);

DoodleCanvas.displayName = 'DoodleCanvas';
