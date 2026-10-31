// IMPORTACIÓN DE LA LIBRERÍA MONGOOSE
// Esto nos permite utilizar metodos como mongoose.connect(), mongoose.Schema, mongoose.model(), etc.
import mongoose from 'mongoose';
// CARGA DE VARIABLE DE ENTORNO
import 'dotenv/config';
// IMPORTACIÓN DE LA LIBRERÍA READLINE PARA INTERACTUAR CON EL USUARIO
import { createInterface } from 'node:readline/promises';

// CADENA DE CONEXIÓN OBTENIDA DESDE VARIABLE DE ENTORNO
const CONNECTION_STRING = process.env.MONGODB_URI+'restaurante_tpi'; // Se agrega el nombre de la base de datos

// VALIDACIÓN PREVENTIVA DE CREDENCIALES DE CONEXIÓN
if (!CONNECTION_STRING) {
  console.error('Error: La variable de entorno MONGODB_URI no está definida en el archivo .env');
  // Termina el programa para evitar intentar conectar sin la URI.
  // Por convención, un código distinto de 0 indica que terminó con error.
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
    trim: true,
    // Validación para asegurar que el nombre no esté vacío
    required: true 
  },
  telefono: {
    type: String,
    trim: true,
    required: true
  },
  // Objeto embebido para la dirección del cliente
  direccion: {
    calle: { type: String, required: true, trim: true },
    numero: { type: String, required: true, trim: true }
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
  // timestamps: true agrega automáticamente los campos createdAt y updatedAt a cada documento.
  timestamps: true 
});

