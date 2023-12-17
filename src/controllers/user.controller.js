import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'


export const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken
        const refreshToken = user.generateRefreshToken

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating the token.")
    }
}


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


    try {
        const { username, email, fullname, password } = req.body; // req.body helps in retreiving the information 
        // console.log("email: ", email);

    if ([fullname, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "fullname is required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists.")
    }

    // checking for the files uploaded by the user
    // console.log("req.files:", req.files);
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path; // it basically points to the local path of the avatar image, which is in server and hasn't been uploaded to cloudinary.
    // console.log("avatarLocalPath:", avatarLocalPath);

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // const coverImageLocalPath = req.files?.coverImage[0]?.path; // it basically points to the local path of the cover image, which is in server and hasn't been uploaded to cloudinary.

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

    } catch (error) {
        console.error(error);
        return res.status(error.statusCode || 500).json({
            error: {
                message: error.message || "Internal Server Error",
            },
        });
    }
    
    
})



export const loginUser = asyncHandler( async(req, res) => {

    // implementing the logic
    // req body -> data
    // username or email
    // password check 
    // access and refresh token
    // sending the cookie
    const { email, username, password } = req.body;

    if (!email || !username) {
        throw new ApiError(400, "Username or Password is required.")
    }

    // finding the user via its email or username and checking if it actually exists or not
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(400, "User doesn't exist.")
    }


    // now checking whether the password entered is right or not. For this, we'll be using the user.models.js ka isPasswordCorrect method to identify whether the password is right or not.
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credentials.")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", accessToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User logged in successfully."
        )
    )

})



export const logoutUser = asyncHandler( async(req, res) => {

    // implementing the logic
    // removing the cookies we setup earlier to checkout/remove the user
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User loggged Out."))

})



export default registerUser
