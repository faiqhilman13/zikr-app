import type { BiomeId } from '../../../domain/types';
import { AndalusiaFar, AndalusiaFront, AndalusiaGround, AndalusiaOver, AndalusiaWall, ArchFrame, FlowerHeads } from './andalusia';
import { DamascusFar, DamascusFlowerHeads, DamascusGround, DamascusOver, DamascusWall, DoorwayFrame } from './damascus';
import { KampungFar, KampungFlowerHeads, KampungFrame, KampungFront, KampungGround, KampungOver, KampungWall } from './kampung';
import { LAYOUTS } from './layouts';
import { ArishFrame, MedinaFar, MedinaFlowerHeads, MedinaFront, MedinaGround, MedinaWall } from './medina';
import { OgeeFrame, OttomanFar, OttomanFlowerHeads, OttomanGround, OttomanOver, OttomanWall } from './ottoman';
import { AgraFar, AgraFlowerHeads, AgraFront, AgraGround, AgraOver, AgraWall, CuspedFrame } from './agra';
import { DjenneFar, DjenneFlowerHeads, DjenneGround, DjenneWall, MudFrame } from './djenne';
import { SamarkandFar, SamarkandFlowerHeads, SamarkandGround, SamarkandWall, TimuridFrame } from './samarkand';
import { MoonGateFrame, XianFar, XianFlowerHeads, XianGround, XianOver, XianWall } from './xian';
import type { Paint, Scenes } from './scene';

const PAINT: Record<BiomeId, Paint> = {
  andalusia: { Far: AndalusiaFar, Wall: AndalusiaWall, Ground: AndalusiaGround, Front: AndalusiaFront, Over: AndalusiaOver, Frame: ArchFrame, FlowerHeads, golden: 'goldArch' },
  kampung: { Far: KampungFar, Wall: KampungWall, Ground: KampungGround, Front: KampungFront, Over: KampungOver, Frame: KampungFrame, FlowerHeads: KampungFlowerHeads, golden: 'goldFrame' },
  damascus: { Far: DamascusFar, Wall: DamascusWall, Ground: DamascusGround, Over: DamascusOver, Frame: DoorwayFrame, FlowerHeads: DamascusFlowerHeads, golden: 'goldLintel' },
  medina: { Far: MedinaFar, Wall: MedinaWall, Ground: MedinaGround, Front: MedinaFront, Frame: ArishFrame, FlowerHeads: MedinaFlowerHeads, golden: 'goldPosts' },
  ottoman: { Far: OttomanFar, Wall: OttomanWall, Ground: OttomanGround, Over: OttomanOver, Frame: OgeeFrame, FlowerHeads: OttomanFlowerHeads, golden: 'goldTiles' },
  xian: { Far: XianFar, Wall: XianWall, Ground: XianGround, Over: XianOver, Frame: MoonGateFrame, FlowerHeads: XianFlowerHeads, golden: 'goldMoonGate' },
  agra: { Far: AgraFar, Wall: AgraWall, Ground: AgraGround, Front: AgraFront, Over: AgraOver, Frame: CuspedFrame, FlowerHeads: AgraFlowerHeads, golden: 'goldPietra' },
  samarkand: { Far: SamarkandFar, Wall: SamarkandWall, Ground: SamarkandGround, Frame: TimuridFrame, FlowerHeads: SamarkandFlowerHeads, golden: 'goldMajolica' },
  djenne: { Far: DjenneFar, Wall: DjenneWall, Ground: DjenneGround, Frame: MudFrame, FlowerHeads: DjenneFlowerHeads, golden: 'goldPinnacles' }
};

export const SCENES: Scenes = Object.fromEntries((Object.keys(PAINT) as BiomeId[]).map((biome) => [biome, { layout: LAYOUTS[biome], paint: PAINT[biome] }])) as Scenes;
