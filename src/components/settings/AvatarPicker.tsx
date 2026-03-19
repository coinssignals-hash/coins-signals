import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
import cobraVenom from '@/assets/avatars/cobra-venom.png';
import gorillaFury from '@/assets/avatars/gorilla-fury.png';
import hawkPredator from '@/assets/avatars/hawk-predator.png';
import crocSavage from '@/assets/avatars/croc-savage.png';
import scorpionStrike from '@/assets/avatars/scorpion-strike.png';
import tigerRage from '@/assets/avatars/tiger-rage.png';
import mambaLethal from '@/assets/avatars/mamba-lethal.png';
import rhinoCharge from '@/assets/avatars/rhino-charge.png';
import wolverineBerserker from '@/assets/avatars/wolverine-berserker.png';
import raptorApex from '@/assets/avatars/raptor-apex.png';
import cyberWolf from '@/assets/avatars/cyber-wolf.png';
import cyberSamurai from '@/assets/avatars/cyber-samurai.png';
import cyberPhoenix from '@/assets/avatars/cyber-phoenix.png';
import cyberSkull from '@/assets/avatars/cyber-skull.png';
import cyberDragon from '@/assets/avatars/cyber-dragon.png';
import cyberPanther from '@/assets/avatars/cyber-panther.png';
import cyberHawk from '@/assets/avatars/cyber-hawk.png';
import cyberViper from '@/assets/avatars/cyber-viper.png';
import cyberBull from '@/assets/avatars/cyber-bull.png';
import cyberLion from '@/assets/avatars/cyber-lion.png';

export interface AvatarOption {
  id: string;
  src: string;
  label: string;
  category: string;
}

export const TRADING_AVATARS: AvatarOption[] = [
  { id: 'bull-trader', src: bullTrader, label: 'Toro Trader', category: 'Clásicos' },
  { id: 'bear-trader', src: bearTrader, label: 'Oso Bajista', category: 'Clásicos' },
  { id: 'wolf-forex', src: wolfForex, label: 'Lobo Forex', category: 'Clásicos' },
  { id: 'eagle-stocks', src: eagleStocks, label: 'Águila Acciones', category: 'Clásicos' },
  { id: 'shark-daytrader', src: sharkDaytrader, label: 'Tiburón Day Trader', category: 'Clásicos' },
  { id: 'fox-crypto', src: foxCrypto, label: 'Zorro Crypto', category: 'Clásicos' },
  { id: 'lion-commodities', src: lionCommodities, label: 'León Commodities', category: 'Clásicos' },
  { id: 'panther-swing', src: pantherSwing, label: 'Pantera Swing', category: 'Clásicos' },
  { id: 'dragon-futures', src: dragonFutures, label: 'Dragón Futuros', category: 'Clásicos' },
  { id: 'phoenix-resilient', src: phoenixResilient, label: 'Fénix Resiliente', category: 'Clásicos' },
  { id: 'cobra-venom', src: cobraVenom, label: 'Cobra Veneno', category: 'Agresivos' },
  { id: 'gorilla-fury', src: gorillaFury, label: 'Gorila Furia', category: 'Agresivos' },
  { id: 'hawk-predator', src: hawkPredator, label: 'Halcón Depredador', category: 'Agresivos' },
  { id: 'croc-savage', src: crocSavage, label: 'Cocodrilo Salvaje', category: 'Agresivos' },
  { id: 'scorpion-strike', src: scorpionStrike, label: 'Escorpión Letal', category: 'Agresivos' },
  { id: 'tiger-rage', src: tigerRage, label: 'Tigre Furioso', category: 'Agresivos' },
  { id: 'mamba-lethal', src: mambaLethal, label: 'Mamba Letal', category: 'Agresivos' },
  { id: 'rhino-charge', src: rhinoCharge, label: 'Rinoceronte', category: 'Agresivos' },
  { id: 'wolverine-berserker', src: wolverineBerserker, label: 'Wolverine', category: 'Agresivos' },
  { id: 'raptor-apex', src: raptorApex, label: 'Raptor Apex', category: 'Agresivos' },
  { id: 'cyber-wolf', src: cyberWolf, label: 'Lobo Cyber', category: 'Cyberpunk' },
  { id: 'cyber-samurai', src: cyberSamurai, label: 'Samurai Neon', category: 'Cyberpunk' },
  { id: 'cyber-phoenix', src: cyberPhoenix, label: 'Fénix Cyber', category: 'Cyberpunk' },
  { id: 'cyber-skull', src: cyberSkull, label: 'Cráneo Mech', category: 'Cyberpunk' },
  { id: 'cyber-dragon', src: cyberDragon, label: 'Dragón Matrix', category: 'Cyberpunk' },
  { id: 'cyber-panther', src: cyberPanther, label: 'Pantera Neon', category: 'Cyberpunk' },
  { id: 'cyber-hawk', src: cyberHawk, label: 'Halcón Cyber', category: 'Cyberpunk' },
  { id: 'cyber-viper', src: cyberViper, label: 'Víbora Tóxica', category: 'Cyberpunk' },
  { id: 'cyber-bull', src: cyberBull, label: 'Toro Mech', category: 'Cyberpunk' },
  { id: 'cyber-lion', src: cyberLion, label: 'León Holográfico', category: 'Cyberpunk' },
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

  const categories = [...new Set(TRADING_AVATARS.map(a => a.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-[hsl(210,40%,8%)] border-cyan-800/30 max-h-[80dvh]">
        <DialogHeader>
          <DialogTitle className="text-white">Elige tu avatar</DialogTitle>
          <DialogDescription className="text-slate-400">
            Selecciona un avatar con temática de trading
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55dvh] pr-2">
          {categories.map(cat => (
            <div key={cat} className="mb-3">
              <p className="text-[10px] uppercase tracking-widest text-cyan-400/60 font-semibold mb-1.5">{cat}</p>
              <div className="grid grid-cols-5 gap-2">
                {TRADING_AVATARS.filter(a => a.category === cat).map(avatar => {
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
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}