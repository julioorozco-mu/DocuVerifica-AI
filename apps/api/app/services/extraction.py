"""
Servicio de extracción de texto y fragmentación semántica.

Usa Docling para convertir PDF/DOCX a Markdown estructurado y luego
HierarchicalChunker para fragmentar por estructura del documento.
Aplica un post-proceso de límites de palabras como restricción secundaria.
"""

import logging
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

from docling.document_converter import DocumentConverter
from docling_core.transforms.chunker import HierarchicalChunker

logger = logging.getLogger(__name__)

# Constantes de chunking según AGENTS.md
MIN_WORDS = 500
MAX_WORDS = 1200
OVERLAP_WORDS = 125
# Umbral mínimo de palabras para considerar que un documento tiene texto
OCR_THRESHOLD_WORDS = 50


@dataclass
class ProcessedChunk:
    """Representación interna de un chunk procesado."""
    chunk_index: int
    text: str
    section_heading: Optional[str] = None
    headings: list[str] = field(default_factory=list)
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    word_count: int = 0
    metadata: dict = field(default_factory=dict)


@dataclass
class ExtractionResult:
    """Resultado de la extracción de texto de un documento."""
    chunks: list[ProcessedChunk]
    total_words: int
    ocr_required: bool
    markdown_full: str
    error: Optional[str] = None


def _count_words(text: str) -> int:
    """Cuenta palabras en un texto."""
    return len(text.split())


def _extract_page_numbers(chunk) -> tuple[Optional[int], Optional[int]]:
    """
    Extrae el rango de páginas de los metadatos de provenance de un chunk de Docling.
    Cada chunk tiene meta.doc_items, y cada doc_item tiene prov (lista de ProvenanceItem)
    con page_no (1-indexed).
    """
    pages = set()
    try:
        if hasattr(chunk, "meta") and hasattr(chunk.meta, "doc_items"):
            for doc_item in chunk.meta.doc_items:
                if hasattr(doc_item, "prov") and doc_item.prov:
                    for prov_item in doc_item.prov:
                        if hasattr(prov_item, "page_no"):
                            pages.add(prov_item.page_no)
    except Exception as e:
        logger.warning(f"No se pudieron extraer números de página del chunk: {e}")

    if pages:
        return min(pages), max(pages)
    return None, None


def _extract_headings(chunk) -> list[str]:
    """
    Extrae la jerarquía de encabezados (breadcrumbs) de un chunk de Docling.
    Los headings están en chunk.meta.headings como lista de objetos con texto.
    """
    headings = []
    try:
        if hasattr(chunk, "meta") and hasattr(chunk.meta, "headings"):
            for heading in chunk.meta.headings:
                if hasattr(heading, "text"):
                    headings.append(heading.text)
                elif isinstance(heading, str):
                    headings.append(heading)
    except Exception as e:
        logger.warning(f"No se pudieron extraer headings del chunk: {e}")
    return headings


def _subdivide_large_chunk(chunk: ProcessedChunk, max_words: int, overlap: int) -> list[ProcessedChunk]:
    """
    Subdivide un chunk que excede max_words en sub-chunks con overlap.
    Preserva los metadatos del chunk original.
    """
    words = chunk.text.split()
    if len(words) <= max_words:
        return [chunk]

    sub_chunks = []
    start = 0
    sub_index = 0

    while start < len(words):
        end = min(start + max_words, len(words))
        sub_text = " ".join(words[start:end])
        sub_wc = end - start

        sub_chunk = ProcessedChunk(
            chunk_index=0,  # Se reasigna después
            text=sub_text,
            section_heading=chunk.section_heading,
            headings=chunk.headings.copy(),
            page_start=chunk.page_start,
            page_end=chunk.page_end,
            word_count=sub_wc,
            metadata={**chunk.metadata, "sub_chunk": True, "parent_section": chunk.section_heading}
        )
        sub_chunks.append(sub_chunk)
        sub_index += 1

        # Avanzar con overlap
        start = end - overlap if end < len(words) else len(words)

    return sub_chunks


def _merge_headings(current: list[str], next_headings: list[str]) -> list[str]:
    headings = current.copy()
    for heading in next_headings:
        if heading not in headings:
            headings.append(heading)
    return headings


