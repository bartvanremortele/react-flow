import React, { useMemo, CSSProperties, HTMLAttributes } from 'react';
import cx from 'classnames';
import { TransformWrapper } from 'react-zoom-pan-pinch';
import { useStoreState } from '../../store/hooks';

const nodeEnv: string = process.env.NODE_ENV as string;

if (nodeEnv !== 'production') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React);
}

import GraphView from '../GraphView';
import DefaultNode from '../../components/Nodes/DefaultNode';
import InputNode from '../../components/Nodes/InputNode';
import OutputNode from '../../components/Nodes/OutputNode';
import { createNodeTypes } from '../NodeRenderer/utils';
import SelectionListener from '../../components/SelectionListener';
import BezierEdge from '../../components/Edges/BezierEdge';
import StraightEdge from '../../components/Edges/StraightEdge';
import StepEdge from '../../components/Edges/StepEdge';
import { createEdgeTypes } from '../EdgeRenderer/utils';
import Wrapper from './Wrapper';
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

import '../../style.css';

export interface ReactFlowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onLoad'> {
  elements: Elements;
  onElementClick?: (element: Node | Edge) => void;
  onElementsRemove?: (elements: Elements) => void;
  onNodeDragStart?: (node: Node) => void;
  onNodeDragStop?: (node: Node) => void;
  onConnect?: (connection: Edge | Connection) => void;
  onLoad?: OnLoadFunc;
  onMove?: () => void;
  onSelectionChange?: (elements: Elements | null) => void;
  nodeTypes: NodeTypesType;
  edgeTypes: EdgeTypesType;
  connectionLineType: ConnectionLineType;
  connectionLineStyle?: CSSProperties;
  deleteKeyCode: number;
  selectionKeyCode: number;
  snapToGrid: boolean;
  snapGrid: [number, number];
  onlyRenderVisibleNodes: boolean;
  isInteractive: boolean;
  selectNodesOnDrag: boolean;
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
}

const ReactFlow = ({
  style,
  onElementClick,
  elements = [],
  className,
  children,
  nodeTypes,
  edgeTypes,
  onLoad,
  onMove,
  onElementsRemove,
  onConnect,
  onNodeDragStart,
  onNodeDragStop,
  onSelectionChange,
  connectionLineType,
  connectionLineStyle,
  deleteKeyCode,
  selectionKeyCode,
  snapToGrid,
  snapGrid,
  onlyRenderVisibleNodes,
  isInteractive,
  selectNodesOnDrag,
  minZoom,
  maxZoom,
  defaultZoom,
}: ReactFlowProps) => {
  const isDragging = useStoreState((s) => s.isDragging);
  const nodeTypesParsed = useMemo(() => createNodeTypes(nodeTypes), []);
  const edgeTypesParsed = useMemo(() => createEdgeTypes(edgeTypes), []);

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

  return (
    <div style={style} className={cx('react-flow', className)}>
      <Wrapper>
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
          <GraphView
            onLoad={onLoad}
            onMove={onMove}
            onElementClick={onElementClick}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypesParsed}
            edgeTypes={edgeTypesParsed}
            connectionLineType={connectionLineType}
            connectionLineStyle={connectionLineStyle}
            selectionKeyCode={selectionKeyCode}
            onElementsRemove={onElementsRemove}
            deleteKeyCode={deleteKeyCode}
            elements={elements}
            onConnect={onConnect}
            snapToGrid={snapToGrid}
            snapGrid={snapGrid}
            onlyRenderVisibleNodes={onlyRenderVisibleNodes}
            isInteractive={isInteractive}
            selectNodesOnDrag={selectNodesOnDrag}
            minZoom={minZoom}
            maxZoom={maxZoom}
            defaultZoom={defaultZoom}
          />
          {onSelectionChange && <SelectionListener onSelectionChange={onSelectionChange} />}
          {children}
        </TransformWrapper>
      </Wrapper>
    </div>
  );
};

ReactFlow.displayName = 'ReactFlow';

ReactFlow.defaultProps = {
  nodeTypes: {
    input: InputNode,
    default: DefaultNode,
    output: OutputNode,
  },
  edgeTypes: {
    default: BezierEdge,
    straight: StraightEdge,
    step: StepEdge,
  },
  connectionLineType: ConnectionLineType.Bezier,
  deleteKeyCode: 8,
  selectionKeyCode: 16,
  snapToGrid: false,
  snapGrid: [16, 16],
  onlyRenderVisibleNodes: true,
  isInteractive: true,
  selectNodesOnDrag: true,
  minZoom: 0.5,
  maxZoom: 2,
  defaultZoom: 1,
};

export default ReactFlow;
