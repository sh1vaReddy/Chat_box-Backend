import express from 'express'
const router=express.Router()
import {Register,Login,getmyprofile,logout,
    SerachUser, 
    SendRequest, 
    AcceptRequest,
    getAllNotification,getmyfriendlist} from '../controllers/User.js'
import {singleAvatar} from '../middleware/multer.js'
import {isAuthenticated} from '../middleware/auth.js'


router.post("/reg",singleAvatar,Register)
router.post("/login",Login)
router.get("/me",isAuthenticated,getmyprofile)
router.get("/logout",isAuthenticated,logout)
router.get("/serach",isAuthenticated,SerachUser)
router.put("/SendRequest",isAuthenticated,SendRequest)
router.put("/Accept",isAuthenticated,AcceptRequest)
router.get("/Notification",isAuthenticated,getAllNotification)
router.get("/friendlist",isAuthenticated,getmyfriendlist)
export default router;