"use client";
import { Handle, Position } from "@xyflow/react";

const handleStyle = "!w-[7px] !h-[7px] !rounded-full !bg-[#666] !border-[2px] !border-[var(--card)]";

export default function NodeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <Handle type="source" position={Position.Top} id="top" className={handleStyle} />
      <Handle type="source" position={Position.Left} id="left" className={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={handleStyle} />
      <Handle type="source" position={Position.Right} id="right" className={handleStyle} />
      <Handle type="target" position={Position.Top} id="top-t" className={`${handleStyle} !opacity-0`} />
      <Handle type="target" position={Position.Left} id="left-t" className={`${handleStyle} !opacity-0`} />
      <Handle type="target" position={Position.Bottom} id="bottom-t" className={`${handleStyle} !opacity-0`} />
      <Handle type="target" position={Position.Right} id="right-t" className={`${handleStyle} !opacity-0`} />
      {children}
    </div>
  );
}
