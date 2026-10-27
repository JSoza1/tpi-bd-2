import mongoose from 'mongoose';

import 'dotenv/config';

const CONNECTION_STRING = process.env.MONGODB_URI;

if (!CONNECTION_STRING) {
  console.error('Error: La variable de entorno MONGODB_URI no está definida en el archivo .env');
  process.exit(1);
}

const clienteSchema = new mongoose.Schema({
  nombre: String
}, { timestamps: true });

const platoSchema = new mongoose.Schema({
  nombre: String,
  precio: Number,
  activo: Boolean
}, { timestamps: true });

const pedidoSchema = new mongoose.Schema({
  activo: Boolean,
  fecha_baja: Date
}, { timestamps: true });

const Cliente = mongoose.model('Cliente', clienteSchema, 'clientes');
const Plato = mongoose.model('Plato', platoSchema, 'platos');
const Pedido = mongoose.model('Pedido', pedidoSchema, 'pedidos');

async function resetTotal() {
  try {
    await mongoose.connect(CONNECTION_STRING);
    console.log('Conexión establecida. Iniciando reset total...\n');

    // Borrar TODAS las Sofías creadas (hayan sido 1, 2 o más)
    const resClientes = await Cliente.deleteMany({ nombre: 'Sofía Martínez' });
    console.log(`Clientes eliminados (${resClientes.deletedCount}):`, resClientes);

    // Reactivar TODOS los pedidos dados de baja
    const resPedidos = await Pedido.updateMany(
      { activo: false },
      { 
        $set: { 
          activo: true, 
          fecha_baja: null 
        } 
      }
    );
    console.log(`Pedidos reactivados (${resPedidos.modifiedCount}):`, resPedidos);

    // Fijar el precio base del plato
    // Nota: Como $500 se pudieron haber sumado varias veces, asignamos un valor base fijo directo.
    const resPlatos = await Plato.updateOne(
      { activo: true },
      { $set: { precio: 1500 } }
    );
    console.log('Precio del plato reestablecido a valor base:', resPlatos);

    console.log('\nReset total completado con éxito.');

  } catch (error) {
    console.error('Error durante el reset total:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión cerrada.');
  }
}

resetTotal();