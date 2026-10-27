// IMPORTACIÓN DE LA LIBRERÍA MONGOOSE
// Esto nos permite utilizar metodos como mongoose.connect(), mongoose.Schema, mongoose.model(), etc.
import mongoose from 'mongoose';

// CARGA DE VARIABLE DE ENTORNO
import 'dotenv/config';

// CADENA DE CONEXIÓN A LA DB, OBTENIDA DESDE VARIABLE DE ENTORNO
const CONNECTION_STRING = process.env.MONGODB_URI;

// VALIDACIÓN PREVENTIVA DE CREDENCIALES DE CONEXIÓN
if (!CONNECTION_STRING) {
  console.error('Error: La variable de entorno MONGODB_URI no está definida en el archivo .env');
  // Salida del proceso con código de error 1 para indicar fallo en la ejecución
  process.exit(1);
}

// DEFINICIÓN DE ESQUEMAS
// Un esquema define la estructura, reglas y validaciones que tendran los documentos de la colección en MongoDB.

// ESQUEMA 1: CLIENTES 
// Instanciacion - mongosee.Schema() nos permite crear un esquema 
const clienteSchema = new mongoose.Schema({
  nombre: { 
    // Tipo de dato String para el campo nombre
    type: String, 
    // Validación para asegurar que el nombre no esté vacío
    required: true 
  },
  telefono: {
    type: String,
    required: true
  },
  // Objeto embebido para la dirección del cliente
  direccion: {
    calle: { type: String, required: true },
    numero: { type: String, required: true }
  },
  // Baja lógica true = activo, false = dado de baja
  activo: { 
    type: Boolean, 
    default: true 
  }, 
  // Fecha de baja lógica (null si está activo)
  fecha_baja: { 
    type: Date, 
    default: null 
  }
}, { 
  timestamps: true 
});

// ESQUEMA 2: PLATOS
// Representa los platos del menú del restaurante
const platoSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true 
  },
  descripcion: { 
    type: String
  },
  categoria: { 
    type: String 
  },
  precio: { 
    type: Number, 
    required: true 
  },
  activo: { 
    type: Boolean, 
    default: true 
  },
  fecha_baja: { 
    type: Date, 
    default: null 
  }
}, { 
  timestamps: true 
});

// ESQUEMA 3: PEDIDOS
// Representa los pedidos realizados por los clientees, incluyendo Linking en cliente_id y Embedding en items
const pedidoSchema = new mongoose.Schema({
  cliente_id: { 
    // Linking: Referencia al cliente que realizó el pedido
    type: mongoose.Schema.Types.ObjectId, 
    // Referencia al modelo Cliente para establecer la relación
    ref: 'Cliente', 
    // Validación para asegurar que el campo cliente_id no esté vacío
    required: true 
  },
  fecha: { 
    type: Date, 
    default: Date.now 
  },
  direccion_entrega: {
    calle: { type: String, required: true },
    numero: { type: String, required: true }
  },
  // Embedding: Lista de items del pedido, cada item contiene información del plato y cantidad.
  items: [{
    // Linking: Referencia al plato que se está pidiendo
    plato_id: mongoose.Schema.Types.ObjectId,
    nombre: { type: String, required: true },
    precio_unitario: Number,
    cantidad: Number
    // Nota: En el campo items, se hace un patron hibrido, ya que se almacena el plato_id (linking) y también se embeben los datos del plato (nombre, precio_unitario, cantidad) para mantener un registro histórico del pedido. Porque si el plato cambia de nombre o precio en el futuro, el pedido original no se ve afectado.
  }],
  total: Number,
  estado: String,
  activo: { 
    type: Boolean, 
    default: true 
  },
  fecha_baja: { 
    type: Date, 
    default: null 
  }
}, { 
  timestamps: true 
});

// CREACIÓN DE MODELOS
// mongosee.model() es un método que nos permite crear un modelo a partir de un esquema definido previamente.
// nos permite interactuar con la colección correspondiente en la base de datos, realizar operaciones CRUD y consultas.
// habilita metodos como find(), findOne(), create(), updateOne(), deleteOne(), etc.
// requiere 3 parámetros: el nombre del modelo, el esquema y el nombre de la colección en la base de datos.
const Cliente = mongoose.model('Cliente', clienteSchema, 'clientes');
const Plato = mongoose.model('Plato', platoSchema, 'platos');
const Pedido = mongoose.model('Pedido', pedidoSchema, 'pedidos');

