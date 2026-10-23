/**
 * An upload in flight fills its pill from the start edge as it streams.
 *
 * The fill used to be drawn at the right width in a colour nobody could see:
 * --bg-selected at 30% over the pill, about 1.03:1 in the default theme. A
 * check of its width alone passed all along, so the colour it paints is
 * checked here too, against every theme's palette.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount, shadow, shadowAll, text, update } from './helpers/dom';
import { AttachmentPill } from '../src/components/alps-attachment-pill';
import { THEME_BUNDLES } from '../src/store/themes';
import { I18nStore } from '../src/store/i18n-store';

afterEach(cleanup);

const uploading = (progress: number) => ({ filename: 'report.pdf', size: 768 * 1024, uploading: true, progress });

describe('alps-attachment-pill upload progress', () => {
  it('fills as far as the upload has got, and says how far', async () => {
    const el = await mount('alps-attachment-pill', { attachment: uploading(40), removable: true });
    expect(shadow(el, '.progress-bar').style.width).toBe('40%');
    expect(text(el, '.attachment-size')).toBe('40% of 768 KB');

    await update(el, { attachment: uploading(85) });
    expect(shadow(el, '.progress-bar').style.width).toBe('85%');
  });

  it('says how far in the language the composer speaks', async () => {
    // The "of" was English in every language, and German spaces the percent
    // sign off its number, with a space that does not break.
    const i18nStore = new I18nStore();
    await i18nStore.setLanguage('de');
    const el = await mount('alps-attachment-pill', { attachment: uploading(29), removable: true, i18nStore });
    // Read raw: text() collapses the no-break space into a plain one.
    expect(shadow(el, '.attachment-size').textContent).toBe('29\u00a0% von 768 KB');
  });

  /** Each language's percentage: a no-break space before the sign, or none. */
  const PERCENT: Record<string, string> = {
    da: '29\u00a0%', de: '29\u00a0%', es: '29\u00a0%', fr: '29\u00a0%',
    en: '29%', it: '29%', pt: '29%', rs: '29%', sr: '29%',
  };

  it.each(Object.keys(PERCENT))('writes the percentage as %s writes one', async (code) => {
    const i18nStore = new I18nStore();
    await i18nStore.setLanguage(code);
    expect(i18nStore.t('attachment.uploadProgress', { percent: 29, size: '768 KB' })).toContain(PERCENT[code]);
    // The same as Intl formats one for the locale. Some ICU versions print
    // French's space as the narrow one; either keeps the number and its sign
    // on one line.
    const intl = new Intl.NumberFormat(i18nStore.getIntlLanguage(), { style: 'percent' }).format(0.29);
    expect(intl.replace(/\u202f/g, '\u00a0')).toBe(PERCENT[code]);
  });

  it('drops the fill once the upload is done', async () => {
    const el = await mount('alps-attachment-pill', { attachment: uploading(100), removable: true });
    await update(el, { attachment: { filename: 'report.pdf', size: 768 * 1024, uuid: 'u1' } });
    expect(shadowAll(el, '.progress-bar')).toHaveLength(0);
    expect(text(el, '.attachment-size')).toBe('768 KB');
  });

  /** The fill's rule, as the component's stylesheet declares it. */
  const fillRule = (): string => {
    const css = AttachmentPill.styles as unknown as { cssText: string };
    const rule = css.cssText.match(/\.progress-bar\s*\{([^}]*)\}/);
    if (!rule) throw new Error('no .progress-bar rule');
    return rule[1];
  };

  const rgb = (hex: string): [number, number, number] => {
    const h = hex.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  };

  /** WCAG relative luminance. */
  const luminance = ([r, g, b]: [number, number, number]) => {
    const lin = (c: number) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };

  it('paints a tint of the accent, with nothing dimming it', () => {
    const rule = fillRule();
    expect(rule).toMatch(/color-mix\(in srgb, var\(--accent-color[^)]*\) \d+%, transparent\)/);
    expect(rule).not.toMatch(/opacity/);
  });

  it.each(Object.keys(THEME_BUNDLES))('stands out from the pill in the %s theme', (id) => {
    const share = Number(fillRule().match(/var\(--accent-color[^)]*\) (\d+)%/)![1]) / 100;
    const { 'bg-primary': pill, 'accent-color': accent } = THEME_BUNDLES[id].colors;
    const base = rgb(pill);
    const tint = rgb(accent).map((c, i) => c * share + base[i] * (1 - share)) as [number, number, number];
    const [a, b] = [luminance(base), luminance(tint)];
    const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    expect(contrast).toBeGreaterThanOrEqual(1.15);
  });
});
