import express from "express";
const router = express.Router();
import {
  creatgroupchat,
  getGroupchat,
  getMyGroups,
  Addmembers,
  removeMembers,
  leavegroup,
  sendAttachments,
  getMessage,
  updateGroupName,
  deleteMessage,
  getChatDetails
} from "../controllers/Chat.js";
import { isAuthenticated } from "../middleware/auth.js";
import {attachmentsMulter} from '../middleware/multer.js'


router.use(isAuthenticated);

router.post("/chat", creatgroupchat);
router.get("/my", getGroupchat);
router.get("/my/group", getMyGroups);
router.put("/addmembers", Addmembers);
router.put("/removemember", removeMembers);
router.delete("/leave/:chatId", leavegroup);
router.post("/message",attachmentsMulter,sendAttachments);
router.get("/message/:id",getChatDetails)
router.route("/group/chat/:chatId").get(getMessage).put(updateGroupName).delete(deleteMessage)

export default router;
