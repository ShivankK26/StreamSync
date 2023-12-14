import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'


const registerUser = asyncHandler( async(req, res) => {
    // res.status(200).json({
    //     message: "ok"
    // })

    // implementing the logic
    // get user details from the frontend
    // getting the validation from the user whether the entered data is right or not
    // check if the user already exists or not via username, email
    // check for images and avatar
    // if they are there then upload it to cloudinary, checking if the avatar has been successfully uploaded my multer or not
    // create a user entry in the database
    // remove the password and refresh token field from the response
    // check for the user creation
    // return the result


    // Now, extracting the information from the models
    const { username, email, fullname, password } = req.body; // req.body helps in retreiving the information 
    console.log("email: ", email);

    if ([fullname, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "fullname is required")
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists.")
    }

    // checking for the files uploaded by the user
    const avatarLocalPath = req.files?.avatar[0]?.path; // it basically points to the local path of the avatar image, which is in server and hasn't been uploaded to cloudinary.

    const coverImageLocalPath = req.files?.coverImage[0]?.path; // it basically points to the local path of the cover image, which is in server and hasn't been uploaded to cloudinary.

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required.")
    }


    // uploading the images to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required.")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase() 
    })

    
    // checking if the user has been created or not
    const createdUser = await User.findById(user._id).select( // under the select method we write the fields which we dont want as output and we define these fields inside a stirng
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the suer")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})


export default { registerUser }