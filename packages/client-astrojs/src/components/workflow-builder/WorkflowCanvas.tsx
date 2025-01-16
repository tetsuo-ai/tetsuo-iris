import React from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Node as FlowNode,
  type Edge as FlowEdge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import DragHandleNode from "./DragHandleNode.tsx";

const nodeTypes = {
  dragHandleNode: DragHandleNode,
};

const initialNodes: FlowNode[] = [
  {
    id: '1',
    type: "dragHandleNode",
    dragHandle: ".drag-handle__custom",
    position: { x: 0, y: 0 },
    data: { label: '1' },
  },
  { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
];
const initialEdges: FlowEdge[] = [{ id: 'e1-2', source: '1', target: '2', animated: true }];

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = React.useCallback(
    (params: any) => setEdges((edge) => addEdge(params, edge)),
    [setEdges],
  );

  return (
    <div className="w-screen h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Lines} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
