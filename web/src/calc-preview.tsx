import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/dm-sans';
import '@fontsource/jetbrains-mono/500.css';
import '../src/styles/index.css';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalcPage } from '@/features/calc/CalcPage';
import { SetEditor } from '@/features/team/components/SetEditor';
import { parsePaste } from '@/lib/showdown/paste';
function Demo() {
  const [mon, setMon] = useState(parsePaste('Basculegion @ Choice Scarf\nAbility: Adaptability\nEVs: 12 HP / 14 Atk / 13 Def / 27 Spe\nJolly Nature\n- Wave Crash\n- Last Respects')[0]);
  return <div className="app"><main className="main"><CalcPage teams={[]} /><div style={{ width: 420, margin: 20 }}><SetEditor index={0} mon={mon} team={[mon]} onChange={setMon} onRemove={() => {}} /></div></main></div>;
}
createRoot(document.getElementById('root')!).render(<Demo />);
