import { Bean, Bird as BirdIcon, Fence as FenceIcon, Fish, Flame, Frame, House, Images, Leaf, Armchair, Bird, Citrus, Droplets, Flower, Flower2, Footprints, Grape, Lamp, LampWallDown, Lock, Moon, Sparkle, Sparkles, Sprout, TreeDeciduous, TreePalm, TreePine, Waves, X, Grid3x3, Sofa, Coffee, Landmark, Sailboat, Tent, Cherry, Feather, Columns3, Sun, Gem, ShoppingBasket, Trees, Droplet, Rose, Amphora, LampCeiling, Mountain, Ship, Wheat, Shell, Fan, Landmark as Gate, Bean as Seed, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BiomeId, DhikrPreset } from '../../../domain/types';
import { DayCalendar } from './GardenChapters';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { formatDays } from '../../streak/format';
import { flowerCount, nextMilestone, nextUnlock, ORCHARD, PLANTS_MAX, treeStage, unlocksFor, type OrchardId, type UnlockId } from './growth';

const ICONS: Record<UnlockId, LucideIcon> = {
  firstBloom: Flower2, path: Footprints, lavender: Sprout, fountain: Droplets, butterflies: Sparkle, pomegranate: TreeDeciduous,
  lantern: Lamp, lemons: Citrus, pool: Waves, bench: Armchair, palm: TreePalm, songbirds: Bird, lanternString: LampWallDown,
  cypresses: TreePine, roses: Flower, vine: Grape, fireflies: Sparkles, shootingStars: Moon, goldArch: Sparkles,
  steppingStones: Footprints, lemongrass: Leaf, wakaf: House, banana: Bean, doveCage: BirdIcon, rambutan: TreeDeciduous, lotusPond: Fish,
  pangkin: Armchair, coconut: TreePalm, pelitaRow: Flame, bamboo: FenceIcon, bougainvillea: Flower, orchids: Flower2, goldFrame: Frame,
  inlaidFloor: Grid3x3, jasmine: Flower2, bahra: Droplets, citrusPots: Citrus, brassLantern: LampCeiling, damaskRoses: Rose, iwanCushions: Sofa,
  mashrabiya: Columns3, grapeArbor: Grape, qamariyya: Sun, doves: BirdIcon, teaTray: Coffee, apricot: Cherry, goldLintel: Frame,
  channels: Waves, mint: Leaf, well: Droplet, youngPalms: TreePalm, fanous: Lamp, camel: Tent, arish: Tent, dallah: Coffee, medinaDoves: BirdIcon,
  wallLamps: Flame, dateBaskets: ShoppingBasket, taifRoses: Rose, grove: Trees, goldPosts: Frame,
  boxHedges: FenceIcon, hyacinths: Sprout, cesme: Droplets, kiosk: Landmark, caiques: Sailboat, carnations: Amphora, havuz: Waves, divan: Sofa,
  cypressRow: TreePine, tulipLamps: Flame, storks: Feather, ottomanRoses: Rose, erguvan: Gem, goldTiles: Frame,
  hexPavers: Footprints, peonies: Flower, koiPond: Fish, taihuRocks: Mountain, redLanterns: Lamp, zigzagBridge: Waves, stele: Landmark, pailou: Gate,
  xianBamboo: FenceIcon, cranes: BirdIcon, tingPavilion: Tent, pondLotus: Flower2, wisteria: Grape, goldMoonGate: Frame,
  channelWater: Waves, fountainJets: Droplets, cypressAvenue: TreePine, chhatri: Landmark, diyas: Flame, peacock: Feather, lotusBasin: Flower2,
  marbleBench: Armchair, parakeets: BirdIcon, jaali: Grid3x3, roseParterre: Rose, reflection: Sun, champa: Flower, goldPietra: Frame,
  ariq: Waves, roseRows: Rose, tapchan: Sofa, choynak: Coffee, suzani: Fan, grapeTrellis: Grape, melons: Seed, anor: Cherry, hoopoe: BirdIcon,
  uzbekLanterns: LampCeiling, mulberry: TreeDeciduous, ceramics: Amphora, illumination: Sparkles, goldMajolica: Frame,
  canari: Amphora, bissap: Flower, granary: House, acacia: TreeDeciduous, calabash: Shell, pirogue: Ship, weaverNests: BirdIcon, millet: Wheat,
  bogolan: Grid3x3, sahelLamps: Flame, sahelMango: TreeDeciduous, guineaFowl: BirdIcon, waterLilies: Flower2, goldPinnacles: Frame
};

