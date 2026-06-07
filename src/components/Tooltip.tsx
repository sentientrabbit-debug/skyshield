import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface TooltipData { title: string; body: ReactNode; }

interface TooltipCtx {
  bind: (title: string, body: ReactNode) => {
    onMouseEnter: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
  };
}

const noop = {
  onMouseEnter: () => {},
  onMouseMove: () => {},
  onMouseLeave: () => {},
};

const Ctx = createContext<TooltipCtx>({ bind: () => noop });

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TooltipData | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const bind = useCallback(
    (title: string, body: ReactNode) => ({
      onMouseEnter: (e: React.MouseEvent) => {
        setData({ title, body });
        setPos({ x: e.clientX, y: e.clientY });
      },
      onMouseMove: (e: React.MouseEvent) => setPos({ x: e.clientX, y: e.clientY }),
      onMouseLeave: () => setData(null),
    }),
    []
  );

  return (
    <Ctx.Provider value={{ bind }}>
      {children}
      {data && (
        <div
          className="tt"
          style={{
            left: Math.min(pos.x + 14, window.innerWidth - 280),
            top: Math.min(pos.y + 14, window.innerHeight - 140),
          }}
        >
          <h4>{data.title}</h4>
          <div className="muted">{data.body}</div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useTooltip() {
  return useContext(Ctx);
}
