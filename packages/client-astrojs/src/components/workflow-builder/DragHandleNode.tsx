import React from "react";
import {Handle, Position} from "@xyflow/react";

function DragHandleNode() {
  return (
    <div className="group active:shadow-lg focus-within:shadow-lg">
      <div className="drag-handle__custom h-2 w-full bg-green-400 rounded-t-md" />
      <div className="
        bg-white rounded-b-sm border-t-0 border border-zinc-300
        p-4 flex items-center text-base
        group-active:border-zinc-500 group-focus-within:border-zinc-500
      ">
        Draggable Node
      </div>
      <Handle type={"target"} position={Position.Left} />
      <Handle type={"source"} position={Position.Right} />
    </div>
  );
}

export default React.memo(DragHandleNode);