/** Everything the garden holds and everything still to come: the collection that brings people back. */
export function GardenJournal({ tended, full, biome, orchard, presets, keptDays, gardens, onClose, onSelect, onFlower, onGallery }: {
  tended: number; full: number; biome: BiomeId;
  orchard: Record<OrchardId, { phrase: string; reps: number; plants: number; next: number | null }>;
  presets: DhikrPreset[];
  /** Every tended day, ever, each opening its memory. */
  keptDays: Set<string>;
  /** Gardens kept so far, the current one included. */
  gardens: number;
  onClose: () => void; onSelect: (id: UnlockId) => void; onFlower: (date: string) => void; onGallery: () => void;
}) {
  const [why, setWhy] = useState(false);
  const phraseName = (id: string) => presets.find((preset) => preset.id === id)?.title ?? id;
  const days = tended;
  const { t, i18n } = useTranslation();
  const trapRef = useFocusTrap<HTMLElement>(onClose);
  const next = nextUnlock(days, biome);
  const previous = [...unlocksFor(biome)].reverse().find((unlock) => unlock.day <= days)?.day ?? 0;
  const toNext = next ? (days - previous) / (next.day - previous) : 1;
  return <div className="modal-backdrop">
    <button className="backdrop-dismiss" aria-label={t('cancel')} onClick={onClose} />
    <section className="modal garden-journal" role="dialog" aria-modal="true" aria-labelledby="garden-journal-title" ref={trapRef}>
      <button className="icon-button modal-close" aria-label={t('cancel')} onClick={onClose}><X /></button>
      <p className="eyebrow">{t('gardenJournal')}</p>
      <h2 id="garden-journal-title">{t('gardenTended', { days: formatDays(days, i18n.language) })}</h2>
      <p className="journal-body">{t('gardenJournalBody')}</p>
      <dl className="journal-stats">
        <div><dt>{t('gardenTreeLabel')}</dt><dd>{t(`gardenTree${treeStage(full)}`)}</dd></div>
        <div><dt>{t('gardenFlowersLabel')}</dt><dd>{flowerCount(days).toLocaleString(i18n.language)}</dd></div>
      </dl>
      {next && <div className="journal-next">
        <span>{t('gardenNext', { item: t(`gardenUnlock_${next.id}`), when: t('gardenInDays', { days: formatDays(next.day - days, i18n.language) }) })}</span>
        <div className="fine-progress"><i style={{ '--fill': toNext } as React.CSSProperties} /></div>
      </div>}
      <ul className="journal-grid">
        {unlocksFor(biome).map((unlock) => {
          const open = days >= unlock.day;
          const Icon = open ? ICONS[unlock.id] : Lock;
          const body = <>
            <span className="journal-icon" aria-hidden="true"><Icon /></span>
            <strong>{open ? t(`gardenUnlock_${unlock.id}`) : t('gardenLockedName')}</strong>
            <small>{open ? t('gardenArrivedOn', { day: unlock.day }) : t('gardenArrivesOn', { day: unlock.day })}</small>
          </>;
          // Collected pieces take you to them in the garden.
          return <li key={unlock.id} className={open ? 'open' : 'locked'}>
            {open ? <button type="button" onClick={() => onSelect(unlock.id)} aria-label={t('gardenShowMe', { item: t(`gardenUnlock_${unlock.id}`) })}>{body}</button> : body}
          </li>;
        })}
      </ul>
      <section className="journal-section" aria-labelledby="orchard-title">
        <h3 id="orchard-title">{t('orchardTitle')}</h3>
        <ul className="orchard-list">{ORCHARD.map(({ id }) => {
          const grove = orchard[id];
          return <li key={id}>
            <strong>{t(`orchard_${id}`)}</strong>
            <span>{grove.plants} / {PLANTS_MAX}</span>
            <small>{grove.next !== null
              ? t('orchardNext', { phrase: phraseName(grove.phrase), count: grove.next.toLocaleString(i18n.language) })
              : nextMilestone(grove.reps) !== null
                ? t('orchardMilestone', { phrase: phraseName(grove.phrase), count: nextMilestone(grove.reps)!.toLocaleString(i18n.language), item: t(`orchard_${id}`) })
                : t('orchardFull', { phrase: phraseName(grove.phrase) })}</small>
          </li>;
        })}</ul>
      </section>
      {keptDays.size > 0 && <section className="journal-section" aria-labelledby="recent-flowers-title">
        <h3 id="recent-flowers-title">{t('yourDays')}</h3>
        <DayCalendar tended={keptDays} onDay={onFlower} />
      </section>}
      <section className="journal-section">
        <button type="button" className="quiet-button" onClick={onGallery}><Images aria-hidden="true" />{t('galleryOpen', { count: gardens })}</button>
      </section>
      <section className="journal-section">
        <button type="button" className="text-link" aria-expanded={why} onClick={() => setWhy(!why)}>{t('whyGarden')}</button>
        {why && <div className="why-garden">
          <p className="journal-body">{t('whyGardenIntro')}</p>
          <blockquote>
            <p lang="ar" dir="rtl">«لَقِيتُ إِبْرَاهِيمَ لَيْلَةَ أُسْرِيَ بِي فَقَالَ: يَا مُحَمَّدُ، أَقْرِئْ أُمَّتَكَ مِنِّي السَّلَامَ، وَأَخْبِرْهُمْ أَنَّ الْجَنَّةَ طَيِّبَةُ التُّرْبَةِ، عَذْبَةُ الْمَاءِ، وَأَنَّهَا قِيعَانٌ، وَأَنَّ غِرَاسَهَا: سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ»</p>
            {t('hadithIbrahim') && <p>{t('hadithIbrahim')}</p>}
            <cite>{t('hadithIbrahimSource')}</cite>
          </blockquote>
          <blockquote>
            <p lang="ar" dir="rtl">«مَنْ قَالَ: سُبْحَانَ اللَّهِ الْعَظِيمِ وَبِحَمْدِهِ، غُرِسَتْ لَهُ نَخْلَةٌ فِي الْجَنَّةِ»</p>
            {t('hadithPalm') && <p>{t('hadithPalm')}</p>}
            <cite>{t('hadithPalmSource')}</cite>
          </blockquote>
          <p className="fine-print">{t('whyGardenNote')}</p>
        </div>}
      </section>
      <p className="fine-print">{t('gardenBody')}</p>
    </section>
  </div>;
}
