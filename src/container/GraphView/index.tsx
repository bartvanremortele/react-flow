import React, { useEffect, useRef, memo, CSSProperties } from 'react';
import classnames from 'classnames';
import { ResizeObserver } from 'resize-observer';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

import { useStoreState, useStoreActions } from '../../store/hooks';
import NodeRenderer from '../NodeRenderer';
import EdgeRenderer from '../EdgeRenderer';
import UserSelection from '../../components/UserSelection';
import NodesSelection from '../../components/NodesSelection';
import useKeyPress from '../../hooks/useKeyPress';
// import useD3Zoom from '../../hooks/useD3Zoom';
import useGlobalKeyHandler from '../../hooks/useGlobalKeyHandler';
import useElementUpdater from '../../hooks/useElementUpdater';
import { getDimensions } from '../../utils';
// import { project, getElements } from '../../utils/graph';
import {
  Elements,
  NodeTypesType,
  EdgeTypesType,
  OnLoadFunc,
  Node,
  Edge,
  Connection,
  ConnectionLineType,
} from '../../types';

export interface GraphViewProps {
  elements: Elements;
  onElementClick?: (element: Node | Edge) => void;
  onElementsRemove?: (elements: Elements) => void;
  onNodeDragStart?: (node: Node) => void;
  onNodeDragStop?: (node: Node) => void;
  onConnect?: (connection: Connection | Edge) => void;
  onLoad?: OnLoadFunc;
  onMove?: () => void;
  selectionKeyCode: number;
  nodeTypes: NodeTypesType;
  edgeTypes: EdgeTypesType;
  connectionLineType: ConnectionLineType;
  connectionLineStyle?: CSSProperties;
  deleteKeyCode: number;
  snapToGrid: boolean;
  snapGrid: [number, number];
  onlyRenderVisibleNodes: boolean;
  isInteractive: boolean;
  selectNodesOnDrag: boolean;
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
}

