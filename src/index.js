import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
import dotenv from 'dotenv'
import connectDB from "./db/index.js";
dotenv.config({path: './env'})
import { app } from "./app.js";




connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGODB Connection Failed.", err);
})





//import express from 'express'

// const app = express()

// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.log("ERR: ", error);
//             throw error
//         })

//         app.listen(process.env.PORT, () =>{
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.log(error);
//         throw error
//     }
// } )()