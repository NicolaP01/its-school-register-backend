const crypto = require('crypto');
const express = require('express');
var cors = require('cors');
const jwt= require('jsonwebtoken');
const app = express();
var bodyParser = require('body-parser');
const con = require('./connector.js');
const port = 3000;

//generate secret key (only 1 time)
/*let secreykey = require('crypto').randomBytes(64).toString('hex');
console.log(secreykey);*/  

var jsonParser = bodyParser.json()

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

// Enable CORS for all routes
app.use(cors(corsOptions));

app.post('/login', jsonParser, async (req, res) => {
  let requestbody = req.body;
  try {
    var hash = crypto.createHash('sha256').update(requestbody.password).digest('hex');
    const data = await con.execute(`select id from users where email = ? and password = ? and active = 1`, [requestbody.email, hash]);
    if (data[0].length < 1) {
      res.json({ error: true, errormessage: "INVALID_USERPWD" });
    }
    else {
      const token=generateAccessToken({username: requestbody.email});
      res.json({ error: false, errormessage: "", token: token });
    }
  } catch (err) {
    console.log(err);
    res.json({ error: true, errormessage: "GENERIC_ERROR" });
  }
});

app.post('/createuser', authenticateToken, jsonParser, async (req, res) => {

  let requestbody = req.body;

  // user validation
  try {
    const validation = await con.execute('select * from users where fiscalcode = ?', [requestbody.fiscalcode]);

    if (validation[0].length < 1) {
      var hash = crypto.createHash('sha256').update(requestbody.password).digest('hex');
      // user creation
      const [data] = await con.execute(`insert into users (password, lastname, firstname, phone, email, active, fiscalcode) values (?,?,?,?,?,?,?)`, [hash, requestbody.lastname, requestbody.firstname, requestbody.phone, requestbody.email, requestbody.active, requestbody.fiscalcode]);
      res.json(data);
    }
    else {
      res.json({ error: true, errormessage: "FISCALCODE_EXISTS" });
    }


  } catch (err) {
    console.log(err);
    res.json({ error: true, errormessage: "GENERIC_ERROR" });
  }
});

app.delete('/deleteuser/:id', authenticateToken, async (req, res) => {
  let deleteid = req.params.id;

  try {
    const data = await con.execute('delete from users where id = ?', [deleteid]);
    if (data[0].length < 1) {
      res.json({ error: true, errormessage: "INVALID_ID" });
    }
    else{
      res.json(data);
    }
  } catch (err) {
    console.error(err);
    res.json({ error: true, errormessage: "DELETE_ERROR" });
  }
})


app.get('/getallusers', authenticateToken, async (req, res) => {
  let startvalue = (req.query.startvalue - 1) * req.query.endvalue;
  let endvalue = (req.query.startvalue * req.query.endvalue) - 1;
  try {
    const [data] = await con.execute(`select * from users LIMIT ${startvalue},${endvalue}`);
    data.forEach((row) => {
      console.log(`${row.id} = ${row.lastname} ${row.firstname}`);
    });

    res.json(data);
  } catch (err) {
    console.log(err);
    res.json({ error: true, errormessage: "retrieve users error" });
  }
})

app.get('/getuser', authenticateToken, async (req, res) => {
  
  try {
    const [data] = await con.execute(`select * from users where id = ? LIMIT 1`, [req.query.id]);
    
    data.forEach((row) => {
      console.log(`${row.id} = ${row.lastname} ${row.firstname}`);
    });

    res.json(data);

  } catch (err) {
    console.log("Getuser Error:" + err);
    res.json({ error: true, errormessage: "GENERIC_ERROR"});
  }
})

app.post('/Register', jsonParser, (req, res) => {
  console.log(req.body);
  res.statusCode = 200;
  res.send('Register')
})


app.listen(port, () => {
  console.log(`Its register app listening on port ${port}`)
})

// inizializzazione connessione
/*const connection = mysql.createConnection({
    host     : '127.0.0.1', // macchina locale, localhost == 127.0.0.1
    port     : 3306,
    user     : 'its_user',
    password : 'its@123456789',
    database : 'registro'
});

connection.connect(function (err) {
  // Check if there is a connection error
  if (err) {
      console.log("connection error", err.stack);
      return;
  }

  console.log(`connected to database`);
});

connection.end((err) => {
  // The connection is terminated gracefully
  // Ensures all remaining queries are executed
  // Then sends a quit packet to the MySQL server.
});
*/

function generateAccessToken(username) {
  return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    console.log(err)
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}