<?php

namespace App\Support\Spreadsheet;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use Throwable;

/**
 * Reads an uploaded .xlsx or .csv into a plain grid of strings (every cell is text, so control
 * numbers like 202324054 or 00123 never turn into numbers). Rows keep their 1-based file line.
 */
class SpreadsheetReader
{
    /** Hard cap on physical rows scanned, so a file full of blank rows cannot hang the request. */
    private const MAX_SCANNED_ROWS = 5000;

    /**
     * @return array<int, array<int, string>> map of file line (1 = header) => cells; empty rows are kept
     */
    public function read(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        return match ($extension) {
            'xlsx' => $this->readXlsx($file->getRealPath()),
            'csv' => $this->readCsv($file->getRealPath()),
            default => throw ValidationException::withMessages([
                'archivo' => 'Formato no admitido. Sube un archivo .xlsx o .csv.',
            ]),
        };
    }

    /** @return array<int, array<int, string>> */
    private function readCsv(string $path): array
    {
        $raw = (string) file_get_contents($path);

        if (str_starts_with($raw, "\xEF\xBB\xBF")) {
            $raw = substr($raw, 3);
        }
        if (! mb_check_encoding($raw, 'UTF-8')) {
            // Older Excel exports CSV as Windows-1252 (a superset of ISO-8859-1 for printable text).
            $raw = mb_convert_encoding($raw, 'UTF-8', 'Windows-1252');
        }

        $delimiter = $this->detectDelimiter($raw);
        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $raw);
        rewind($stream);

        $rows = [];
        $line = 0;
        while (($cells = fgetcsv($stream, 0, $delimiter, '"', '')) !== false) {
            $line++;
            if ($line > self::MAX_SCANNED_ROWS) {
                break;
            }
            $rows[$line] = array_map(fn ($c) => (string) ($c ?? ''), $cells);
        }
        fclose($stream);

        return $rows;
    }

    private function detectDelimiter(string $raw): string
    {
        $firstLine = strtok($raw, "\r\n") ?: '';

        return substr_count($firstLine, ';') > substr_count($firstLine, ',') ? ';' : ',';
    }

    /** @return array<int, array<int, string>> */
    private function readXlsx(string $path): array
    {
        $reader = new XlsxReader;

        try {
            $reader->open($path);

            $chosen = null;
            foreach ($reader->getSheetIterator() as $sheet) {
                $chosen ??= $sheet;
                if (mb_strtolower($sheet->getName()) === 'invitaciones') {
                    $chosen = $sheet;
                    break;
                }
            }

            $rows = [];
            $line = 0;
            foreach ($chosen?->getRowIterator() ?? [] as $row) {
                $line++;
                if ($line > self::MAX_SCANNED_ROWS) {
                    break;
                }
                $rows[$line] = array_map($this->cellToString(...), $row->toArray());
            }

            return $rows;
        } catch (Throwable) {
            throw ValidationException::withMessages([
                'archivo' => 'No se pudo leer el archivo Excel. Verifica que sea un .xlsx válido.',
            ]);
        } finally {
            try {
                $reader->close();
            } catch (Throwable) {
            }
        }
    }

    private function cellToString(mixed $value): string
    {
        return match (true) {
            $value === null => '',
            is_bool($value) => $value ? '1' : '0',
            is_int($value) => (string) $value,
            // Whole floats (Excel stores every number as a double) print without exponent or ".0".
            is_float($value) => floor($value) === $value && abs($value) < 1e15
                ? sprintf('%.0f', $value)
                : rtrim(rtrim(sprintf('%.12F', $value), '0'), '.'),
            $value instanceof \DateTimeInterface => $value->format('Y-m-d'),
            is_scalar($value) => (string) $value,
            default => '',
        };
    }
}
