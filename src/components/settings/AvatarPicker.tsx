import { useState, useEffect } from 'react';
import { Check, Lock, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAchievements } from '@/hooks/useAchievements';

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
import legendGoldenWarrior from '@/assets/avatars/legend-golden-warrior.png';
import legendObsidianDragon from '@/assets/avatars/legend-obsidian-dragon.png';
import legendCrystalPhoenix from '@/assets/avatars/legend-crystal-phoenix.png';
import legendCelestialTiger from '@/assets/avatars/legend-celestial-tiger.png';
import legendDiamondBull from '@/assets/avatars/legend-diamond-bull.png';
import legendShadowNinja from '@/assets/avatars/legend-shadow-ninja.png';
import legendAnubisGod from '@/assets/avatars/legend-anubis-god.png';
import legendFrostWolf from '@/assets/avatars/legend-frost-wolf.png';
import legendInfernalKing from '@/assets/avatars/legend-infernal-king.png';
import legendVoidEntity from '@/assets/avatars/legend-void-entity.png';

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
  // 🏆 Legendarios - desbloqueables por logros
  { id: 'legend-frost-wolf', src: legendFrostWolf, label: 'Lobo Ártico', category: 'Legendarios 🏆' },
  { id: 'legend-shadow-ninja', src: legendShadowNinja, label: 'Ninja Sombra', category: 'Legendarios 🏆' },
  { id: 'legend-anubis-god', src: legendAnubisGod, label: 'Anubis', category: 'Legendarios 🏆' },
  { id: 'legend-golden-warrior', src: legendGoldenWarrior, label: 'Guerrero Dorado', category: 'Legendarios 🏆' },
  { id: 'legend-crystal-phoenix', src: legendCrystalPhoenix, label: 'Fénix Cristal', category: 'Legendarios 🏆' },
  { id: 'legend-diamond-bull', src: legendDiamondBull, label: 'Toro Diamante', category: 'Legendarios 🏆' },
  { id: 'legend-infernal-king', src: legendInfernalKing, label: 'Rey Infernal', category: 'Legendarios 🏆' },
  { id: 'legend-celestial-tiger', src: legendCelestialTiger, label: 'Tigre Celestial', category: 'Legendarios 🏆' },
  { id: 'legend-obsidian-dragon', src: legendObsidianDragon, label: 'Dragón Obsidiana', category: 'Legendarios 🏆' },
  { id: 'legend-void-entity', src: legendVoidEntity, label: 'Entidad Cósmica', category: 'Legendarios 🏆' },
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
  const {
    unlockedAvatarIds,
    getAchievementForAvatar,
    getProgress,
    checkAndUnlockAchievements,
  } = useAchievements();

  useEffect(() => {
    if (open) {
      checkAndUnlockAchievements();
    }
  }, [open]);

  const handleSelect = (avatar: AvatarOption) => {
    const isLegendary = avatar.category === 'Legendarios 🏆';
    if (isLegendary && !unlockedAvatarIds.has(avatar.id)) return;
    setSelected(avatar.id);
    onSelect(avatar);
  };

  const categories = [...new Set(TRADING_AVATARS.map(a => a.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-[hsl(210,40%,8%)] border-cyan-800/30 max-h-[80dvh]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Elige tu avatar</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Selecciona un avatar · Los <Trophy className="inline w-3 h-3 text-amber-400" /> se desbloquean con logros
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55dvh] pr-2">
          <TooltipProvider delayDuration={200}>
            {categories.map(cat => {
              const isLegendary = cat === 'Legendarios 🏆';
              return (
                <div key={cat} className="mb-3">
                  <p className={cn(
                    'text-[10px] uppercase tracking-widest font-semibold mb-1.5',
                    isLegendary ? 'text-amber-400/80' : 'text-cyan-400/60'
                  )}>
                    {cat}
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {TRADING_AVATARS.filter(a => a.category === cat).map(avatar => {
                      const isSelected = selected === avatar.id ||
                        (!selected && currentAvatarUrl?.includes(avatar.id));
                      const achievement = isLegendary ? getAchievementForAvatar(avatar.id) : null;
                      const isUnlocked = !isLegendary || unlockedAvatarIds.has(avatar.id);
                      const progress = achievement ? getProgress(achievement) : 0;

                      const button = (
                        <button
                          key={avatar.id}
                          onClick={() => handleSelect(avatar)}
                          disabled={loading || !isUnlocked}
                          className={cn(
                            'relative rounded-xl p-1 transition-all',
                            isUnlocked && 'hover:scale-105 active:scale-95',
                            isSelected
                              ? isLegendary
                                ? 'ring-2 ring-amber-400 bg-amber-500/15'
                                : 'ring-2 ring-cyan-400 bg-cyan-500/15'
                              : isUnlocked
                                ? isLegendary
                                  ? 'ring-1 ring-amber-700/30 hover:ring-amber-500/50 bg-[hsl(210,30%,10%)]'
                                  : 'ring-1 ring-cyan-800/20 hover:ring-cyan-600/40 bg-[hsl(210,30%,10%)]'
                                : 'ring-1 ring-slate-700/30 bg-[hsl(210,20%,8%)] cursor-not-allowed'
                          )}
                        >
                          <div className="relative">
                            <img
                              src={avatar.src}
                              alt={avatar.label}
                              className={cn(
                                'w-full aspect-square object-contain rounded-lg',
                                !isUnlocked && 'grayscale opacity-30 blur-[1px]'
                              )}
                            />
                            {!isUnlocked && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                                <Lock className="w-4 h-4 text-slate-400" />
                                <div className="w-3/4">
                                  <Progress value={progress * 100} className="h-1 bg-slate-700" />
                                </div>
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div className={cn(
                              'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center',
                              isLegendary ? 'bg-amber-500' : 'bg-cyan-500'
                            )}>
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                          <p className={cn(
                            'text-[8px] text-center mt-0.5 truncate leading-tight',
                            isUnlocked
                              ? isLegendary ? 'text-amber-300/80' : 'text-slate-400'
                              : 'text-slate-600'
                          )}>
                            {avatar.label}
                          </p>
                        </button>
                      );

                      if (isLegendary && achievement) {
                        return (
                          <Tooltip key={avatar.id}>
                            <TooltipTrigger asChild>
                              {button}
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="bg-[hsl(210,40%,10%)] border-slate-700 text-xs max-w-[160px]"
                            >
                              <p className="font-semibold text-amber-400">
                                {achievement.icon} {achievement.name}
                              </p>
                              <p className="text-slate-400 text-[10px]">
                                {achievement.description}
                              </p>
                              {!isUnlocked && (
                                <p className="text-[10px] text-cyan-400 mt-0.5">
                                  Progreso: {Math.round(progress * 100)}%
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return button;
                    })}
                  </div>
                </div>
              );
            })}
          </TooltipProvider>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
