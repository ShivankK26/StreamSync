import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';


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

    if (!email && !username) {
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
            $unset: {
                refreshToken: 1 // removes the field from the doc
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


export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
    
    if (incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request.")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token.")
        }
    
    
        // Checking if the previously entered token were right or not
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used.")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, newRefreshToken, options},
                "Access Token Refreshed."
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})


export const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


export const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})


export const updateAccountDetails = asyncHandler(async(req, res) => {
    const { fullname, email } = req.body;

    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully."))
})



export const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file path is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (avatar.url) {
        throw new ApiError(400, "avatar file url is not there.")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    )
})


export const updateUserCover = asyncHandler(async(req, res) => {
    const coverLocalPath = req.file?.path

    if (!coverLocalPath) {
        throw new ApiError(400, "cover file path is missing")
    }

    const avatar = await uploadOnCloudinary(coverImageLocalPath)

    if (avatar.url) {
        throw new ApiError(400, "cover file url is not there.")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully."))
})


export const getUserChannelProfile = asyncHandler(async(req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    // Here, we'll use MongoDB aggregation pipelines
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions", // Here, we write the name of the MongoDB model the actual model is Subscription, but we wrote subscriptions because in MongoDB the name of database is stored like that only.
                localField: "_id",
                foreignField: "channel",
                as: "subscribers" 
            }
        },
        {
            $lookup: {
                from: "subscriptions", // Here, we write the name of the MongoDB model the actual model is Subscription, but we wrote subscriptions because in MongoDB the name of database is stored like that only.
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo" 
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist");
    }

    return res.status(200).json(new ApiResponse(200, channel[0] ,"User channel fetched successfully."))
})


export const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully."))
})


export default registerUser