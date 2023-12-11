import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'


const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // cloudinary url
        required: true
    },
    coverImage: {
        type: String, // cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        requ,ired: [true, "Password is required."]
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true })


userSchema.pre("save", async function(next){ // this is basically a middleware provided by mongoose which one can use to execute some functionalities just before an event for eg- in our case before saving we encrypt the passwords, etc information.
    if(!this.isModified("password")) return next();
    this.password = bcrypt.hash(this.password, 10)
    next()
}) 


// like we defined a hook above, we can also define some custom hooks based upon our needs
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}


userSchema.methods.generateAccessToken = function(){ // again we're creating a custom hook which will be useful for generation of access tokens everytime
    return jwt.sign( 
        {
            _id: this.id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


userSchema.methods.generateRefreshToken = function(){ // again we're creating a custom hook which will be useful for generation of access tokens everytime
    return jwt.sign( // as refresh token refreshes itself again and again we need not to give a lot of information to it again and again. Only id is enough
        {
            _id: this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema)