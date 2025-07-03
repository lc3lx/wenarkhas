const path = require("path");
const http = require('http');
const socketIo = require('socket.io');

const express = require("express");
require("dotenv").config();
//dotenv.config({ path: "config.env" });
const morgan = require("morgan");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

//dotenv.config({ path: ".env" });

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WenArkhas API',
      version: '1.0.0',
      description: 'API documentation for WenArkhas delivery system',
      contact: {
        name: 'WenArkhas Support',
        email: 'support@wenarkhas.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.wenarkhas.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format: Bearer &lt;token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              example: 'Error message'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './docs/*.js',
    './routes/*.js'
  ]
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
const ApiError = require("./utils/apiError");
const globalError = require("./middlewares/errorMiddleware");
const dbConnection = require("./config/database");
// Routes
const mountRoutes = require("./routes");

// Serve Swagger UI
app.use('/api-docs', 
  swaggerUi.serve, 
  swaggerUi.setup(swaggerDocs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WenArkhas API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      persistAuthorization: true
    }
  })
);

// تخزين المستخدمين المتصلين
const connectedUsers = {};

// Connect with db
dbConnection();

// express app
const app = express();
const server = http.createServer(app);

// إعداد Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// جعل io متاحاً في التطبيق
app.set('io', io);
global.io = io;
global.connectedUsers = connectedUsers;

// معالجة اتصالات WebSocket
io.on('connection', (socket) => {
  console.log('مستخدم متصل:', socket.id);

  // عند تسجيل دخول المستخدم
  socket.on('register', (userId) => {
    connectedUsers[userId] = socket.id;
    console.log(`المستخدم ${userId} متصل بمعرف: ${socket.id}`);
  });

  // عند انقطاع الاتصال
  socket.on('disconnect', () => {
    console.log('مستخدم انقطع:', socket.id);
    // إزالة المستخدم من القائمة عند انقطاع الاتصال
    const userId = Object.keys(connectedUsers).find(key => connectedUsers[key] === socket.id);
    if (userId) {
      delete connectedUsers[userId];
      console.log(`تم إزالة المستخدم ${userId} من المستخدمين المتصلين`);
    }
  });
});

// Enable other domains to access your application
app.use(cors());
app.options("*", cors());

// compress all responses
app.use(compression());

// Middlewares
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

// Limit each IP to 100 requests per `window` (here, per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message:
    "Too many accounts created from this IP, please try again after an hour",
});

// Apply the rate limiting middleware to all requests
app.use("/api", limiter);

// Middleware to protect against HTTP Parameter Pollution attacks
app.use(
  hpp({
    whitelist: [
      "price",
      "sold",
      "quantity",
      "ratingsAverage",
      "ratingsQuantity",
    ],
  })
);

// Mount Routes
mountRoutes(app);

app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handling middleware for express
app.use(globalError);

const PORT = process.env.PORT || 8000;

// استبدل app.listen بـ server.listen لتفعيل WebSocket
const httpServer = server.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
  console.log(`WebSocket server is running on port ${PORT}`);
});

// Handle rejection outside express
process.on("unhandledRejection", (err) => {
  console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
  httpServer.close(() => {
    console.error(`Shutting down....`);
    process.exit(1);
  });
});