// ESQUEMA 2: PLATOS
// Representa los platos del menú del restaurante
const platoSchema = new mongoose.Schema({
  nombre: { 
    type: String,
    trim: true,
    required: true 
  },
  descripcion: { 
    type: String
  },
  categoria: { 
    type: String,
    trim: true,
    required: true
  },
  precio: { 
    type: Number,
    required: true,
    // Exige que el precio sea un número positivo mayor a cero
    min: 1,
    // Validación para asegurar que el precio sea un número entero
    validate: Number.isInteger
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
    default: Date.now,
    required: true
  },
  direccion_entrega: {
    calle: { type: String, required: true, trim: true },
    numero: { type: String, required: true, trim: true }
  },
  // Embedding: Lista de items del pedido, cada item contiene información del plato y cantidad.
  items: {
    type: [{
      // Linking: Referencia al plato que se está pidiendo
      plato_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Plato', required: true },
      nombre: { type: String, required: true, trim: true },
      precio_unitario: {
        type: Number,
        required: true,
        min: 1,
        validate: Number.isInteger
      },
      cantidad: {
        type: Number,
        required: true,
        min: 1,
        validate: Number.isInteger
      }
      // Nota: En el campo items, se hace un patron hibrido, ya que se almacena el plato_id (linking) y también se embeben los datos del plato (nombre, precio_unitario, cantidad) para mantener un registro histórico del pedido. Porque si el plato cambia de nombre o precio en el futuro, el pedido original no se ve afectado.
    }],
    // Mongoose pasa los ítems del pedido a esta función; solo acepta la lista si tiene al menos uno.
    // El operador ?. evita un error si items no existe o es null.
    validate: items => items?.length > 0
  },
  total: { type: Number, required: true, min: 1 },
  estado: {
    type: String,
    required: true,
    // Validación para asegurar que el estado del pedido sea uno de los valores permitidos
    enum: ['pendiente', 'en_preparacion', 'entregado', 'cancelado']
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

// CREACIÓN DE MODELOS
// mongosee.model() es un método que nos permite crear un modelo a partir de un esquema definido previamente.
// nos permite interactuar con la colección correspondiente en la base de datos, realizar operaciones CRUD y consultas.
// habilita metodos como find(), findOne(), create(), updateOne(), deleteOne(), etc.
// requiere 3 parámetros: el nombre del modelo, el esquema y el nombre de la colección en la base de datos.
const Cliente = mongoose.model('Cliente', clienteSchema, 'clientes');
const Plato = mongoose.model('Plato', platoSchema, 'platos');
const Pedido = mongoose.model('Pedido', pedidoSchema, 'pedidos');

// Función asíncrona para ejecutar las operaciones CRUD sobre la colección clientes.
async function ejecutarCRUD() {
  // Creación de la interfaz de lectura para interactuar con el usuario desde la consola.
  const readline = createInterface({ input: process.stdin, output: process.stdout });

  // Manejo de errores con try-catch-finally.
  try {
    // CONEXIÓN A LA BASE DE DATOS
    await mongoose.connect(CONNECTION_STRING);
    console.log('Conexión exitosa a MongoDB Atlas');

    // BUCLE PRINCIPAL DEL PROGRAMA
    while (true) {
      console.log('\n--- CRUD de clientes ---');
      console.log('1. CREATE - Registrar cliente');
      console.log('2. READ - Consultar clientes activos');
      console.log('3. UPDATE - Modificar cliente');
      console.log('4. DELETE - Baja lógica de cliente');
      console.log('0. Salir');
      // Solicita al usuario que elija una opción y la almacena en la variable opcion.
      const opcion = (await readline.question('Elegí una opción: ')).trim();
      // Si el usuario elige '0', se rompe el bucle y se sale del programa.
      if (opcion === '0') break;

      try {
        switch (opcion) {
          case '1': {
            // CREATE: los datos se solicitan al usuario; activo y fecha_baja usan los valores del esquema.
            const nombre = await readline.question('Nombre: ');
            // await readline.question() devuelve una promesa que se resuelve con la respuesta del usuario.
            const telefono = await readline.question('Teléfono: ');
            const calle = await readline.question('Calle: ');
            const numero = await readline.question('Número: ');
            const nuevoCliente = await Cliente.create({
              nombre,
              telefono,
              direccion: { calle, numero }
            });
            console.log('Nuevo cliente registrado con ID:', nuevoCliente._id);
            break;
          }
          case '2': {
            // READ: muestra todos los clientes activos con sus ID.
            const clientes = await Cliente.find({ activo: true });
            // Si no hay clientes activos, se muestra un mensaje; de lo contrario, se listan los clientes.
            if (clientes.length === 0) console.log('No hay clientes activos.');
            else clientes.forEach(cliente => console.log(`ID: ${cliente._id}`, cliente));
            break;
          }
          case '3': {
            // UPDATE: reemplaza los datos del cliente activo indicado por su ID.
            const id = (await readline.question('ID del cliente a actualizar: ')).trim();
            const cliente = await Cliente.findOne({ _id: id, activo: true });
            // Si no se encuentra un cliente activo con el ID proporcionado, se muestra un mensaje y se rompe el bucle.
            if (!cliente) {
              console.log('No se encontró un cliente activo con ese ID.');
              break;
            }
            // Solicita al usuario los nuevos datos del cliente y actualiza el documento en la base de datos.
            const nombre = await readline.question('Nombre: ');
            const telefono = await readline.question('Teléfono: ');
            const calle = await readline.question('Calle: ');
            const numero = await readline.question('Número: ');
            // Actualiza los campos del cliente con los nuevos valores proporcionados por el usuario.
            cliente.set({ nombre, telefono, direccion: { calle, numero } });
            // Guarda los cambios en la base de datos y muestra el cliente actualizado.
            await cliente.save();
            console.log('Cliente actualizado:', cliente);
            break;
          }
          case '4': {
            // DELETE: baja lógica por ID y muestra el documento modificado.
            const id = (await readline.question('ID del cliente a dar de baja: ')).trim();
            // findOneAndUpdate() busca un cliente activo por su ID y lo actualiza a inactivo, registrando la fecha de baja.
            const cliente = await Cliente.findOneAndUpdate(
              { _id: id, activo: true },
              { $set: { activo: false, fecha_baja: new Date() } },
              { returnDocument: 'after' }
            );
            // Si se encuentra un cliente activo con el ID proporcionado, se muestra el cliente dado de baja
            if (cliente) console.log('Cliente dado de baja lógicamente:', cliente);
            // de lo contrario, se indica que no se encontró.
            else console.log('No se encontró un cliente activo con ese ID.');
            break;
          }
          default:
            console.log('Opción no válida.');
        }
      } catch (error) {
        console.error('No se pudo completar la operación:', error.message);
      }
    }
  } catch (error) {
    console.error('Error en la conexión o ejecución:', error);
    process.exitCode = 1;
  } finally {
    // Cierra la entrada y la conexión a MongoDB al salir del programa.
    readline.close();
    await mongoose.connection.close();
    console.log('\nConexión a MongoDB Atlas cerrada correctamente.');
  }
}

// EJECUCIÓN DE LA FUNCIÓN PRINCIPAL
ejecutarCRUD();
