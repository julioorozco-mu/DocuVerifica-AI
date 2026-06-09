import os
from fpdf import FPDF

out_dir = r"c:\Dev\Marca Unach\DocuVerifica-AI\test_pdfs"
os.makedirs(out_dir, exist_ok=True)

# Document 1: Meets all criteria
pdf1 = FPDF()
pdf1.add_page()
pdf1.set_font("helvetica", size=12)

content1 = """
Documento de Prueba 1: Microcurso
Este documento ha sido redactado con el propósito de cumplir con todos los criterios de revisión establecidos, utilizando un tono formal y estructurado.

Introducción
El presente microcurso tiene como objetivo desarrollar habilidades fundamentales en el análisis de datos. En esta sección se abordan los conceptos teóricos y la motivación detrás del curso. Se espera que los estudiantes adquieran una base sólida.

Desarrollo
Durante el desarrollo del curso, los participantes resolverán casos prácticos. Se utilizarán diversas herramientas tecnológicas para procesar información y obtener resultados medibles. El aprendizaje será progresivo y guiado.

Conclusión
En conclusión, este microcurso proporciona las competencias necesarias para enfrentar problemas del mundo real. Se han revisado los fundamentos y su aplicación práctica, asegurando la calidad del aprendizaje continuo.
"""
pdf1.multi_cell(0, 10, text=content1)
pdf1.output(os.path.join(out_dir, "documento_cumple_todo.pdf"))

# Document 2: Fails structure criterion (no conclusion)
pdf2 = FPDF()
pdf2.add_page()
pdf2.set_font("helvetica", size=12)

content2 = """
Documento de Prueba 2: Microcurso (Incompleto)
Este documento está redactado formalmente, pero le falta una de las secciones requeridas para la estructura correcta del microcurso.

Introducción
El presente microcurso tiene como objetivo explorar metodologías ágiles aplicadas al desarrollo de software. Esta fase inicial establece los objetivos de aprendizaje y las expectativas generales del programa.

Desarrollo
A lo largo de los módulos, se implementarán prácticas como Scrum y Kanban. Los equipos trabajarán en ciclos cortos, iterando sobre sus entregables y adaptándose a los cambios del proyecto de forma dinámica.

(Nota: Falta la sección de Conclusión intencionalmente para fallar el criterio de estructura).
"""
pdf2.multi_cell(0, 10, text=content2)
pdf2.output(os.path.join(out_dir, "documento_falla_estructura.pdf"))

print(f"PDFs creados en {out_dir}")
