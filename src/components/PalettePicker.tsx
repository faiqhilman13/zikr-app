import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { paletteFor, presets } from '../theme';

/**
 * Choosing a palette is choosing colour, so the control has to show colour: a select
 * cannot. Each option previews the palette as it actually renders, split light on one
 * side and dark on the other, because the choice covers both modes at once.
 *
 * Real radios underneath. Arrow keys move through the group, the label is the hit target,
 * and the swatch is decoration over a working control rather than a reinvented one.
 */
export function PalettePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { t } = useTranslation();

  return <fieldset className="palette-field">
    <legend>{t('palette')}</legend>
    <div className="palette-grid">
      {presets.map((preset) => {
        const light = paletteFor(preset.id, 'light');
        const dark = paletteFor(preset.id, 'dark');
        const name = t(`palette${preset.id.charAt(0).toUpperCase()}${preset.id.slice(1)}`);
        return <label className={`palette-option${preset.id === value ? ' selected' : ''}`} key={preset.id}>
          <input
            type="radio"
            name="palette"
            value={preset.id}
            checked={preset.id === value}
            onChange={() => onChange(preset.id)}
          />
          <span className="palette-swatch" aria-hidden="true">
            <span className="palette-half" style={{ background: light['--bg'] }}>
              <i style={{ background: light['--panel'] }} />
              <i style={{ background: light['--gold'] }} />
            </span>
            <span className="palette-half" style={{ background: dark['--bg'] }}>
              <i style={{ background: dark['--panel'] }} />
              <i style={{ background: dark['--gold'] }} />
            </span>
            <Check className="palette-tick" aria-hidden="true" />
          </span>
          <span className="palette-name">{name}</span>
        </label>;
      })}
    </div>
    <p className="palette-note">{t('paletteNote')}</p>
  </fieldset>;
}
