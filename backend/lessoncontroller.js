const con = require('./connector');
const jwt = require('jsonwebtoken');
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var auth = require('./authentication')

/*
function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
}
*/

function initLessonRoutes(app) {

    app.post('/createlesson', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        try {
            let validation = await con.query(`select id from modules where id = ?`, [requestbody.id_module]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_MODULE_ID" });
                return;
            }

            //data validation
            validation = await con.query(`select id from lessons where id_module = ? and ? between startdate and enddate 
            or ? between startdate and enddate`, [requestbody.id_module, requestbody.startdate, requestbody.enddate]);
            if (validation[0].length < 1) {
                //lesson creation
                const [data] = await con.execute(`insert into lessons (startdate,enddate,argument,note,id_module) values (?,?,?,?,?)`, [requestbody.startdate, requestbody.enddate, requestbody.argument, requestbody.note, requestbody.id_module]);
                res.json(data);
            } else {
                res.json({ error: true, errormessage: "LESSON_EXISTS" });
            }

        } catch (err) {
            console.log("Createlesson Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.patch('/updatelesson/:id', jsonParser, auth.authenticateToken, async (req, res) => {
        let patchid = req.params.id;
        let requestbody = req.body;
        try {

            //data validation
            let validation = await con.query(`select id from modules where id = ?`, [patchid]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_MODULE_ID" });
                return;
            }

            validation = await con.query(`select id from lessons where id_module = ? and ? between startdate and enddate 
            or ? between startdate and enddate and id <> ?`, [requestbody.id_module, requestbody.startdate, requestbody.enddate, patchid]);
            if (validation[0].length > 0) {
                res.json({ error: true, errormessage: "LESSON_EXISTS" });
                return;
            }

            //update lesson
            const data = await con.execute(`update lessons set startdate = ?, enddate = ?, argument = ?, note = ?, id_module = ? where id = ?`, [requestbody.startdate, requestbody.enddate, requestbody.argument, requestbody.note, requestbody.id_module, patchid]);
            res.json(data);

        } catch (err) {
            console.log("Updatelesson Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }

    })

    app.delete('/deletelesson/:id', auth.authenticateToken, async (req, res) => {
        let deleteid = req.params.id;
        try {

            //data validation
            const validation = await con.query(`select id from lessons where id = ?`, [deleteid]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_LESSON_ID" });
                return;
            }

            //delete lesson
            const data = await con.execute(`delete from lessons where id = ?`, [deleteid]);
            res.json(data);
        } catch (err) {
            console.log("Deletelesson Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.get('/getalllessons', auth.authenticateToken, async (req, res) => {
        pagenumber = (req.query.pagenumber - 1) * req.query.pagesize;
        pagesize = (req.query.pagenumber * req.query.pagesize) - 1;
        try {
            const [data] = await con.execute(`select * from lessons LIMIT ${pagenumber},${pagesize}`);

            res.json(data);
        } catch (err) {
            console.log("Getalllessons Error:" + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.get('/getcalendar', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera il calendario
        //filtrato per anno/mese
    })

    app.post('/generatelessons', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        let weekday = requestbody.day;
        let currentdate = new Date(requestbody.startdate);
        let enddate = new Date(requestbody.enddate)
        let tomorrow = new Date();
        try {
            let insertedLessons = [];

            while (currentdate <= enddate) {
                tomorrow.setDate(currentdate.getDate() + 1);
                currentdate = tomorrow;
                if (currentdate.getDay() == weekday) {
                    let startdate = new Date(currentdate.getFullYear(), currentdate.getMonth(), currentdate.getDate(), requestbody.starthour, requestbody.startminute);
                    let finaldate = new Date(startdate.getFullYear(), startdate.getMonth(), startdate.getDate(), requestbody.endhour, requestbody.endminute)
                    const [data] = await con.execute(`insert into lessons (startdate,enddate,argument,note,id_module) values (?,?,?,?,?)`, [startdate, finaldate, null, null, requestbody.id_module]);
                    insertedLessons.push(data);
                }
            }
            res.json({ success: true, insertedLessons });
        }
        catch (err) {
            console.log("generatelessons Error:" + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.post('/signpresence', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        let currentdate = new Date();
        //let utc1 = new Date(currentdate.getFullYear(), currentdate.getMonth(), currentdate.getDate(), currentdate.getHours() + 1, currentdate.getMinutes(), currentdate.getSeconds());
        try {
            const [validation] = await con.query(`select * from lesson_presence where id_lessons = ? and id_user = ?`, [requestbody.id_lessons, requestbody.id_user]);
            //console.log(validation.length);
            if (validation.length > 0) {
                res.json({ error: true, errormessage: "USER_ALREADY_SIGNED" });
                return;
            }
            else {
                //firma presenza
                const [data] = await con.execute(`insert into lesson_presence (id_lessons,id_user,signdate) values (?,?,?)`, [requestbody.id_lessons, requestbody.id_user, currentdate]);
                res.json(data);
            }
        }
        catch (err) {
            console.log("signpresence Error:" + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    });

    app.get('/getlessonpresences', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        try {
            //recupera l'elenco delle presenze
            //dato l'id lezione
            const [data] = await con.execute(`select * from lesson_presesence where id_lessons = ?`, [requestbody.id_lessons]);
            res.json(data);

        } catch (err) {
            console.log("getlessonpresences Error:" + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.get('/getuserpresences', jsonParser, auth.authenticateToken, async (req, res) => {
        //let requestbody = req.body;
        try {
            //recupera l'elenco delle presenze
            //dell'utente corrente, da data a data
            const [data] = await con.execute(`select lp.id_lessons, lp.signdate, u.lastname, u.firstname from lesson_presence lp inner join users u on lp.id_user=u.id where lp.id_user = ? order by lp.id_lessons`, [req.user.userid]);
            res.json(data);

        } catch (err) {
            console.log("getuserpresences Error:" + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.get('/getmodulepresences', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        try {
            //recupera l'elenco delle presenze
            //per il modulo indicato; opzionale filtro per utente
            const [data] = await con.execute(`select lp.id_lessons, u.lastname, u.firstname, lp.signdate from lesson_presence lp inner join lessons l on lp.id_lessons=l.id inner join users u on lp.id_user=u.id where l.id_module = ?`, [requestbody.id_module/*, requestbody.lastname, requestbody.firstname*/]); /*and u.lastname = ? and u.firstname = ?*/
            res.json(data);

        } catch (err) {
            console.log("getmodulepresences Error:" + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.get('/calculateuserpresences', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera l'elenco delle presenze
        //utente e calcola la percentuale presenze rispetto al totale ore di ogni modulo
    })

}

module.exports = initLessonRoutes;