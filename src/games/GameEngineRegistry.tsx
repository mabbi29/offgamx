import React from 'react';
import { ActiveGameContext } from '../types';

import { NeonRush2 } from './NeonRush2';
import { GoingBalls } from './GoingBalls';
import { PrismBreaker } from './PrismBreaker';
import { BlastMaster } from './BlastMaster';
import { Starforge } from './Starforge';
import { GravityShift } from './GravityShift';
import { CrystalSpire } from './CrystalSpire';
import { QuantumPulse } from './QuantumPulse';
import { ChronoPipe } from './ChronoPipe';
import { ShadowBlade } from './ShadowBlade';
import { CyberStriker } from './CyberStriker';
import { ApexHoop } from './ApexHoop';
import { CyberSmash } from './CyberSmash';
import { SolarisFarm } from './SolarisFarm';
import { AstroMiner } from './AstroMiner';
import { SkyGlider } from './SkyGlider';
import { AbyssDiver } from './AbyssDiver';
import { OrbitDash } from './OrbitDash';
import { BioHazard } from './BioHazard';
import { DungeonRaider } from './DungeonRaider';
import { Ace21 } from './Ace21';
import { CheckersClash } from './CheckersClash';
import { SudokuGrid } from './SudokuGrid';
import { BambooMatch } from './BambooMatch';
import { FreeCellPro } from './FreeCellPro';

interface GameEngineRegistryProps extends ActiveGameContext {
  slug: string;
}

export const GameEngineRegistry: React.FC<GameEngineRegistryProps> = (props) => {
  const { slug } = props;

  switch (slug) {
    case 'neon-rush-2':
      return <NeonRush2 {...props} />;
    case 'going-balls':
      return <GoingBalls {...props} />;
    case 'prism-breaker':
      return <PrismBreaker {...props} />;
    case 'blast-master':
      return <BlastMaster {...props} />;
    case 'starforge-void-striker':
      return <Starforge {...props} />;
    case 'gravity-shift':
      return <GravityShift {...props} />;
    case 'crystal-spire':
      return <CrystalSpire {...props} />;
    case 'quantum-pulse':
      return <QuantumPulse {...props} />;
    case 'chrono-pipe':
      return <ChronoPipe {...props} />;
    case 'shadow-blade':
      return <ShadowBlade {...props} />;
    case 'cyber-striker':
      return <CyberStriker {...props} />;
    case 'apex-hoop':
      return <ApexHoop {...props} />;
    case 'cyber-smash':
      return <CyberSmash {...props} />;
    case 'solaris-farm':
      return <SolarisFarm {...props} />;
    case 'astro-miner':
      return <AstroMiner {...props} />;
    case 'sky-glider':
      return <SkyGlider {...props} />;
    case 'abyss-diver':
      return <AbyssDiver {...props} />;
    case 'orbit-dash':
      return <OrbitDash {...props} />;
    case 'bio-hazard':
      return <BioHazard {...props} />;
    case 'dungeon-raider':
      return <DungeonRaider {...props} />;
    case 'ace-21':
      return <Ace21 {...props} />;
    case 'checkers-clash':
      return <CheckersClash {...props} />;
    case 'sudoku-grid-lab':
      return <SudokuGrid {...props} />;
    case 'bamboo-match':
      return <BambooMatch {...props} />;
    case 'freecell-columns-pro':
      return <FreeCellPro {...props} />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-slate-400">
          Game engine not found for {slug}.
        </div>
      );
  }
};
