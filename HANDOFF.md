# Handoff: bot de ofertas ML → Instagram (2026-11-10, noche)

## Funcionando y comprobado
- Página pública de ofertas y página de historias (GitHub Pages).
- Recolección desde el celular: marcador "Recolectar" (docs/recolectar.js) → docs/recibir.html → data/entrada.json → workflow procesar.yml (elige, dibuja imágenes en la nube, publica páginas). Probado todo menos el envío real desde el teléfono.
- La clave de GitHub de Rodrigo quedó guardada en su iPhone y GitHub la aceptó (falta confirmar que tenga permiso de escritura: se ve en el primer envío).
- Regla de no repetir (data/historial.json, docs/historial.json).

## Sin comprobar
- Publicación automática (publicar.yml, cada hora 9-22 Chile): la tarea está activa, pero GitHub NO ejecutó el horario de las 22:00 del 10-nov. Revisar el 11-nov después de las 9:00 con `gh run list --workflow publicar.yml`. Si GitHub sigue sin dispararla, buscar un reloj externo gratis que llame a workflow_dispatch.
- Hay 14 posts del 10-nov listos y sin publicar (ofertas recolectadas el 10-nov a las 20:50; el bot los descarta a las 30 horas).

## Rutina diaria de Rodrigo
1. En el celular: panel de afiliados → marcador Recolectar → Enviar al bot. No hacerlo antes de que se publiquen los posts del día, porque reemplaza la tanda.
2. Subir las historias a mano desde /historias.html.

## Pendiente
1. Regenerar el token de Instagram (quedó pegado en el chat).
2. Poner el link de la página en la bio de Instagram (lo hace Rodrigo).
3. Ampliar la búsqueda por categorías cuando se agoten las ofertas nuevas.
