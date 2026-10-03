<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Export;

use Dompdf\Dompdf;
use Dompdf\Options;
use SilentSpirits\ItemCreator\Http\HttpException;

/**
 * Renders an item's stat block as a PDF page in the corebook's style (Chapter 11): a black name
 * bar, the description beside a Size / CR / CC box, and grey section bands (COMBAT, POWER,
 * CAPABILITIES, EFFECTS, SOFTWARE) of bold-labelled entries.
 *
 * The client builds the stat block with the rules engine (client/src/domain/statBlock.js), so the
 * wording lives in one place; this class only checks it and lays it out, with Dompdf (lib/dompdf,
 * vendored: no Composer). Fonts: Andada Pro (the book's body) and Asimovian (headings, standing in
 * for Galexica) from lib/pdf-fonts; Aerovias Brasil NF (the running head) from Fonts/ if present.
 */
final class ItemPdfExporter
{
    public const SECTIONS = ['COMBAT', 'POWER', 'CAPABILITIES', 'EFFECTS', 'SOFTWARE'];
    private const MAX_TEXT = 2000;
    private const MAX_ENTRIES = 60;

    public function __construct(private string $root)
    {
    }

    /**
     * @param array<mixed> $block { name, description, category, size, cr, cc, sections: [{ title, entries: [{ label, value }] }] }
     * @return string the PDF
     */
    public function export(array $block): string
    {
        $html = $this->html(self::checked($block));

        require_once $this->root . '/lib/dompdf/autoload.inc.php';
        $cache = sys_get_temp_dir() . '/itemcreator-dompdf';
        if (!is_dir($cache)) {
            @mkdir($cache, 0775, true);
        }
        $options = new Options([
            'isRemoteEnabled' => false,
            'isFontSubsettingEnabled' => true,
            // Dompdf may read only the font folders; its own fonts are found from its install.
            'chroot' => array_values(array_filter([$this->root . '/lib/pdf-fonts', is_dir($this->root . '/Fonts') ? $this->root . '/Fonts' : null])),
            'fontDir' => $cache,
            'fontCache' => $cache,
            'tempDir' => $cache,
            'defaultFont' => 'Andada Pro',
        ]);
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('letter');
        $dompdf->render();
        return (string) $dompdf->output();
    }

    /**
     * The stat block, with every field checked: it comes from the client.
     *
     * @param array<mixed> $block
     * @return array{name: string, description: string, category: string, size: string, cr: ?int, cc: ?int, sections: list<array{title: string, entries: list<array{label: string, value: string}>}>}
     */
    private static function checked(array $block): array
    {
        $text = static function (array $from, string $key, string $where): string {
            $value = $from[$key] ?? '';
            if (!is_string($value) && !is_int($value) && !is_float($value)) {
                throw HttpException::badRequest("$where.$key must be text.");
            }
            return mb_substr(trim((string) $value), 0, self::MAX_TEXT);
        };
        $number = static function (array $from, string $key): ?int {
            $value = $from[$key] ?? null;
            if ($value === null || $value === '') {
                return null;
            }
            if (!is_numeric($value)) {
                throw HttpException::badRequest("statBlock.$key must be a number.");
            }
            return (int) $value;
        };

        $sections = [];
        foreach (is_array($block['sections'] ?? null) ? $block['sections'] : [] as $i => $section) {
            if (!is_array($section) || !in_array($section['title'] ?? null, self::SECTIONS, true)) {
                throw HttpException::badRequest("statBlock.sections[$i].title must be one of " . implode(', ', self::SECTIONS) . '.');
            }
            $entries = [];
            foreach (array_slice(is_array($section['entries'] ?? null) ? $section['entries'] : [], 0, self::MAX_ENTRIES) as $j => $entry) {
                if (!is_array($entry)) {
                    throw HttpException::badRequest("statBlock.sections[$i].entries[$j] must be an object.");
                }
                $entries[] = ['label' => $text($entry, 'label', "entries[$j]"), 'value' => $text($entry, 'value', "entries[$j]")];
            }
            $sections[] = ['title' => $section['title'], 'entries' => $entries];
        }

        $name = $text($block, 'name', 'statBlock');
        if ($name === '') {
            throw HttpException::badRequest('statBlock.name is required.');
        }
        return [
            'name' => $name,
            'description' => $text($block, 'description', 'statBlock'),
            'category' => $text($block, 'category', 'statBlock'),
            'size' => $text($block, 'size', 'statBlock'),
            'cr' => $number($block, 'cr'),
            'cc' => $number($block, 'cc'),
            'sections' => $sections,
        ];
    }

