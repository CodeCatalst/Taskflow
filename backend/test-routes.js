import express from 'express';
import userRoutes from './routes/users.js';

const app = express();
app.use('/api/users', userRoutes);

const routes = [];
app._router.stack.forEach(middleware => {
  if (middleware.route) {
    routes.push(Object.keys(middleware.route.methods)[0].toUpperCase() + ' ' + middleware.route.path);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach(handler => {
      if (handler.route) {
        const path = middleware.regexp.source.replace('\\/?', '').replace('(?=\\/|$)', '').replace(/\\\//g, '/');
        routes.push(Object.keys(handler.route.methods)[0].toUpperCase() + ' ' + path + handler.route.path);
      }
    });
  }
});

routes.forEach(r => );
