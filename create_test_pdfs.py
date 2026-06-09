import os
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
except ImportError:
    import subprocess
    subprocess.run(["pip", "install", "reportlab"], check=True)
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter

output_dir = r"c:\Dev\Marca Unach\DocuVerifica-AI\storage\documents"
os.makedirs(output_dir, exist_ok=True)

# 1. Documento que cumple todo
pdf1 = os.path.join(output_dir, "cumple_todo.pdf")
c = canvas.Canvas(pdf1, pagesize=letter)
c.drawString(100, 750, "Microcurso de Prueba - Aprobado")
c.drawString(100, 720, "Fecha de Expedición: 08 de Junio de 2026")
c.drawString(100, 680, "Introducción")
c.drawString(100, 660, "Este microcurso cubre los fundamentos básicos.")
c.drawString(100, 620, "Desarrollo")
c.drawString(100, 600, "Aquí se explica detalladamente el contenido del curso.")
c.drawString(100, 560, "Conclusión")
c.drawString(100, 540, "En conclusión, el estudiante ha completado el curso satisfactoriamente.")
c.drawString(100, 480, "Firma del Instructor: [Firma Legible Juan Perez]")
c.save()

# 2. Documento que falla criterios
pdf2 = os.path.join(output_dir, "falla_criterios.pdf")
c = canvas.Canvas(pdf2, pagesize=letter)
c.drawString(100, 750, "Microcurso de Prueba - Fallido")
c.drawString(100, 680, "Introducción")
c.drawString(100, 660, "Este microcurso tiene la introducción.")
c.drawString(100, 620, "Desarrollo")
c.drawString(100, 600, "Pero le falta la conclusión, la fecha y la firma.")
c.save()

print(f"Generated {pdf1} and {pdf2}")
