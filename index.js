var koa = require('koa'),
  app = koa(),
  port = 3000;

app.use(function *(){
  this.body = 'Hello World';
});

console.log('Listening to Port', port);
app.listen(port);
