# -*- coding: utf-8 -*-
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

def crear_pdf_de_prueba(filename):
    doc = SimpleDocTemplate(filename, pagesize=letter,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=72)
    
    styles = getSampleStyleSheet()
    
    # Crear estilos personalizados
    title_style = ParagraphStyle(
        'TituloContrato',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    section_style = ParagraphStyle(
        'SeccionContrato',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        spaceBefore=15,
        spaceAfter=10,
        textColor='#1e3a8a'
    )
    
    body_style = ParagraphStyle(
        'CuerpoContrato',
        parent=styles['BodyText'],
        fontSize=10,
        leading=14,
        alignment=TA_JUSTIFY,
        spaceAfter=12
    )

    story = []
    
    # Título Principal
    story.append(Paragraph("<b>CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES</b>", title_style))
    story.append(Spacer(1, 12))
    
    # Sección 1
    story.append(Paragraph("<b>PRIMERA. DECLARACIONES Y PARTES</b>", section_style))
    texto_primera = (
        "El presente contrato de prestación de servicios es celebrado por una parte por la institución "
        "denominada 'Servicios Tecnológicos Integrales S.A.', en lo sucesivo denominada 'EL PRESTADOR', "
        "y por la otra parte por el ciudadano Juan Pérez Gómez, en lo sucesivo denominado 'EL CLIENTE'. "
        "Ambas partes declaran tener la capacidad legal y técnica suficiente para obligarse bajo los "
        "términos de este instrumento jurídico, reconociéndose mutuamente la personalidad con la que comparecen."
    )
    story.append(Paragraph(texto_primera, body_style))
    story.append(Spacer(1, 10))
    
    # Sección 2
    story.append(Paragraph("<b>SEGUNDA. OBJETO DEL CONTRATO</b>", section_style))
    texto_segunda = (
        "EL PRESTADOR se obliga a proporcionar a EL CLIENTE los servicios profesionales de asesoría, "
        "desarrollo, pruebas y puesta en producción de sistemas de software basados en inteligencia artificial "
        "y procesamiento de lenguaje natural. Las actividades específicas incluirán el diseño de arquitecturas, "
        "la calibración de modelos de lenguaje locales (como Qwen o Llama), y el entrenamiento de embeddings "
        "para bases de datos vectoriales. EL CLIENTE se compromete a proveer los insumos y la información necesaria."
    )
    story.append(Paragraph(texto_segunda, body_style))
    story.append(Spacer(1, 10))
    
    # Sección 3
    story.append(Paragraph("<b>TERCERA. VIGENCIA Y PLAZOS</b>", section_style))
    texto_tercera = (
        "Las partes acuerdan de conformidad que la vigencia del presente contrato comenzará a surtir efectos "
        "a partir del día 1 de junio de 2026 y concluirá indefectiblemente el día 31 de diciembre de 2026. "
        "Cualquier prórroga o renovación del presente instrumento deberá constar por escrito firmado "
        "por los representantes autorizados de ambas partes con al menos treinta días de anticipación al término original."
    )
    story.append(Paragraph(texto_tercera, body_style))
    story.append(Spacer(1, 10))
    
    # Sección 4
    story.append(Paragraph("<b>CUARTA. CONFIDENCIALIDAD</b>", section_style))
    texto_cuarta = (
        "Toda la información y documentación compartida por las partes durante la vigencia de este contrato "
        "tiene carácter confidencial. Ninguna de las partes podrá divulgar, reproducir o comercializar los datos, "
        "diseños, códigos de software o especificaciones técnicas del proyecto sin el consentimiento previo por escrito "
        "de la otra parte. Esta obligación de confidencialidad subsistirá por un periodo de cinco años posterior "
        "a la terminación del contrato."
    )
    story.append(Paragraph(texto_cuarta, body_style))
    story.append(Spacer(1, 10))

    # Construir el documento
    doc.build(story)
    print(f"PDF de prueba generado con éxito en: {filename}")

if __name__ == "__main__":
    import sys
    output_path = sys.argv[1] if len(sys.argv) > 1 else "prueba_contrato.pdf"
    crear_pdf_de_prueba(output_path)
