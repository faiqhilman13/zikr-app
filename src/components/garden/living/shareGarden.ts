/**
 * A picture of the garden to share: the scene as it stands, drawn into a story-sized card
 * with the days tended and a line of the narration it is drawn from. Made entirely on the
 * device; nothing is sent anywhere unless the person shares it themselves.
 */
const WIDTH = 1080;
const HEIGHT = 1920;

function sceneImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', '1000');
  copy.setAttribute('height', '750');
  copy.querySelectorAll('[style]').forEach((node) => {
    // The camera and staggered entrances belong to the live page, not the picture.
    const element = node as SVGElement;
    element.style.removeProperty('transform');
    element.style.removeProperty('animation-delay');
  });
  copy.querySelectorAll('animateMotion, .lg-weather, .lg-sparkles').forEach((node) => node.remove());
  const markup = new XMLSerializer().serializeToString(copy).replace(/var\(--gold\)/g, '#d4a017');
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not draw the garden.')); };
    image.src = url;
  });
}

function wrap(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, line: number) {
  const words = text.split(' ');
  let row = '';
  for (const word of words) {
    const next = row ? `${row} ${word}` : word;
    if (context.measureText(next).width > width && row) { context.fillText(row, x, y); row = word; y += line; } else row = next;
  }
  if (row) context.fillText(row, x, y);
  return y + line;
}

export async function gardenCard(svg: SVGSVGElement, text: { eyebrow: string; title: string; stage: string; quote: string; arabic: string; source: string; site: string }) {
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not draw the garden.');
  const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#0a1229');
  sky.addColorStop(1, '#1e3a8a');
  context.fillStyle = sky;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.textAlign = 'center';
  context.fillStyle = '#efc967';
  context.font = '700 30px system-ui, sans-serif';
  context.fillText(text.eyebrow.toUpperCase(), WIDTH / 2, 190);
  context.fillStyle = '#ffffff';
  context.font = '500 88px Georgia, "Times New Roman", serif';
  context.fillText(text.title, WIDTH / 2, 300);
  context.fillStyle = 'rgba(255,255,255,.78)';
  context.font = '400 40px Georgia, "Times New Roman", serif';
  context.fillText(text.stage, WIDTH / 2, 370);

  const scene = await sceneImage(svg);
  context.drawImage(scene, 40, 440, 1000, 750);

  context.fillStyle = '#f6eed8';
  context.font = '500 46px "Noto Sans Arabic Variable", "Noto Naskh Arabic", serif';
  context.direction = 'rtl';
  let y = wrap(context, text.arabic, WIDTH / 2, 1330, 900, 78);
  context.direction = 'ltr';
  context.fillStyle = 'rgba(255,255,255,.86)';
  context.font = 'italic 34px Georgia, "Times New Roman", serif';
  if (text.quote) y = wrap(context, `“${text.quote}”`, WIDTH / 2, y + 16, 880, 48);
  context.fillStyle = 'rgba(255,255,255,.55)';
  context.font = '400 26px system-ui, sans-serif';
  context.fillText(text.source, WIDTH / 2, y + 6);

  context.fillStyle = '#efc967';
  context.font = '700 34px system-ui, sans-serif';
  context.fillText(text.site, WIDTH / 2, HEIGHT - 110);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not draw the garden.');
  return new File([blob], 'my-zikr-garden.png', { type: 'image/png' });
}

/** Opens the share sheet where there is one, otherwise saves the picture. */
export async function shareFile(file: File) {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared' as const;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled' as const;
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'saved' as const;
}
