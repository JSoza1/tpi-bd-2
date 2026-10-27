# TPI — Base de Datos II

Trabajo Práctico Integrador de la Tecnicatura Universitaria en Programación a Distancia.

El proyecto presenta un modelo de datos para un restaurante que recibe pedidos con entrega a domicilio. Se utiliza MongoDB Atlas para la persistencia en la nube y un script de Node.js con Mongoose para demostrar operaciones CRUD.

## Integrantes

- Jeremias Paez
- Jonathan Soza
- Facundo Villarroel

## Tecnologías

- Node.js
- MongoDB Atlas
- Mongoose
- dotenv
- MongoDB Compass y mongosh para la configuración y las consultas documentadas en el informe

## Modelo de datos

La base de datos se llama `restaurante_tpi` y contiene tres colecciones:

- **clientes:** nombre, teléfono, dirección embebida y campos de baja lógica.
- **platos:** nombre, descripción, categoría, precio y campos de baja lógica.
- **pedidos:** referencia al cliente, fecha, dirección de entrega, ítems embebidos, total, estado y campos de baja lógica.

Se combinan dos estrategias de modelado:

- **Embedding:** la dirección se almacena dentro del cliente y los ítems dentro del pedido. Cada pedido conserva una copia de la dirección de entrega, el nombre y el precio de los platos para mantener la información histórica.
- **Linking:** los pedidos utilizan `cliente_id` y sus ítems incluyen `plato_id` para relacionarse con las otras colecciones.

La baja lógica se representa mediante `activo: false` y una fecha en `fecha_baja`, conservando el documento almacenado.

## Archivos del repositorio

| Archivo | Descripción |
|---|---|
| `app.js` | Conexión a Atlas, definición de esquemas y demostración CRUD |
| `reset.js` | Utilidad auxiliar para modificar los datos después de las pruebas; ver sus limitaciones más abajo |
| `package.json` | Configuración y dependencias del proyecto |
| `package-lock.json` | Versiones de las dependencias para reproducir la instalación |

El archivo `.env` debe crearse localmente y no debe publicarse en el repositorio.

## Requisitos

- Node.js y npm compatibles con las dependencias del proyecto.
- Conexión a Internet.
- Un usuario de MongoDB Atlas con permisos sobre `restaurante_tpi`.
- Acceso de red autorizado en Atlas.

Para reproducir la demostración completa, la base debe contar previamente con platos y pedidos activos. La carga inicial se encuentra documentada en el informe del TPI.

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/JSoza1/tpi-bd-2.git
cd tpi-bd-2
```

Instalar las dependencias:

```bash
npm ci
```

Crear un archivo `.env` en la raíz del proyecto:

```env
MONGODB_URI=mongodb+srv://<USUARIO>:<PASSWORD>@<HOST>/restaurante_tpi?authSource=admin
```

Reemplazar los valores entre `< >` por las credenciales y el host correspondientes. Las credenciales para la corrección se proporcionan por separado.

## Ejecución de la demostración

```bash
node app.js
```

El script ejecuta las siguientes operaciones y muestra los resultados en la consola:

1. **CREATE:** registra un cliente de prueba llamado Sofía Martínez.
2. **READ:** consulta los platos con `activo: true`.
3. **UPDATE:** selecciona un plato activo y aumenta su precio en $500.
4. **DELETE mediante baja lógica:** selecciona un pedido activo, cambia `activo` a `false` y registra `fecha_baja`.

Finalmente, cierra la conexión a MongoDB.

La ejecución modifica los datos: cada nueva ejecución crea otro cliente, vuelve a incrementar un precio y puede dar de baja otro pedido. Si no existen platos o pedidos activos, informa que no encontró registros para esas operaciones.

El proyecto se ejecuta como un script de consola. No incluye servidor HTTP, endpoints ni interfaz gráfica.

## Utilidad de pruebas: reset.js

Se ejecuta mediante:

```bash
node reset.js
```

Actualmente realiza estas acciones:

- Elimina físicamente los clientes cuyo nombre sea `Sofía Martínez`.
- Reactiva todos los pedidos que tengan `activo: false` y limpia su `fecha_baja`.
- Asigna un precio de $1.500 a un plato activo.

**Esta utilidad no recupera exactamente el estado anterior ni reemplaza un respaldo.** No conserva los valores previos y puede afectar registros ajenos a la última ejecución.

Su eliminación física de clientes debe corregirse para cumplir con la regla de baja lógica del TPI.

## Consultas complementarias

El informe documenta consultas realizadas desde mongosh:

- Un índice simple sobre el teléfono del cliente.
- Un índice compuesto sobre los campos `activo` y `estado` de los pedidos.
- Comparaciones mediante `explain("executionStats")`.
- Un pipeline de agregación para obtener el importe total vendido y la cantidad de pedidos activos con estado `entregado`.

Estas operaciones no se ejecutan automáticamente desde `app.js`.

## Alcance académico

El objetivo del proyecto es demostrar el modelado documental, la conexión cliente-servidor y las operaciones básicas de persistencia con MongoDB Atlas.

El informe del TPI complementa el código con la justificación del modelo, los esquemas, las capturas de ejecución y los procedimientos de respaldo y recuperación.
