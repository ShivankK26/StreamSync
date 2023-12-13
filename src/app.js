import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser' // used to perform CRUD operations in the cookies of user's browser

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN, // used in middlewares, for cross platform efficient working
    credentials: true
})) 

app.use(express.json({ limit: "16kb" })) // it controls the limit of the json data being received so that the server doesn't crash
app.use(express.urlencoded({ extended: true, limit: "16kb" })) // it basically reads the entire url of a webpage even if there is any other sign like % between two characters.
app.use(express.static('public')) // a middleware used for accessing all the data in public folder
app.use(cookieParser())


// importing the routes
import userRouter from './routes/user.routes.js'



// declaring the routes. Basically this is our API.
app.use("/api/v1/users", userRouter) // it looks something like this- http://localhost:8000/api/v1/users/register


export { app }