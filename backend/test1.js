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