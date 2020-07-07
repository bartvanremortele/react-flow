import { useCallback, useEffect, useRef } from 'react';
import * as _ from './utils';

import useGetSet from './useGetSet';
import useForceUpdate from './useForceUpdate';

interface Position {
  x: number;
  y: number;
}

interface panZoomParams {
  enablePan?: boolean;
  enableZoom?: boolean;
  requireCtrlToZoom?: boolean;
  panOnDrag?: boolean;
  preventClickOnPan?: boolean;
  zoomSensitivity?: number;
  scrollPanSensitivity?: number;
  minZoom?: number;
  maxZoom?: number;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  initialZoom?: number;
  initialPan?: Position;
  onPanStart?: Function;
  onPan?: Function;
  onPanEnd?: Function;
  onZoom?: Function;
}

const usePanZoom = ({
  enablePan = true,
  enableZoom = true,
  requireCtrlToZoom = false,
  panOnDrag = true,
  preventClickOnPan = true,
  zoomSensitivity = 0.01,
  scrollPanSensitivity = 1,
  minZoom = 0,
  maxZoom = Infinity,
  minX = -Infinity,
  maxX = Infinity,
  minY = -Infinity,
  maxY = Infinity,
  initialZoom = 1,
  initialPan = { x: 0, y: 0 },
  onPanStart = _.noop,
  onPan = _.noop,
  onPanEnd = _.noop,
  onZoom = _.noop,
}: panZoomParams) => {
  const container = useRef<HTMLDivElement | null>(null);
  const forceUpdate = useForceUpdate();
  const wasPanning = useRef(false);
  const prev = useRef<any[]>([]);
  const prevZoom = useRef(1);
  const [getCenter, setCenter] = useGetSet({ top: 0, left: 0 });

  const [isPanning, setPanning] = useGetSet(false);
  const [getTransform, _setTransform] = useGetSet({
    ...initialPan,
    zoom: initialZoom,
  });

  const clampX = useCallback(_.clamp(minX, maxX), [minX, maxX]);
  const clampY = useCallback(_.clamp(minY, maxY), [minY, maxY]);
  const clampZoom = useCallback(_.clamp(minZoom, maxZoom), [minZoom, maxZoom]);

  const setTransform = useCallback((v) => {
    const r = _setTransform(v);
    const { x, y, zoom } = getTransform();
    setCenter({
      top: ((container?.current?.offsetHeight || 0) / 2 - y) / zoom,
      left: ((container?.current?.offsetWidth || 0) / 2 - x) / zoom,
    });
    forceUpdate();
    return r;
  }, []);

  const setPan = useCallback(
    (f) =>
      setTransform(({ x, y, zoom }: any) => {
        const newPan = typeof f === 'function' ? f({ x, y }) : f;

        return {
          x: clampX(newPan.x),
          y: clampY(newPan.y),
          zoom,
        };
      }),
    [minX, maxX, minY, maxY]
  );

  const setZoom = useCallback(
    (f, maybeCenter) =>
      setTransform(({ x, y, zoom }: any) => {
        const newZoom = clampZoom(typeof f === 'function' ? f(zoom) : f);

        const center = _.maybe(
          () => ({
            x: (container?.current?.offsetWidth || 0) / 2,
            y: (container?.current?.offsetHeight || 0) / 2,
          }),
          _.identity
        )(maybeCenter);

        return {
          x: clampX(x + ((center.x - x) * (zoom - newZoom)) / zoom),
          y: clampY(y + ((center.y - y) * (zoom - newZoom)) / zoom),
          zoom: newZoom,
        };
      }),
    [minX, maxX, minY, maxY, minZoom, maxZoom]
  );

  const startPanZoom = useCallback(
    (pointers) => {
      if (enablePan) {
        prev.current = pointers;

        setPanning(true);

        onPanStart(pointers);
      }
    },
    [enablePan, onPanStart]
  );

  const movePanZoom = useCallback(
    (pointers) => {
      if (isPanning()) {
        wasPanning.current = true;

        const prevPointers = prev.current;
        prev.current = pointers;

        setPan(({ x, y }: Position) => {
          let dx = 0,
            dy = 0;
          const l = Math.min(pointers.length, prevPointers.length);

          for (let i = 0; i < l; i++) {
            dx += pointers[i].x - prevPointers[i].x;
            dy += pointers[i].y - prevPointers[i].y;
          }

          return {
            x: x + dx / l,
            y: y + dy / l,
          };
        });

        onPan(pointers);
      }
    },
    [isPanning, onPan, minX, maxX, minY, maxY]
  );

  const endPanZoom = useCallback(() => {
    if (isPanning()) {
      setPanning(false);
      onPanEnd();
    }
  }, [onPanEnd]);

  const onClickCapture = useCallback(
    (event) => {
      if (preventClickOnPan && wasPanning.current) {
        wasPanning.current = false;
        event.stopPropagation();
      }
    },
    [preventClickOnPan]
  );

  const onWheel = useCallback(
    (event) => {
      if (enableZoom && container.current) {
        event.preventDefault();
        if (!requireCtrlToZoom || event.ctrlKey) {
          const { pageX, pageY, deltaY } = event;
          const pointerPosition = _.getPositionOnElement(container.current)(pageX, pageY);

          setZoom((zoom: number) => zoom * Math.pow(1 - zoomSensitivity, deltaY), pointerPosition);

          onZoom();
        } else {
          const { deltaX, deltaY } = event;
          setPan(({ x, y }: Position) => ({
            x: x - deltaX,
            y: y - deltaY,
          }));
        }
      }
    },
    [enableZoom, onZoom, minX, maxX, minY, maxY, minZoom, maxZoom, scrollPanSensitivity, setPan]
  );

  const onGestureStart = useCallback((event) => {
    event.preventDefault();
    prevZoom.current = getTransform().zoom;
  }, []);

  const onGesture = useCallback((event) => {
    event.preventDefault();

    const { pageX, pageY, scale } = event;
    const pointerPosition = _.getPositionOnElement(container.current)(pageX, pageY);

    setZoom(prevZoom.current * scale, pointerPosition);

    onZoom();
  }, []);

  const setContainer = useCallback((el: HTMLDivElement | null): Function | void => {
    if (el) {
      el!.addEventListener('wheel', onWheel);
      el!.addEventListener('gesturestart', onGestureStart);
      el!.addEventListener('gesturechange', onGesture);
      el!.addEventListener('gestureend', onGesture);
    } else if (container.current) {
      return () => {
        container?.current?.removeEventListener('wheel', onWheel);
        container?.current?.removeEventListener('gesturestart', onGestureStart);
        container?.current?.removeEventListener('gesturechange', onGesture);
        container?.current?.removeEventListener('gestureend', onGesture);
      };
    }
    container!.current = el;
  }, []);

  useEffect(() => {
    if (container.current) {
      container.current.addEventListener('wheel', onWheel);
      container.current.addEventListener('gesturestart', onGestureStart);
      container.current.addEventListener('gesturechange', onGesture);
      container.current.addEventListener('gestureend', onGesture);
      return () => {
        container!.current!.removeEventListener('wheel', onWheel);
        container!.current!.removeEventListener('gesturestart', onGestureStart);
        container!.current!.removeEventListener('gesturechange', onGesture);
        container!.current!.removeEventListener('gestureend', onGesture);
      };
    }

    return;
  }, []);

  const onTouchStart = ({ touches }: any) =>
    startPanZoom([...touches].map(({ pageX, pageY }) => ({ x: pageX, y: pageY })));
  const onTouchMove = ({ touches }: any) =>
    movePanZoom([...touches].map(({ pageX, pageY }) => ({ x: pageX, y: pageY })));
  const onTouchEnd = () => endPanZoom();
  const onTouchCancel = () => endPanZoom();
  const onMouseDown = ({ pageX, pageY }: any) => startPanZoom([{ x: pageX, y: pageY }]);
  const onMouseMove = ({ pageX, pageY }: any) => movePanZoom([{ x: pageX, y: pageY }]);
  const onMouseUp = () => endPanZoom();
  const onMouseLeave = () => endPanZoom();

  const transform = getTransform();
  return {
    container,
    setContainer,
    transform,
    transformStyle: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
    center: getCenter(),
    pan: { x: transform.x, y: transform.y },
    zoom: transform.zoom,
    setPan,
    setZoom,
    panZoomHandlers: panOnDrag
      ? {
          onTouchStart,
          onTouchMove,
          onTouchEnd,
          onTouchCancel,
          onMouseDown,
          onMouseMove,
          onMouseUp,
          onMouseLeave,
          onClickCapture,
        }
      : {},
  };
};

export default usePanZoom;
