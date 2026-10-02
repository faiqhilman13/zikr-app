import type { BiomeId } from '../../../domain/types';
import { AndalusiaFar, AndalusiaFront, AndalusiaGround, AndalusiaOver, AndalusiaWall, ArchFrame, FlowerHeads } from './andalusia';
import { DamascusFar, DamascusFlowerHeads, DamascusGround, DamascusOver, DamascusWall, DoorwayFrame } from './damascus';
import { KampungFar, KampungFlowerHeads, KampungFrame, KampungFront, KampungGround, KampungOver, KampungWall } from './kampung';
import { LAYOUTS } from './layouts';
import { ArishFrame, MedinaFar, MedinaFlowerHeads, MedinaFront, MedinaGround, MedinaWall } from './medina';
import { OgeeFrame, OttomanFar, OttomanFlowerHeads, OttomanGround, OttomanOver, OttomanWall } from './ottoman';
import type { Paint, Scenes } from './scene';

const PAINT: Record<BiomeId, Paint> = {
  andalusia: { Far: AndalusiaFar, Wall: AndalusiaWall, Ground: AndalusiaGround, Front: AndalusiaFront, Over: AndalusiaOver, Frame: ArchFrame, FlowerHeads, golden: 'goldArch' },
  kampung: { Far: KampungFar, Wall: KampungWall, Ground: KampungGround, Front: KampungFront, Over: KampungOver, Frame: KampungFrame, FlowerHeads: KampungFlowerHeads, golden: 'goldFrame' },
  damascus: { Far: DamascusFar, Wall: DamascusWall, Ground: DamascusGround, Over: DamascusOver, Frame: DoorwayFrame, FlowerHeads: DamascusFlowerHeads, golden: 'goldLintel' },
  medina: { Far: MedinaFar, Wall: MedinaWall, Ground: MedinaGround, Front: MedinaFront, Frame: ArishFrame, FlowerHeads: MedinaFlowerHeads, golden: 'goldPosts' },
  ottoman: { Far: OttomanFar, Wall: OttomanWall, Ground: OttomanGround, Over: OttomanOver, Frame: OgeeFrame, FlowerHeads: OttomanFlowerHeads, golden: 'goldTiles' }
};

export const SCENES: Scenes = Object.fromEntries((Object.keys(PAINT) as BiomeId[]).map((biome) => [biome, { layout: LAYOUTS[biome], paint: PAINT[biome] }])) as Scenes;
