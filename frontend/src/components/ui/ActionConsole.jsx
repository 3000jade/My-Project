import { useState } from 'react';

export default function ActionConsole({ logs }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen && logs.length === 0) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-[100] w-[450px] bg-zinc-950 text-emerald-400 font-mono text-xs rounded-md border border-zinc-800 shadow-2xl transition-all duration-300 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
      <div className="flex justify-between items-center bg-zinc-900 px-3 py-2 border-b border-zinc-800 rounded-t-md">
        <span className="font-bold text-zinc-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Frontend-to-Backend Console
        </span>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-3">
        {logs.length === 0 ? (
          <div className="text-zinc-600 italic">Waiting for interactions...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex flex-col gap-1 border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="text-blue-400 font-bold">[{log.method}]</span>
                <span>{log.route}</span>
                <span className="text-zinc-600 ml-auto">{log.timestamp}</span>
              </div>
              <pre className="bg-black/50 p-2 rounded mt-1 overflow-x-auto text-emerald-300">
                {JSON.stringify(log.payload, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
