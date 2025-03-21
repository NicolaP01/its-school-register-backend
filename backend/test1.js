const initModuleRoutes = require("./modulecontroller");

let currentdate = new Date("2025-03-19");
let finaldate = new Date("2025-03-31")
let tomorrow = new Date();
while (currentdate < finaldate) {
    tomorrow.setUTCDate(currentdate.getUTCDate() + 1);
    currentdate = tomorrow;
    console.log(currentdate);
}
console.log(currentdate.getUTCDate());
console.log(finaldate.getUTCDate());
console.log(currentdate.getDay())
let cudate = new Date();
let utc1 = new Date(currentdate.getFullYear(), currentdate.getMonth(), currentdate.getDate(), currentdate.getHours()+1, currentdate.getMinutes(), currentdate.getSeconds());
console.log(utc1)

/*
INNER JOIN table2 ON table1.column = table2.column
INNER JOIN table3 ON table2.column = table3.column

select lp.id_lessons, m.name, concat(u.lastname, u.firstname) as fullname, lp.sign_date 
from lesson_presence lp 
inner join lessons l 
on lp.id_lessons=l.id 
inner join users u 
on lp.id_user=u.id 
inner join modules m
on l.id_module=m.id
where l.id_module = ? 
order by lp.id_lessons`, [requestbody.id_module]);
*/