    /** @param array{name: string, description: string, category: string, size: string, cr: ?int, cc: ?int, sections: list<array{title: string, entries: list<array{label: string, value: string}>}>} $block */
    private function html(array $block): string
    {
        $e = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $font = static fn (string $file): string => str_replace('\\', '/', $file);
        $fonts = $this->root . '/lib/pdf-fonts';
        $aerovias = $this->root . '/Fonts/Aerovias Brasil NF.ttf';
        $titleFont = is_file($aerovias) ? "'Aerovias Brasil NF', 'Asimovian'" : "'Asimovian'";

        $faces = [
            ['Andada Pro', 'normal', 'normal', "$fonts/AndadaPro-Regular.ttf"],
            ['Andada Pro', 'bold', 'normal', "$fonts/AndadaPro-Bold.ttf"],
            ['Andada Pro', 'normal', 'italic', "$fonts/AndadaPro-Italic.ttf"],
            ['Asimovian', 'normal', 'normal', "$fonts/Asimovian-Regular.ttf"],
        ];
        if (is_file($aerovias)) {
            $faces[] = ['Aerovias Brasil NF', 'normal', 'normal', $aerovias];
        }
        $fontCss = implode("\n", array_map(
            static fn (array $f): string => sprintf("@font-face { font-family: '%s'; font-weight: %s; font-style: %s; src: url('%s') format('truetype'); }", $f[0], $f[1], $f[2], $font($f[3])),
            $faces
        ));

        $box = '';
        foreach ([['Size', $block['size']], ['CR', $block['cr']], ['CC', $block['cc']]] as [$label, $value]) {
            if ($value !== null && $value !== '') {
                $box .= sprintf('<tr><th>%s:</th><td>%s</td></tr>', $label, $e((string) $value));
            }
        }

        // One entry per line, its label kept with its value. A label that repeats (the book's
        // "Attacks:") is printed once, with each value on its own indented line under it.
        $sections = '';
        foreach ($block['sections'] as $section) {
            $groups = [];
            foreach ($section['entries'] as $entry) {
                $last = count($groups) - 1;
                if ($last >= 0 && $groups[$last]['label'] === $entry['label']) {
                    $groups[$last]['values'][] = $entry['value'];
                } else {
                    $groups[] = ['label' => $entry['label'], 'values' => [$entry['value']]];
                }
            }
            $lines = '';
            foreach ($groups as $group) {
                $label = sprintf('<span class="label">%s:</span>', $e($group['label']));
                if (count($group['values']) === 1) {
                    $lines .= sprintf('<div class="entry">%s&nbsp;%s</div>', $label, $e($group['values'][0]));
                } else {
                    $lines .= sprintf('<div class="entry">%s</div>', $label);
                    foreach ($group['values'] as $value) {
                        $lines .= sprintf('<div class="entry sub">%s</div>', $e($value));
                    }
                }
            }
            $sections .= sprintf('<div class="band">%s</div><div class="entries">%s</div>', $e($section['title']), $lines);
        }

        $head = $block['category'] !== '' ? $e($block['category']) : 'Redemption';
        $date = date('Y-m-d');

        return <<<HTML
<!doctype html>
<html><head><meta charset="utf-8"><style>
$fontCss
@page { margin: 0.7in 0.75in 0.8in 0.75in; }
body { font-family: 'Andada Pro', serif; font-size: 10pt; color: #000; }
.runhead { font-family: $titleFont; font-size: 13pt; text-align: center; border-bottom: 1.5pt solid #000; padding-bottom: 3pt; margin-bottom: 18pt; }
.runhead .corner { float: left; width: 10pt; height: 10pt; background: #000; margin-top: 2pt; }
.runhead .corner.right { float: right; }
.namebar { background: #000; color: #fff; font-family: 'Asimovian', sans-serif; font-size: 12pt; letter-spacing: 0.5pt; text-transform: uppercase; padding: 3pt 6pt 2pt; }
table.layout { width: 100%; border-collapse: collapse; margin: 5pt 0 4pt; }
table.layout td { vertical-align: top; padding: 0; }
td.description { line-height: 1.3; padding-right: 10pt; }
table.box { border: 1pt solid #000; border-collapse: collapse; font-family: 'Asimovian', sans-serif; font-size: 9.5pt; }
table.box th { text-align: right; padding: 1pt 3pt 1pt 8pt; font-weight: normal; }
table.box td { padding: 1pt 8pt 1pt 0; }
.band { background: #dcdcdc; font-family: 'Asimovian', sans-serif; font-size: 9pt; letter-spacing: 0.6pt; padding: 1.5pt 6pt 0.5pt; margin-top: 5pt; }
.entries { padding: 2pt 6pt 1pt; line-height: 1.35; }
.entry { padding-left: 12pt; text-indent: -12pt; }
.entry.sub { padding-left: 24pt; }
.label { font-weight: bold; white-space: nowrap; }
.foot { position: fixed; bottom: -0.45in; left: 0; right: 0; font-family: 'Asimovian', sans-serif; font-size: 7.5pt; color: #555; border-top: 0.5pt solid #000; padding-top: 3pt; }
.foot .right { float: right; }
</style></head><body>
<div class="runhead"><span class="corner"></span><span class="corner right"></span>{$head}</div>
<div class="namebar">{$e($block['name'])}</div>
<table class="layout"><tr>
<td class="description">{$e($block['description'])}</td>
<td style="width: 1%; white-space: nowrap;"><table class="box">{$box}</table></td>
</tr></table>
{$sections}
<div class="foot">Redemption Gear Creator<span class="right">{$date}</span></div>
</body></html>
HTML;
    }
}
