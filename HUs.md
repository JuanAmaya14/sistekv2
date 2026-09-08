# Historias de Usuario (HUs)

## HU-1: Registro e inicio de sesión
Como usuario del sistema
Quiero registrarme e iniciar sesión
Para que el sistema pueda identificar mi rol y permitir la creación y gestión de tickets de forma segura y trazable.

### Criterios de Aceptación
- Registro
  - Dado que el usuario no tiene una cuenta,
    cuando se registra con datos válidos,
    entonces el sistema debe crear la cuenta exitosamente.
  - Dado que el correo ya está registrado,
    cuando el usuario intenta registrarse,
    entonces el sistema debe mostrar un mensaje indicando que el correo ya existe.
- Inicio de sesión
  - Dado que el usuario tiene una cuenta registrada,
    cuando ingresa credenciales válidas,
    entonces el sistema debe permitir el inicio de sesión.
  - Dado que el usuario ingresa credenciales incorrectas,
    cuando intenta iniciar sesión,
    entonces el sistema debe mostrar un mensaje de error.
- Control de acceso
  - Dado que el usuario no ha iniciado sesión,
    cuando intenta acceder a funcionalidades del sistema,
    entonces el sistema debe restringir el acceso.
  - El sistema debe identificar y almacenar el rol del usuario autenticado.
  - Sin autenticación no se debe permitir la creación ni gestión de tickets.

## HU-2: Gestión de roles
Como administrador del sistema
Quiero asignar y gestionar roles a los usuarios
Para definir qué acciones puede realizar cada uno dentro de la plataforma.

### Criterios de Aceptación
- Asignación de rol
  - Dado que existe un usuario registrado,
    cuando el administrador le asigna un rol,
    entonces el sistema debe guardar el rol correctamente.
- Roles definidos
  - El sistema debe manejar los siguientes roles:
    - Cliente
    - Agente
    - Administrador
- Restricción por permisos
  - Dado que un usuario tiene rol Cliente,
    cuando accede al sistema,
    entonces solo debe poder crear y consultar sus tickets.
  - Dado que un usuario tiene rol Agente,
    cuando accede al sistema,
    entonces debe poder gestionar y actualizar tickets asignados.
  - Dado que un usuario tiene rol Administrador,
    cuando accede al sistema,
    entonces debe poder supervisar usuarios y consultar reportes.
- Validación
  - El sistema no debe permitir acciones que no correspondan al rol asignado.

## HU-3: Crear ticket de soporte
Como cliente autenticado
Quiero crear un ticket de soporte
Para registrar una solicitud y recibir atención por parte del equipo de soporte.

### Criterios de Aceptación
- Creación básica
  - Dado que el usuario tiene rol Cliente y ha iniciado sesión,
    cuando completa el formulario con datos válidos,
    entonces el sistema debe crear el ticket exitosamente.
- Información obligatoria
  - El ticket debe incluir los siguientes campos obligatorios:
    - Título
    - Descripción
    - Prioridad
    - Tipo de problema
  - Si algún campo obligatorio está vacío,
    el sistema debe mostrar un mensaje de validación.
- Estado inicial
  - Cuando se crea un ticket,
    entonces el sistema debe asignar automáticamente el estado `Abierto`.
- Seguridad
  - Dado que el usuario no está autenticado,
    cuando intenta crear un ticket,
    entonces el sistema debe impedir la acción.
  - Dado que el usuario no tiene rol Cliente,
    cuando intenta crear un ticket,
    entonces el sistema debe restringir el acceso.

## HU-4: Visualizar listado de tickets
Como usuario autenticado
Quiero visualizar un listado de tickets
Para consultar su estado y realizar seguimiento a las solicitudes.

### Criterios de Aceptación
- Visualización según rol
  - Cliente: solo debe visualizar los tickets que él mismo creó.
  - Agente: debe visualizar los tickets asignados a él.
  - Administrador: debe visualizar todos los tickets del sistema.
- Información mostrada
  - El listado debe mostrar como mínimo:
    - Título
    - Estado
    - Prioridad
    - Agente asignado (si aplica)
    - Fecha de creación