const GraphView = memo(
  ({
    nodeTypes,
    edgeTypes,
    // onMove,
    // onLoad,
    onElementClick,
    onNodeDragStart,
    onNodeDragStop,
    connectionLineType,
    connectionLineStyle,
    selectionKeyCode,
    onElementsRemove,
    deleteKeyCode,
    elements,
    onConnect,
    snapToGrid,
    snapGrid,
    onlyRenderVisibleNodes,
    isInteractive,
    selectNodesOnDrag,
    minZoom,
    maxZoom,
    defaultZoom,
  }: GraphViewProps) => {
    // const zoomPane = useRef<HTMLDivElement>(null);

    const rendererNode = useRef<HTMLDivElement>(null);
    const width = useStoreState((s) => s.width);
    const height = useStoreState((s) => s.height);
    // const d3Initialised = useStoreState((s) => s.d3Initialised);
    const nodesSelectionActive = useStoreState((s) => s.nodesSelectionActive);
    const isDragging = useStoreState((s) => s.isDragging);
    const updateSize = useStoreActions((actions) => actions.updateSize);
    // const setNodesSelection = useStoreActions((actions) => actions.setNodesSelection);
    const setOnConnect = useStoreActions((a) => a.setOnConnect);
    const setSnapGrid = useStoreActions((actions) => actions.setSnapGrid);
    const setInteractive = useStoreActions((actions) => actions.setInteractive);
    const updateTransform = useStoreActions((actions) => actions.updateTransform);
    const setMinMaxZoom = useStoreActions((actions) => actions.setMinMaxZoom);
    // const fitView = useStoreActions((actions) => actions.fitView);
    // const zoom = useStoreActions((actions) => actions.zoom);

    const selectionKeyPressed = useKeyPress(selectionKeyCode);
    const rendererClasses = classnames('react-flow__renderer', { 'is-interactive': isInteractive });

    // const onZoomPaneClick = () => setNodesSelection({ isActive: false });

    const updateDimensions = () => {
      if (!rendererNode.current) {
        return;
      }

      const size = getDimensions(rendererNode.current);

      if (size.height === 0 || size.width === 0) {
        throw new Error('The React Flow parent container needs a width and a height to render the graph.');
      }

      updateSize(size);
    };

    useEffect(() => {
      let resizeObserver: ResizeObserver;

      updateDimensions();
      window.onresize = updateDimensions;

      if (onConnect) {
        setOnConnect(onConnect);
      }

      if (defaultZoom !== 1) {
        updateTransform({ x: 0, y: 0, k: defaultZoom });
      }

      if (rendererNode.current) {
        resizeObserver = new ResizeObserver((entries) => {
          for (let _ of entries) {
            updateDimensions();
          }
        });

        resizeObserver.observe(rendererNode.current);
      }

      return () => {
        window.onresize = null;

        if (resizeObserver && rendererNode.current) {
          resizeObserver.unobserve(rendererNode.current!);
        }
      };
    }, []);

    // useD3Zoom({ zoomPane, onMove, selectionKeyPressed });

    // useEffect(() => {
    //   if (d3Initialised && onLoad) {
    //     onLoad({
    //       fitView: (params = { padding: 0.1 }) => fitView(params),
    //       zoomIn: () => zoom(0.2),
    //       zoomOut: () => zoom(-0.2),
    //       project,
    //       getElements,
    //     });
    //   }
    // }, [d3Initialised, onLoad]);

    useEffect(() => {
      setSnapGrid({ snapToGrid, snapGrid });
    }, [snapToGrid]);

    useEffect(() => {
      setInteractive(isInteractive);
    }, [isInteractive]);

    useEffect(() => {
      setMinMaxZoom({ minZoom, maxZoom });
    }, [minZoom, maxZoom]);

    useGlobalKeyHandler({ onElementsRemove, deleteKeyCode });
    useElementUpdater(elements);

    const t = {
      type: true,
      limitToBounds: false,
      panningEnabled: true,
      transformEnabled: true,
      pinchEnabled: true,
      limitToWrapper: false,
      disabled: false,
      dbClickEnabled: true,
      lockAxisX: false,
      lockAxisY: false,
      velocityEqualToMove: true,
      enableWheel: true,
      enableTouchPadPinch: true,
      enableVelocity: true,
      limitsOnWheel: false,
    };

    console.log('isPanningEnabled', !isDragging);

    return (
      <div className={rendererClasses} ref={rendererNode}>
        <TransformWrapper
          options={{
            minScale: 0.5,
            transformEnabled: t.transformEnabled,
            disabled: t.disabled,
            limitToWrapper: t.limitToWrapper,
            limitToBounds: t.limitToBounds,
            centerContent: true,
          }}
          pan={{
            disabled: isDragging,
            velocityEqualToMove: t.velocityEqualToMove,
            velocity: t.enableVelocity,
          }}
          pinch={{ disabled: !t.pinchEnabled }}
          doubleClick={{ disabled: !t.dbClickEnabled }}
          wheel={{
            wheelEnabled: t.enableWheel,
            touchPadEnabled: t.enableTouchPadPinch,
            step: 50,
            limitsOnWheel: t.limitsOnWheel,
          }}
        >
          <TransformComponent>
            <NodeRenderer
              nodeTypes={nodeTypes}
              onElementClick={onElementClick}
              onNodeDragStop={onNodeDragStop}
              onNodeDragStart={onNodeDragStart}
              onlyRenderVisibleNodes={onlyRenderVisibleNodes}
              selectNodesOnDrag={selectNodesOnDrag}
            />
            <EdgeRenderer
              width={width}
              height={height}
              edgeTypes={edgeTypes}
              onElementClick={onElementClick}
              connectionLineType={connectionLineType}
              connectionLineStyle={connectionLineStyle}
            />
          </TransformComponent>
        </TransformWrapper>
        <UserSelection selectionKeyPressed={selectionKeyPressed} isInteractive={isInteractive} />
        {nodesSelectionActive && <NodesSelection />}
        {/* <div className="react-flow__zoompane" onClick={onZoomPaneClick} ref={zoomPane} /> */}
      </div>
    );
  }
);

GraphView.displayName = 'GraphView';

export default GraphView;
