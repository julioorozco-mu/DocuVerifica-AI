import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.services import extraction
from app.services.extraction import ProcessedChunk


class _FakeDoc:
    pages = {1: object()}

    def export_to_markdown(self):
        return ""


class _FakeConversionResult:
    document = _FakeDoc()


class _FakeConverter:
    def convert(self, _path):
        return _FakeConversionResult()


class _FakeChunker:
    def chunk(self, _doc):
        return []


class ExtractionRulesTest(unittest.TestCase):
    def test_single_page_document_without_text_requires_ocr(self):
        with tempfile.NamedTemporaryFile(suffix=".pdf") as file:
            with patch.object(extraction, "DocumentConverter", return_value=_FakeConverter()):
                with patch.object(extraction, "HierarchicalChunker", return_value=_FakeChunker()):
                    result = extraction.extract_text_from_document(file.name)

        self.assertTrue(result.ocr_required)
        self.assertEqual(result.total_words, 0)
        self.assertEqual(result.chunks, [])

    def test_small_adjacent_chunks_are_merged_until_target_size_even_across_sections(self):
        chunks = [
            ProcessedChunk(
                chunk_index=0,
                text="uno " * 120,
                section_heading="A",
                headings=["A"],
                page_start=1,
                page_end=1,
                word_count=120,
            ),
            ProcessedChunk(
                chunk_index=1,
                text="dos " * 160,
                section_heading="B",
                headings=["B"],
                page_start=1,
                page_end=1,
                word_count=160,
            ),
            ProcessedChunk(
                chunk_index=2,
                text="tres " * 180,
                section_heading="C",
                headings=["C"],
                page_start=2,
                page_end=2,
                word_count=180,
            ),
        ]

        merged = extraction._merge_small_chunks(chunks, min_words=500)

        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0].word_count, 460)
        self.assertEqual(merged[0].page_start, 1)
        self.assertEqual(merged[0].page_end, 2)
        self.assertTrue(merged[0].metadata["merged"])


if __name__ == "__main__":
    unittest.main()
