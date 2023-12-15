import { Router } from "express";
import registerUser from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'


const router = Router()


// Here. we're injecting a middleware in between this route so that the information goes through a processing and is validated.
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )


export default router;