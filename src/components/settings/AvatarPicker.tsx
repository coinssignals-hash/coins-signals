import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

import bullTrader from '@/assets/avatars/bull-trader.png';
import bearTrader from '@/assets/avatars/bear-trader.png';
import wolfForex from '@/assets/avatars/wolf-forex.png';
import eagleStocks from '@/assets/avatars/eagle-stocks.png';
import sharkDaytrader from '@/assets/avatars/shark-daytrader.png';
import foxCrypto from '@/assets/avatars/fox-crypto.png';
import lionCommodities from '@/assets/avatars/lion-commodities.png';
import pantherSwing from '@/assets/avatars/panther-swing.png';
import dragonFutures from '@/assets/avatars/dragon-futures.png';
import phoenixResilient from '@/assets/avatars/phoenix-resilient.png';

export interface AvatarOption {
  id: string;
  src: string;
  label: string;
  category: string;
}

export const TRADING_AVATARS: AvatarOption[] = [
  { id: 'bull-trader', src: bullTrader, label: 'Toro Trader', category: 'Mercados' },
  { id: 'bear-trader', src: bearTrader, label: 'Oso Bajista', category: 'Mercados' },
  { id: 'wolf-forex', src: wolfForex, label: 'Lobo Forex', category: 'Divisas' },
  { id: 'eagle-stocks', src: eagleStocks, label: 'Águila Acciones', category: 'Acciones' },
  { id: 'shark-daytrader', src: sharkDaytrader, label: 'Tiburón Day Trader', category: 'Trading' },
  { id: 'fox-crypto', src: foxCrypto, label: 'Zorro Crypto', category: 'Crypto' },
  { id: 'lion-commodities', src: lionCommodities, label: 'León Commodities', category: 'Commodities' },
  { id: 'panther-swing', src: pantherSwing, label: 'Pantera Swing', category: 'Trading' },
  { id: 'dragon-futures', src: dragonFutures, label: 'Dragón Futuros', category: 'Futuros' },
  { id: 'phoenix-resilient', src: phoenixResilient, label: 'Fénix Resiliente', category: 'Trading' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string | null;
  onSelect: (avatar: AvatarOption) => void;
  loading?: boolean;
}

export function AvatarPicker({ open, onOpenChange, currentAvatarUrl, onSelect, loading }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (avatar: AvatarOption) => {
    setSelected(avatar.id);
    onSelect(avatar);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-[hsl(210,40%,8%)] border-cyan-800/30">
        <DialogHeader>
          <DialogTitle className="text-white">Elige tu avatar</DialogTitle>
          <DialogDescription className="text-slate-400">
            Selecciona un avatar con temática de trading
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-2 pt-2">
          {TRADING_AVATARS.map(avatar => {
            const isSelected = selected === avatar.id ||
              (!selected && currentAvatarUrl?.includes(avatar.id));

            return (
              <button
                key={avatar.id}
                onClick={() => handleSelect(avatar)}
                disabled={loading}
                className={cn(
                  'relative rounded-xl p-1 transition-all hover:scale-105 active:scale-95',
                  isSelected
                    ? 'ring-2 ring-cyan-400 bg-cyan-500/15'
                    : 'ring-1 ring-cyan-800/20 hover:ring-cyan-600/40 bg-[hsl(210,30%,10%)]'
                )}
              >
                <img
                  src={avatar.src}
                  alt={avatar.label}
                  className="w-full aspect-square object-contain rounded-lg"
                />
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <p className="text-[8px] text-center text-slate-400 mt-0.5 truncate leading-tight">
                  {avatar.label}
                </p>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
