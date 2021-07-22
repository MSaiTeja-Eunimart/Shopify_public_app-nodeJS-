let express = require('express');
let app = express();
let session = require('express-session');
let cookie = require('cookie');
let merchantRouter = require('./routes/merchantRoutes');

app.listen(process.env.PORT || 3000 , ()=>{
    console.log("Server started Port Number : " + 3000);
});
app.use('/',merchantRouter);