// Funcion asíncrona para ejecutar las operaciones CRUD, permite el uso de await para esperar la resolución de promesas
async function ejecutarCRUD() {
  // Manejo de errores con try-catch-finally
  try {
    // CONEXIÓN A LA BASE DE DATOS
    await mongoose.connect(CONNECTION_STRING);
    console.log('Conexión exitosa a MongoDB Atlas');

    // CREATE (Colección: Clientes)
    console.log('\n--- 1. CREATE (Colección: Clientes) ---');
    // Creación de un nuevo cliente utilizando el modelo Cliente y el método create()
    // Se usa await para esperar la confirmación de que el cliente fue creado, antes de continuar con el código
    const nuevoCliente = await Cliente.create({
      nombre: 'Sofía Martínez',
      telefono: '+54 9 11 9999-8888',
      direccion: { 
        calle: 'Av. Corrientes', 
        numero: '1234' 
      },
      activo: true,
      fecha_baja: null
    });
    // Se imprime en consola el ID del nuevo cliente creado, que es generado automáticamente por MongoDB
    console.log('Nuevo cliente registrado con ID:', nuevoCliente._id);

    // READ (Colección: Platos)
    console.log('\n--- 2. READ (Colección: Platos) ---');
    // Filtro activo para respetar la baja lógica
    const platosActivos = await Plato.find({ activo: true });
    // Se imprime en consola la cantidad de platos activos encontrados y sus detalles
    console.log(`Se encontraron ${platosActivos.length} platos disponibles en el menú.`);
    console.log('Platos activos:', platosActivos);

    // UPDATE (Colección: Platos)
    console.log('\n--- 3. UPDATE (Colección: Platos) ---');
    // Se busca un plato activo para actualizar su precio, se utiliza findOne() para obtener un solo documento
    const platoActualizacion = await Plato.findOne({ activo: true });
    
    // Si se encuentra un plato activo, se actualiza su precio sumando 500 al precio actual utilizando updateOne()
    if (platoActualizacion) {
      const updateResult = await Plato.updateOne(
        // Se utiliza el ID del plato encontrado para identificar el documento a actualizar
        { _id: platoActualizacion._id },
        // Se utiliza $set para actualizar el campo precio del plato, sumando 500 al precio actual
        { $set: { precio: platoActualizacion.precio + 500 } }
      );
      
      // Se imprime en consola la confirmación de la actualización y los precios antes y después de la actualización
      console.log('Confirmación de actualización del plato en la Base de Datos:', updateResult);
      console.log(`Plato '${platoActualizacion.nombre}': precio anterior $${platoActualizacion.precio}`);
      console.log(`nuevo precio $${platoActualizacion.precio + 500}`);
    
    // Si no se encuentra ningún plato activo, se imprime un mensaje indicando que no hay platos para actualizar
    } else {
      console.log('No se encontraron platos activos para actualizar.');
    }

    // DELETE - Utilizando Baja Lógica (Colección: Pedidos)
    console.log('\n--- 4. DELETE - Baja Lógica (Colección: Pedidos) ---');
    // Se busca un pedido activo para darlo de baja lógicamente, se utiliza findOne() para obtener un solo documento
    const pedidoADarDeBaja = await Pedido.findOne({ activo: true });
    
    // Si se encuentra un pedido activo, se actualiza su estado a inactivo y se registra la fecha de baja utilizando updateOne()
    if (pedidoADarDeBaja) {
      const bajaResult = await Pedido.updateOne(
        { _id: pedidoADarDeBaja._id },
        { 
          // Se utiliza $set para actualizar los campos activo y fecha_baja del pedido
          $set: { 
            activo: false, 
            fecha_baja: new Date() 
          } 
        }
      );
      // Se imprime en consola la confirmación de la baja lógica del pedido y su ID
      console.log(`Pedido ${pedidoADarDeBaja._id} dado de baja lógicamente:`, bajaResult);
    // Si no se encuentra ningún pedido activo, se imprime un mensaje indicando que no hay pedidos para dar de baja
    } else {
      console.log('No se encontraron pedidos activos para dar de baja.');
    }

  // Manejo de errores en caso de que ocurra algún problema durante la conexión o ejecución de las operaciones CRUD
  } catch (error) {
    console.error('Error en la conexión o ejecución:', error);
  // Finalmente, se cierra la conexión a la base de datos para liberar recursos y evitar problemas de conexión
  } finally {
    await mongoose.connection.close();
    console.log('\nConexión a MongoDB Atlas cerrada correctamente.');
  }
}

// EJECUCIÓN DE LA FUNCIÓN PRINCIPAL
ejecutarCRUD();