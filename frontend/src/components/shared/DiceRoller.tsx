import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Dices, X, Trash2 } from 'lucide-react';
import { cn, rollDice } from '@/lib/utils';

interface RollResult {
  id: number;
  notation: string;
  result: number;
  rolls: number[];
  timestamp: Date;
}

export function DiceRoller() {
  const [open, setOpen] = useState(false);
  const [notation, setNotation] = useState('1d20');
  const [history, setHistory] = useState<RollResult[]>([]);
  const [lastResult, setLastResult] = useState<RollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = useCallback(() => {
    if (!notation.trim()) return;

    setIsRolling(true);
    
    // Small delay for animation effect
    setTimeout(() => {
      const result = rollDice(notation);
      const rollResult: RollResult = {
        id: Date.now(),
        notation: result.notation,
        result: result.result,
        rolls: result.rolls,
        timestamp: new Date(),
      };

      setLastResult(rollResult);
      setHistory((prev) => [rollResult, ...prev].slice(0, 10));
      setIsRolling(false);
    }, 300);
  }, [notation]);

  const clearHistory = () => {
    setHistory([]);
    setLastResult(null);
  };

  const quickRoll = (dice: string) => {
    setNotation(dice);
    const result = rollDice(dice);
    const rollResult: RollResult = {
      id: Date.now(),
      notation: result.notation,
      result: result.result,
      rolls: result.rolls,
      timestamp: new Date(),
    };
    setLastResult(rollResult);
    setHistory((prev) => [rollResult, ...prev].slice(0, 10));
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent hover:bg-accent/90 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
        title="Rolar dados"
      >
        <Dices className="w-6 h-6" />
      </button>

      {/* Drawer */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed bottom-0 right-0 w-full sm:w-96 h-[500px] bg-surface border-l border-t border-border rounded-tl-xl shadow-xl z-50 flex flex-col animate-in slide-in-from-right">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Dialog.Title className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Dices className="w-5 h-5 text-accent" />
                Rolar Dados
              </Dialog.Title>
              <Dialog.Close className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={notation}
                  onChange={(e) => setNotation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
                  placeholder="ex: 2d6+3"
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  onClick={handleRoll}
                  disabled={isRolling}
                  className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isRolling ? '...' : 'Rolar'}
                </button>
              </div>

              {/* Quick buttons */}
              <div className="flex flex-wrap gap-2">
                {['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100'].map((dice) => (
                  <button
                    key={dice}
                    onClick={() => quickRoll(dice)}
                    className="px-3 py-1 text-sm bg-background hover:bg-surface border border-border rounded-full text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {dice}
                  </button>
                ))}
              </div>

              {/* Last result */}
              {lastResult && (
                <div
                  className={cn(
                    'p-4 bg-background border border-border rounded-lg text-center transition-all',
                    isRolling && 'animate-pulse'
                  )}
                >
                  <div className="text-sm text-muted-foreground mb-1">
                    {lastResult.notation}
                  </div>
                  <div className="text-4xl font-bold text-accent">
                    {lastResult.result}
                  </div>
                  {lastResult.rolls.length > 1 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      [{lastResult.rolls.join(', ')}]
                    </div>
                  )}
                </div>
              )}

              {/* History */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Histórico</span>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Limpar histórico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma rolagem ainda
                    </p>
                  ) : (
                    history.map((roll) => (
                      <div
                        key={roll.id}
                        className="flex items-center justify-between px-3 py-2 bg-background rounded text-sm"
                      >
                        <span className="text-muted-foreground">{roll.notation}</span>
                        <span className="font-medium text-foreground">{roll.result}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
