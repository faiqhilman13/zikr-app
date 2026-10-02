import { growOlive, pointOn } from './tree';

/** The kampung garden's window shape, its mango tree, and where its camera looks. */
export const KAMPUNG_FRAME = 'M0 300 L0 44 Q0 10 34 10 L366 10 Q400 10 400 44 L400 300 Z';
export const MANGO = growOlive(53, 6);

/** Where the camera looks when a kampung piece arrives. */
export function kampungFocus(id: string, treeBase: { x: number; y: number }, scale: number) {
  switch (id) {
    case 'steppingStones': return { x: 160, y: 245, w: 80, h: 55 };
    case 'lemongrass': return { x: 140, y: 225, w: 120, h: 55 };
    case 'wakaf': return { x: 25, y: 195, w: 90, h: 65 };
    case 'banana': return { x: 0, y: 195, w: 70, h: 60 };
    case 'doveCage': return { x: 120, y: 180, w: 70, h: 80 };
    case 'rambutan': return { x: 310, y: 185, w: 90, h: 80 };
    case 'lotusPond': return { x: 220, y: 215, w: 100, h: 45 };
    case 'pangkin': return { x: 290, y: 230, w: 60, h: 35 };
    case 'coconut': return { x: 320, y: 110, w: 80, h: 110 };
    case 'pelitaRow': return { x: 0, y: 170, w: 210, h: 55 };
    case 'bamboo': return { x: 0, y: 110, w: 100, h: 110 };
    case 'bougainvillea': return { x: 280, y: 180, w: 120, h: 45 };
    case 'orchids': {
      const limb = MANGO.branches[0];
      const at = pointOn(limb, 0.75);
      return { x: treeBase.x + at.x * scale - 30, y: treeBase.y + at.y * scale - 25, w: 70, h: 55 };
    }
    default: return null;
  }
}
