import express from 'express';
import handlebars from 'express-handlebars';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import __dirname from './utils.js'; 
import viewsRouter from './routes/views.routes.js';
import productsRouter from './routes/products.routes.js';
import authRouter from './routes/auth.router.js';
import path from 'path'; 

const app = express();

// Configuración del motor de plantillas
app.engine('hbs', handlebars.engine({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'), 
  partialsDir: path.join(__dirname, 'views/partials'),  
}));
app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'hbs');

// Middleware para manejar sesiones con connect-mongo
const mongoUrl = 'mongodb+srv://liamur:$2a$12$ZF5kKIfFM2d0RrQ492Yvd.7EiCNs2VX.Y9MH0.ITq7og9xkX6Jl3K@liamur.ew426gj.mongodb.net/?retryWrites=true&w=majority';

const connectMongoDB = async () => {
  try {
      await mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }); // Conecta a MongoDB
      console.log("Conectado con exito a MongoDB usando Moongose.");
  } catch (error) {
      console.error("No se pudo conectar a la BD usando Moongose: " + error);
      process.exit();
  }
};
connectMongoDB();


const mongoStore = MongoStore.create({
  mongoUrl: mongoUrl,
  dbName: 'desafio_08',
});

// Configuración de express-session
app.use(session({
  secret: 'hola', // Clave secreta para firmar la sesión
  resave: false,
  saveUninitialized: false,
  store: mongoStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // Impide que JavaScript acceda a la cookie de sesión
    sameSite: 'strict', // Evita la vulnerabilidad de CSRF
  },
}));

// Middleware para manejar JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para archivos estáticos
app.use(express.static(path.join(__dirname, 'public'))); 

// Middleware para cifrar contraseñas antes de guardarlas
app.use(async (req, res, next) => {
  if (req.body.password) {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      req.body.password = hashedPassword;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Rutas
app.use('/', viewsRouter);
app.use('/api/products', productsRouter);
app.use('/auth', authRouter);

export default app;
