const con = require('./connector');
const jwt = require('jsonwebtoken');
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user

        next()
    })
}

function initLessonRoutes(app) {

    app.post('/createlesson', jsonParser, authenticateToken, async (req, res) => {
        let requestbody = req.body;
        try {

            //data validation
            let validation = await con.query(`select id from lessons where startdate = ?`, [requestbody.startdate]);
            if (validation[0].length == 1) {
                res.json({ error: true, errormessage: "LESSON_EXISTS" });
                return;
            }

            validation = await con.query(`select id from lessons where enddate = ?`, [requestbody.enddate]);
            if (validation[0].length == 1) {
                res.json({ error: true, errormessage: "LESSON_EXISTS" });
                return;
            }

            //lesson creation
            const [data] = await con.execute(`insert into lessons (startdate,enddate,argument,note) values (?,?,?,?)`, [requestbody.startdate, requestbody.enddate, requestbody.argument, requestbody.note]);
            res.json(data);


        } catch (err) {
            console.log("Createlesson Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.patch('/updatelesson/:id', jsonParser, authenticateToken, async (req, res) => {
        let patchid = req.params.id;
        let requestbody = req.body;
        try {

            //data validation
            let validation = await con.query(`select id from lessons where id = ?`, [patchid]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_LESSON_ID" });
                return;
            }

            validation = await con.query(`select id from lessons where startdate = ? and id <> ?`, [requestbody.startdate, patchid]);
            if (validation[0].length > 0) {
                res.json({ error: true, errormessage: "LESSON_EXISTS" });
                return;
            }

            //update lesson
            const data = await con.execute(`update lessons set startdate = ?, enddate = ?, argument = ?, note = ? where id = ?`, [requestbody.startdate, requestbody.enddate, requestbody.argument, requestbody.note, patchid]);
            res.json(data);

        } catch (err) {
            console.log("Updatelesson Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }

    })

    app.delete('/deletelesson/:id', authenticateToken, async (req, res) => {
        let deleteid = req.params.id;
        try {

            //data validation
            const validation = await con.query(`select id from modules where id = ?`, [deleteid]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_MODULE_ID" });
                return;
            }

            //delete lesson
            const data = await con.execute(`delete from modules where id = ?`, [deleteid]);
            res.json(data);
        } catch (err) {
            console.log("Deletelesson Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.get('/getalllessons', authenticateToken, async (req, res) => {
        pagenumber = (req.query.pagenumber - 1) * req.query.pagesize;
        pagesize = (req.query.pagenumber * req.query.pagesize) - 1;
        try {
            const [data] = await con.execute(`select * from modules LIMIT ${pagenumber},${pagesize}`);

            res.json(data);
        } catch (err) {
            console.log("Getalllessons Error:" + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.get('/getuserlessons', authenticateToken, async (req, res) => {
        try {
            const [data] = await con.execute(`select distinct m.* from modules m 
            inner join users_modules um on um.id_module = m.id
            where um.id_user = ?`, [req.user.userid]);
            res.json(data);
        } catch (err) {
            console.log("Getusersmodules Error:" + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.get('/getcalendar', jsonParser, authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera il calendario
        //filtrato per anno/mese
    })

    app.post('/generateevents', jsonParser, authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //genera degli eventi ripetitivi, da data a data e per quale giorno
    })

    app.post('/signpresence', jsonParser, authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //firma presenza
    })

    app.get('/getlessonpresences', jsonParser, authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera l'elenco delle presenze
        //dato l'id lezione
    })

    app.get('/getuserpresences', jsonParser, authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera l'elenco delle presenze
        //dell'utente corrente, da data a data
    })

    app.get('/getmodulepresences', jsonParser, authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera l'elenco delle presenze
        //per il modulo indicato; opzionale filtro per utente
    })

    app.get('/calculateuserpresences', jsonParser, authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera l'elenco delle presenze
        //utente e calcola la percentuale presenze rispetto al totale ore di ogni modulo
    })

}

module.exports = initLessonRoutes;