- Seguridad
  - Dado que el usuario no está autenticado,
    cuando intenta acceder al listado,
    entonces el sistema debe restringir el acceso.

## HU-5: Asignar ticket a un agente
Como administrador del sistema
Quiero asignar un ticket a un agente de soporte
Para definir quién es responsable de atender la solicitud.

### Criterios de Aceptación
- Asignación básica
  - Dado que existe un ticket en estado `Abierto`,
    cuando el administrador selecciona un agente,
    entonces el sistema debe asignar el ticket correctamente.
- Validación de rol
  - Solo los usuarios con rol Administrador pueden asignar tickets.
  - El sistema solo debe permitir asignar tickets a usuarios con rol Agente.
- Actualización de información
  - Cuando un ticket es asignado,
    entonces debe actualizarse el campo `Agente asignado`.
  - El sistema debe registrar la fecha de asignación.
- Seguridad
  - Dado que un usuario no tiene permisos de administrador,
    cuando intenta asignar un ticket,
    entonces el sistema debe restringir la acción.

## HU-6: Cambiar estado de un ticket
Como agente de soporte
Quiero cambiar el estado de un ticket
Para reflejar el progreso y el estado actual de la solicitud.

### Criterios de Aceptación
- Estados definidos
  - El sistema debe manejar los siguientes estados:
    - `Abierto`
    - `En progreso`
    - `Cerrado`
- Cambio de estado
  - Dado que un ticket está asignado a un agente,
    cuando el agente actualiza el estado,
    entonces el sistema debe guardar el nuevo estado correctamente.
- Restricción por rol
  - Solo el agente asignado o el administrador pueden cambiar el estado del ticket.
  - Un usuario con rol Cliente no puede modificar el estado del ticket.
- Validación de flujo
  - Un ticket debe crearse inicialmente en estado `Abierto`.
  - Un ticket solo puede pasar a `En progreso` si está asignado a un agente.
  - Un ticket puede cambiar a `Cerrado` únicamente si estuvo previamente en `En progreso`.
- Registro
  - Cada cambio de estado debe registrarse con fecha y hora.

## HU-7: Historial de cambios del ticket
Como administrador o agente
Quiero visualizar el historial de cambios de un ticket
Para conocer el seguimiento completo y las acciones realizadas durante su ciclo de vida.

### Criterios de Aceptación
- Registro automático
  - Cada vez que un ticket cambie de estado, el sistema debe registrar:
    - Estado anterior
    - Nuevo estado
    - Fecha y hora del cambio
    - Usuario que realizó la acción
  - Cada vez que un ticket sea asignado a un agente, el sistema debe registrar:
    - Agente asignado
    - Fecha y hora de asignación
    - Usuario que realizó la asignación
- Visualización del historial
  - Dado que un usuario con permisos accede a un ticket,
    cuando consulta la sección de historial,
    entonces debe visualizar todos los eventos registrados en orden cronológico.
- Restricción por rol
  - El Cliente solo puede visualizar el historial de sus propios tickets.
  - El Agente puede visualizar el historial de los tickets asignados.
  - El Administrador puede visualizar el historial de todos los tickets.

## HU-8: Reportes de desempeño
Como administrador del sistema
Quiero visualizar reportes básicos de desempeño
Para evaluar la gestión del equipo de soporte y el cumplimiento en la atención de tickets.

### Criterios de Aceptación
- Métricas incluidas
  - El sistema debe generar reportes que incluyan como mínimo:
    - Cantidad total de tickets creados
    - Cantidad de tickets cerrados
    - Tiempo promedio de resolución
    - Cantidad de tickets gestionados por agente
- Cálculo de tiempos
  - El tiempo de resolución debe calcularse desde la fecha de creación hasta la fecha de cierre del ticket.
- Restricción por rol
  - Solo el Administrador puede acceder a los reportes.
  - Usuarios con rol Cliente o Agente no deben visualizar esta información.
- Visualización
  - Los reportes deben mostrarse de forma clara en una gráfica de barras.
  - La información debe reflejar datos actualizados del sistema.