def _merge_small_chunks(chunks: list[ProcessedChunk], min_words: int) -> list[ProcessedChunk]:
    """
    Fusiona chunks pequeños contiguos hasta acercarlos al tamaño objetivo.

    Docling puede generar fragmentos semánticos muy pequeños por encabezado. Se conserva
    el orden del documento y se fusionan vecinos mientras no excedan MAX_WORDS.
    """
    if not chunks:
        return chunks

    merged = []
    current = chunks[0]

    for next_chunk in chunks[1:]:
        combined_words = current.word_count + next_chunk.word_count

        if current.word_count < min_words and combined_words <= MAX_WORDS:
            same_section = current.section_heading == next_chunk.section_heading
            current = ProcessedChunk(
                chunk_index=0,
                text=current.text + "\n\n" + next_chunk.text,
                section_heading=current.section_heading if same_section else None,
                headings=_merge_headings(current.headings, next_chunk.headings),
                page_start=current.page_start,
                page_end=next_chunk.page_end or current.page_end,
                word_count=combined_words,
                metadata={**current.metadata, "merged": True, "merged_across_sections": not same_section}
            )
        else:
            merged.append(current)
            current = next_chunk

    merged.append(current)
    return merged


def extract_text_from_document(file_path: str) -> ExtractionResult:
    """
    Extrae texto de un documento PDF o DOCX usando Docling y lo fragmenta
    en chunks semánticos con HierarchicalChunker + post-proceso de límites.

    Args:
        file_path: Ruta absoluta al archivo en disco local.

    Returns:
        ExtractionResult con los chunks procesados y metadatos.
    """
    path = Path(file_path)
    if not path.exists():
        return ExtractionResult(
            chunks=[],
            total_words=0,
            ocr_required=False,
            markdown_full="",
            error=f"El archivo no existe en la ruta: {file_path}"
        )

    logger.info(f"Iniciando extracción de texto para: {path.name}")

    try:
        # Paso 1: Convertir documento con Docling
        converter = DocumentConverter()
        result = converter.convert(str(path))
        doc = result.document

        # Paso 2: Exportar a Markdown completo
        markdown_full = doc.export_to_markdown()
        total_words_raw = _count_words(markdown_full)

        logger.info(f"Docling extrajo {total_words_raw} palabras de {path.name}")

        # Paso 3: Detectar si requiere OCR
        # Si el documento tiene más de 1 página pero menos de OCR_THRESHOLD_WORDS,
        # probablemente es un PDF escaneado sin texto embebido
        num_pages = 0
        try:
            if hasattr(doc, "pages") and doc.pages:
                num_pages = len(doc.pages)
        except Exception:
            num_pages = 1

        ocr_required = path.suffix.lower() == ".pdf" and total_words_raw < OCR_THRESHOLD_WORDS

        if ocr_required:
            logger.warning(
                f"Documento {path.name} tiene {total_words_raw} palabras en {num_pages} páginas. "
                f"Marcado como ocr_required."
            )
            return ExtractionResult(
                chunks=[],
                total_words=total_words_raw,
                ocr_required=True,
                markdown_full=markdown_full,
                error=None
            )

        # Paso 4: Chunking jerárquico con Docling
        chunker = HierarchicalChunker()
        raw_chunks = list(chunker.chunk(doc))

        logger.info(f"HierarchicalChunker produjo {len(raw_chunks)} chunks brutos")

        # Paso 5: Transformar chunks de Docling a nuestro formato interno
        processed = []
        for i, raw_chunk in enumerate(raw_chunks):
            page_start, page_end = _extract_page_numbers(raw_chunk)
            headings = _extract_headings(raw_chunk)
            text = raw_chunk.text if hasattr(raw_chunk, "text") else str(raw_chunk)
            wc = _count_words(text)

            chunk = ProcessedChunk(
                chunk_index=i,
                text=text,
                section_heading=headings[-1] if headings else None,
                headings=headings,
                page_start=page_start,
                page_end=page_end,
                word_count=wc,
                metadata={}
            )
            processed.append(chunk)

        # Paso 6: Post-proceso — Subdividir chunks grandes (>MAX_WORDS)
        expanded = []
        for chunk in processed:
            if chunk.word_count > MAX_WORDS:
                expanded.extend(_subdivide_large_chunk(chunk, MAX_WORDS, OVERLAP_WORDS))
            else:
                expanded.append(chunk)

        # Paso 7: Post-proceso — Fusionar chunks pequeños (<MIN_WORDS) de misma sección
        merged = _merge_small_chunks(expanded, MIN_WORDS)

        # Paso 8: Reasignar índices secuenciales
        for i, chunk in enumerate(merged):
            chunk.chunk_index = i

        total_words = sum(c.word_count for c in merged)

        logger.info(
            f"Extracción completada: {len(merged)} chunks finales, {total_words} palabras totales"
        )

        return ExtractionResult(
            chunks=merged,
            total_words=total_words,
            ocr_required=False,
            markdown_full=markdown_full
        )

    except Exception as e:
        logger.error(f"Error durante la extracción de texto de {path.name}: {e}", exc_info=True)
        return ExtractionResult(
            chunks=[],
            total_words=0,
            ocr_required=False,
            markdown_full="",
            error=f"Error al procesar el documento: {str(e)}"
        )
